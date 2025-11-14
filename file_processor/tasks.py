import os
import csv
import time
from django.db import transaction, connection
from django.conf import settings
from products.models import Product
from .models import FileUpload

def process_csv_file(upload_id, file_path):
    """
    Process a CSV file and import products
    Uses batch processing with connection management for memory efficiency
    """
    file_upload = None
    start_time = time.time()  # Track start time for upload duration
    
    try:
        file_upload = FileUpload.objects.get(id=upload_id)  # type: ignore
        file_upload.status = 'processing'
        file_upload.save()
        
        full_file_path = os.path.join(settings.MEDIA_ROOT, file_path)
        
        # Process file in batches to minimize memory usage and database connections
        batch_size = 100  # Process 100 rows per batch
        processed_rows = 0
        
        # First pass: count total rows (memory efficient)
        with open(full_file_path, 'r', encoding='utf-8') as csvfile:
            total_rows = sum(1 for line in csvfile) - 1  # -1 for header
            file_upload.total_rows = total_rows
            file_upload.save()
        
        # Second pass: process in batches
        with open(full_file_path, 'r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            batch = []
            
            for row in reader:
                batch.append(row)
                processed_rows += 1
                
                # Process batch when it reaches batch_size or at the end of file
                if len(batch) >= batch_size or processed_rows == total_rows:
                    # Process this batch
                    try:
                        with transaction.atomic():  # type: ignore
                            for batch_row in batch:
                                # Process each row in the batch
                                sku = batch_row.get('sku', '').upper()
                                name = batch_row.get('name', '')
                                description = batch_row.get('description', '')
                                price = batch_row.get('price', 0)
                                
                                # Create or update product
                                product, created = Product.objects.update_or_create(  # type: ignore
                                    sku=sku,
                                    defaults={
                                        'name': name,
                                        'description': description,
                                        'price': price,
                                        'active': True
                                    }
                                )
                    except Exception as e:
                        # Log the error but continue processing
                        print(f"Error processing batch: {str(e)}")
                    
                    # Clear batch for next batch
                    batch = []
                    
                    # Close database connections periodically to prevent memory leaks
                    if processed_rows % 1000 == 0:
                        connection.close()
                    
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
                        try:
                            progress = int((processed_rows / total_rows) * 100)
                            file_upload.progress = progress
                            file_upload.processed_rows = processed_rows
                            
                            # Calculate and store upload duration
                            elapsed_time = time.time() - start_time
                            file_upload.upload_duration = elapsed_time
                            
                            file_upload.save()
                        except Exception as e:
                            print(f"Error updating progress: {str(e)}")
            
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
        print(f"Fatal error in process_csv_file: {str(e)}")
        raise e