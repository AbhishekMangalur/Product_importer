document.addEventListener('DOMContentLoaded', function() {
    // Load webhooks on page load
    loadWebhooks();

    // Add webhook form handling
    const saveWebhookBtn = document.getElementById('saveWebhookBtn');
    if (saveWebhookBtn) {
        saveWebhookBtn.addEventListener('click', saveWebhook);
    }

    function loadWebhooks() {
        fetch('/api/webhooks/?format=json')
        .then(response => response.json())
        .then(data => {
            const tableBody = document.getElementById('webhooksTableBody');
            tableBody.innerHTML = '';

            // Use data.results instead of data directly since it's paginated
            data.results.forEach(webhook => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${webhook.url}</td>
                    <td>${webhook.event_type}</td>
                    <td>${webhook.is_active ? 'Active' : 'Inactive'}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary edit-btn" data-id="${webhook.id}">Edit</button>
                        <button class="btn btn-sm btn-outline-info test-btn" data-id="${webhook.id}">Test</button>
                        <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${webhook.id}">Delete</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });

            // Add event listeners to action buttons
            document.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    editWebhook(this.dataset.id);
                });
            });

            document.querySelectorAll('.test-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    testWebhook(this.dataset.id);
                });
            });

            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    deleteWebhook(this.dataset.id);
                });
            });
        })
        .catch(error => {
            console.error('Error loading webhooks:', error);
        });
    }

    function saveWebhook() {
        const form = document.getElementById('addWebhookForm');
        const webhookId = form.getAttribute('data-edit-id');
        
        const url = document.getElementById('url').value;
        const event_type = document.getElementById('event_type').value;
        const is_active = document.getElementById('is_active').checked;

        const webhookData = {
            url: url,
            event_type: event_type,
            is_active: is_active
        };

        let apiUrl, method;
        if (webhookId) {
            // Update existing webhook
            apiUrl = `/api/webhooks/${webhookId}/`;
            method = 'PUT';
        } else {
            // Create new webhook
            apiUrl = '/api/webhooks/';
            method = 'POST';
        }

        fetch(apiUrl, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(webhookData)
        })
        .then(response => {
            // Check if response is ok before trying to parse JSON
            if (!response.ok) {
                return response.text().then(text => {
                    throw new Error(`HTTP ${response.status}: ${text}`);
                });
            }
            return response.json();
        })
        .then(data => {
            // Close modal and refresh webhook list
            const modal = bootstrap.Modal.getInstance(document.getElementById('addWebhookModal'));
            modal.hide();
            loadWebhooks();
            
            // Reset form
            document.getElementById('addWebhookForm').reset();
            form.removeAttribute('data-edit-id');
            
            // Reset modal title and button text
            document.querySelector('#addWebhookModal .modal-title').textContent = 'Add Webhook';
            document.getElementById('saveWebhookBtn').textContent = 'Save Webhook';
        })
        .catch(error => {
            alert('Error saving webhook: ' + error.message);
        });
    }

    function editWebhook(id) {
        // Fetch the webhook data
        fetch(`/api/webhooks/${id}/`)
        .then(response => response.json())
        .then(webhook => {
            // Populate the form with existing data
            document.getElementById('url').value = webhook.url;
            document.getElementById('event_type').value = webhook.event_type;
            document.getElementById('is_active').checked = webhook.is_active;
            
            // Set a data attribute to indicate we're editing
            const form = document.getElementById('addWebhookForm');
            form.setAttribute('data-edit-id', id);
            
            // Change the modal title and save button text
            document.querySelector('#addWebhookModal .modal-title').textContent = 'Edit Webhook';
            document.getElementById('saveWebhookBtn').textContent = 'Update Webhook';
            
            // Show the modal
            const modal = new bootstrap.Modal(document.getElementById('addWebhookModal'));
            modal.show();
        })
        .catch(error => {
            alert('Error loading webhook: ' + error.message);
        });
    }

    function testWebhook(id) {
        // Show test modal
        const testModal = new bootstrap.Modal(document.getElementById('testWebhookModal'));
        const testResult = document.getElementById('testResult');
        testResult.innerHTML = '<p>Sending test request...</p>';
        testModal.show();

        // Send actual test request to the webhook
        fetch(`/api/webhooks/${id}/test/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({})
        })
        .then(response => {
            // Check if response is ok before trying to parse JSON
            if (!response.ok) {
                return response.text().then(text => {
                    throw new Error(`HTTP ${response.status}: ${text}`);
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.status === 'success') {
                testResult.innerHTML = `
                    <div class="alert alert-success">
                        <h5>Test Results</h5>
                        <p><strong>Status:</strong> Success</p>
                        <p><strong>Response Code:</strong> ${data.response_code}</p>
                        <p><strong>Response Time:</strong> ${data.response_time}ms</p>
                        <p><strong>Response Body:</strong> ${data.response_body || 'No response body'}</p>
                    </div>
                `;
            } else {
                testResult.innerHTML = `
                    <div class="alert alert-danger">
                        <h5>Test Results</h5>
                        <p><strong>Status:</strong> Failed</p>
                        <p><strong>Error:</strong> ${data.error}</p>
                        <p><strong>Response Time:</strong> ${data.response_time}ms</p>
                    </div>
                `;
            }
        })
        .catch(error => {
            testResult.innerHTML = `
                <div class="alert alert-danger">
                    <h5>Test Results</h5>
                    <p><strong>Status:</strong> Error</p>
                    <p><strong>Error:</strong> ${error.message}</p>
                </div>
            `;
        });
    }

    function deleteWebhook(id) {
        if (confirm('Are you sure you want to delete this webhook?')) {
            fetch(`/api/webhooks/${id}/`, {
                method: 'DELETE'
            })
            .then(response => {
                if (response.ok) {
                    loadWebhooks();
                } else {
                    return response.text().then(text => {
                        throw new Error(`HTTP ${response.status}: ${text}`);
                    });
                }
            })
            .catch(error => {
                alert('Error deleting webhook: ' + error.message);
            });
        }
    }
});