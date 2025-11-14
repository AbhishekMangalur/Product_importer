from django.db import models

class FileUpload(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    file_name = models.CharField(max_length=255)
    file_size = models.BigIntegerField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    progress = models.IntegerField(default=0)  # type: ignore[reportArgumentType]
    processed_rows = models.IntegerField(default=0)  # type: ignore[reportArgumentType]
    total_rows = models.IntegerField(default=0)  # type: ignore[reportArgumentType]
    upload_duration = models.FloatField(default=0.0)  # type: ignore[reportArgumentType] # Duration in seconds
    error_message = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'file_uploads'
        ordering = ['-created_at']
        
    def __str__(self):
        return f"{self.file_name} - {self.status} ({self.progress}%)"