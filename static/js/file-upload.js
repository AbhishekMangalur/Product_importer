document.addEventListener('DOMContentLoaded', function() {
    const uploadForm = document.getElementById('uploadForm');
    const progressSection = document.getElementById('progressSection');
    const progressBar = document.getElementById('progressBar');
    const statusText = document.getElementById('statusText');
    const processedRows = document.getElementById('processedRows');
    const totalRows = document.getElementById('totalRows');
    const errorMessage = document.getElementById('errorMessage');
    const uploadDuration = document.getElementById('uploadDuration');

    // Variables for tracking progress
    let currentProgress = 0;
    let targetProgress = 0;
    let progressInterval = null;
    let startTime = null;
    let timerInterval = null;
    let fakeProgressInterval = null;
    let fakeProgressActive = false;

    if (uploadForm) {
        uploadForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const fileInput = document.getElementById('csvFile');
            const file = fileInput.files[0];
            
            if (!file) {
                alert('Please select a file');
                return;
            }

            // Reset progress tracking
            currentProgress = 0;
            targetProgress = 0;
            fakeProgressActive = true;
            
            if (progressInterval) {
                clearInterval(progressInterval);
                progressInterval = null;
            }
            
            // Reset and start timer
            if (timerInterval) {
                clearInterval(timerInterval);
                timerInterval = null;
            }
            
            // Clear any existing fake progress
            if (fakeProgressInterval) {
                clearInterval(fakeProgressInterval);
                fakeProgressInterval = null;
            }
            
            startTime = new Date();
            startTimer();
            startFakeProgress(); // Start simulating progress for upload phase

            // Show progress section
            progressSection.style.display = 'block';
            renderProgress(0, 0, 0, 'Uploading file...', 0);

            // Create FormData
            const formData = new FormData();
            formData.append('file', file);

            // Upload file
            fetch('/api/file-processor/upload/', {
                method: 'POST',
                body: formData
            })
            .then(response => {
                // Check if response is OK
                if (!response.ok) {
                    return response.text().then(text => {
                        throw new Error(`HTTP ${response.status}: ${text}`);
                    });
                }
                return response.json();
            })
            .then(data => {
                // Stop fake progress when real progress starts
                stopFakeProgress();
                
                if (data.error) {
                    stopTimer();
                    showError(data.error);
                    return;
                }
                
                // Start polling for progress
                pollFileStatus(data.id);
            })
            .catch(error => {
                // Stop fake progress on error
                stopFakeProgress();
                stopTimer();
                
                // Try to parse error as JSON, fallback to text
                if (error.message.includes('HTTP')) {
                    showError(error.message);
                } else {
                    showError('Upload failed: ' + error.message);
                }
            });
        });
    }

    function startFakeProgress() {
        // Simulate progress from 0% to 70% during upload phase
        let fakeProgress = 0;
        fakeProgressActive = true;
        
        fakeProgressInterval = setInterval(() => {
            if (fakeProgressActive && fakeProgress < 70) {
                fakeProgress += 0.5; // Increment by 0.5% every 100ms
                renderProgress(fakeProgress, 0, 0, 'Uploading file...', 0);
            } else if (fakeProgressActive) {
                // Cap at 70% and wait for real progress
                renderProgress(70, 0, 0, 'Processing file...', 0);
            }
        }, 100);
    }

    function stopFakeProgress() {
        fakeProgressActive = false;
        if (fakeProgressInterval) {
            clearInterval(fakeProgressInterval);
            fakeProgressInterval = null;
        }
    }

    function startTimer() {
        // Update timer every 100ms for smooth display
        timerInterval = setInterval(() => {
            if (startTime) {
                const elapsed = (new Date() - startTime) / 1000; // Convert to seconds
                const durationSeconds = elapsed.toFixed(1);
                uploadDuration.textContent = `${durationSeconds} seconds`;
                uploadDuration.style.display = 'inline';
            }
        }, 100);
    }

    function stopTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }

    function pollFileStatus(uploadId) {
        fetch(`/api/file-processor/status/${uploadId}/`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            // Update progress with smooth animation
            updateProgress(
                data.progress, 
                data.processed_rows, 
                data.total_rows, 
                data.status,
                data.upload_duration || 0
            );
            
            if (data.status === 'completed' || data.status === 'failed') {
                // Stop timer and any ongoing progress animation
                stopTimer();
                if (progressInterval) {
                    clearInterval(progressInterval);
                    progressInterval = null;
                }
                
                if (data.status === 'failed') {
                    showError(data.error_message || 'Import failed');
                } else {
                    // Ensure we show 100% at completion
                    renderProgress(100, data.processed_rows, data.total_rows, data.status, data.upload_duration || 0);
                    statusText.textContent = 'Import Complete';
                }
                return;
            }
            
            // Continue polling
            setTimeout(() => pollFileStatus(uploadId), 500);
        })
        .catch(error => {
            // Stop timer and any ongoing progress animation on error
            stopTimer();
            if (progressInterval) {
                clearInterval(progressInterval);
                progressInterval = null;
            }
            showError('Failed to get status: ' + error.message);
        });
    }

    function updateProgress(percentage, processed, total, status, duration) {
        // Set the target progress
        targetProgress = percentage;
        
        // If we're already at the target, just render it
        if (currentProgress === targetProgress) {
            renderProgress(currentProgress, processed, total, status, duration);
            return;
        }
        
        // Clear any existing interval
        if (progressInterval) {
            clearInterval(progressInterval);
        }
        
        // Animate progress smoothly from current to target
        progressInterval = setInterval(() => {
            if (currentProgress < targetProgress) {
                currentProgress++;
                renderProgress(currentProgress, processed, total, status, duration);
            } else if (currentProgress > targetProgress) {
                currentProgress--;
                renderProgress(currentProgress, processed, total, status, duration);
            } else {
                // We've reached the target
                clearInterval(progressInterval);
                progressInterval = null;
            }
        }, 20); // Update every 20ms for smooth animation (50 FPS)
    }

    function renderProgress(percentage, processed, total, status, duration) {
        progressBar.style.width = percentage + '%';
        progressBar.textContent = percentage.toFixed(1) + '%';
        statusText.textContent = status.charAt(0).toUpperCase() + status.slice(1);
        processedRows.textContent = processed.toLocaleString();
        totalRows.textContent = total.toLocaleString();
        
        // Display upload duration if available from backend or if we have a timer running
        if (duration > 0) {
            // Use backend duration if available (more accurate)
            const durationSeconds = duration.toFixed(1);
            uploadDuration.textContent = `${durationSeconds} seconds`;
            uploadDuration.style.display = 'inline';
        } else if (startTime) {
            // Use real-time timer if backend duration not available yet
            const elapsed = (new Date() - startTime) / 1000; // Convert to seconds
            const durationSeconds = elapsed.toFixed(1);
            uploadDuration.textContent = `${durationSeconds} seconds`;
            uploadDuration.style.display = 'inline';
        } else {
            uploadDuration.style.display = 'none';
        }
    }

    function showError(message) {
        // Stop any ongoing progress animation
        if (progressInterval) {
            clearInterval(progressInterval);
            progressInterval = null;
        }
        
        // Stop fake progress if running
        stopFakeProgress();
        
        // Stop timer
        stopTimer();
        
        // Display error message
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        statusText.textContent = 'Failed';
        
        // Log error to console for debugging
        console.error('Upload error:', message);
    }
});