import os
import csv
import time
from django.db import transaction
from django.conf import settings
from products.models import Product
from .models import FileUpload

def process_csv_file(upload_id, file_path):
    """
    Process a CSV file and import products
    Uses highly memory-efficient line-by-line processing to avoid memory issues
    """
    file_upload = None
    start_time = time.time()  # Track start time for upload duration
    
    try:
        file_upload = FileUpload.objects.get(id=upload_id)  # type: ignore
        file_upload.status = 'processing'
        file_upload.save()
        
        full_file_path = os.path.join(settings.MEDIA_ROOT, file_path)
        
        # Process file line by line to minimize memory usage
        processed_rows = 0
        
        # First pass: count total rows (memory efficient)
        with open(full_file_path, 'r', encoding='utf-8') as csvfile:
            total_rows = sum(1 for line in csvfile) - 1  # -1 for header
            file_upload.total_rows = total_rows
            file_upload.save()
        
        # Second pass: process line by line
        with open(full_file_path, 'r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            
            # Process each row individually to minimize memory footprint
            for row in reader:
                # Process each row
                sku = row.get('sku', '').upper()
                name = row.get('name', '')
                description = row.get('description', '')
                price = row.get('price', 0)
                
                # Create or update product
                with transaction.atomic():  # type: ignore
                    product, created = Product.objects.update_or_create(  # type: ignore
                        sku=sku,
                        defaults={
                            'name': name,
                            'description': description,
                            'price': price,
                            'active': True
                        }
                    )
                
                processed_rows += 1
                
                # Update progress less frequently to reduce database writes
                # For better real-time feedback, update every 5 rows for small files, 
                # every 20 rows for medium files, and every 100 rows for large files
                if total_rows <= 100:
                    update_frequency = 5
                elif total_rows <= 1000:
                    update_frequency = 20
                else:
                    update_frequency = 100
                    
                if processed_rows % update_frequency == 0 or processed_rows == total_rows:
                    progress = int((processed_rows / total_rows) * 100)
                    file_upload.progress = progress
                    file_upload.processed_rows = processed_rows
                    
                    # Calculate and store upload duration
                    elapsed_time = time.time() - start_time
                    file_upload.upload_duration = elapsed_time
                    
                    file_upload.save()
            
            file_upload.status = 'completed'
            
            # Store final upload duration
            elapsed_time = time.time() - start_time
            file_upload.upload_duration = elapsed_time
            
            file_upload.save()
            
    except Exception as e:
        if file_upload:
            file_upload.status = 'failed'
            file_upload.error_message = str(e)
            
            # Store upload duration even on failure
            elapsed_time = time.time() - start_time
            file_upload.upload_duration = elapsed_time
            
            file_upload.save()
        raise e