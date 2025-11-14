from django.db import models
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from django.db.models.manager import Manager

class Webhook(models.Model):
    if TYPE_CHECKING:
        objects: 'Manager'  # type: ignore[reportAttributeAccessIssue]
    
    WEBHOOK_EVENTS = [
        ('product_created', 'Product Created'),
        ('product_updated', 'Product Updated'),
        ('product_deleted', 'Product Deleted'),
        ('bulk_import_started', 'Bulk Import Started'),
        ('bulk_import_completed', 'Bulk Import Completed'),
        ('bulk_import_failed', 'Bulk Import Failed'),
    ]
    
    url = models.URLField(max_length=500)
    event_type = models.CharField(max_length=50, choices=WEBHOOK_EVENTS)
    is_active = models.BooleanField(default=True)  # type: ignore[reportArgumentType]
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'webhooks'
        
    def __str__(self):
        return f"{self.event_type} -> {self.url}"