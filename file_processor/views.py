import os
import csv
import redis
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.conf import settings
from .models import FileUpload
from .serializers import FileUploadSerializer

def upload_page(request):
    """
    Render the file upload page
    """
    return render(request, 'file_processor/upload.html')

def is_redis_available():
    """
    Check if Redis is available and accessible
    """
    try:
        redis_url = settings.CELERY_BROKER_URL
        if redis_url.startswith('redis://'):
            # Parse redis://localhost:6379/0 format
            import urllib.parse
            parsed = urllib.parse.urlparse(redis_url)
            host = parsed.hostname or 'localhost'
            port = parsed.port or 6379
            db = int(parsed.path.lstrip('/')) if parsed.path else 0
            
            r = redis.Redis(host=host, port=port, db=db, socket_connect_timeout=1)
            r.ping()
            return True
    except Exception:
        pass
    return False

@api_view(['POST'])
@csrf_exempt
def upload_file(request):
    """
    Upload a CSV file for processing
    Always returns immediately, processing happens asynchronously
    """
    try:
        if 'file' not in request.FILES:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        uploaded_file = request.FILES['file']
        
        # Validate file type
        if not uploaded_file.name.endswith('.csv'):
            return Response({'error': 'Only CSV files are allowed'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate file size (optional limit)
        max_file_size = 100 * 1024 * 1024  # 100MB limit
        if uploaded_file.size > max_file_size:
            return Response({'error': 'File size exceeds 100MB limit'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Save file to media directory
        file_name = default_storage.save(
            f"uploads/{uploaded_file.name}", 
            ContentFile(uploaded_file.read())
        )
        
        # Create file upload record
        file_upload = FileUpload.objects.create(  # pyright: ignore[reportAttributeAccessIssue]
            file_name=uploaded_file.name,
            file_size=uploaded_file.size,
            status='pending'
        )
        
        # Always use async processing with Celery, even if Redis check fails
        # This prevents the web worker from being blocked during file processing
        try:
            from .tasks import process_csv_file
            process_csv_file.delay(file_upload.id, file_name)  # pyright: ignore[reportFunctionMemberAccess]
            print("Processing asynchronously with Celery")
        except Exception as e:
            print(f"Failed to start async task: {e}")
            # If Celery fails, mark the upload as failed immediately
            file_upload.status = 'failed'
            file_upload.error_message = f'Failed to start processing: {str(e)}'
            file_upload.save()
            return Response(
                {'error': f'Failed to start processing: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        serializer = FileUploadSerializer(file_upload)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        # Log the error for debugging
        print(f"Upload error: {str(e)}")
        import traceback
        traceback.print_exc()
        
        # Return JSON error response
        return Response(
            {'error': f'Upload failed: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
def file_upload_status(request, upload_id):
    """
    Get the status of a file upload
    """
    try:
        file_upload = FileUpload.objects.get(id=upload_id)  # pyright: ignore[reportAttributeAccessIssue]
        serializer = FileUploadSerializer(file_upload)
        return Response(serializer.data)
    except FileUpload.DoesNotExist:  # pyright: ignore[reportAttributeAccessIssue]
        return Response({'error': 'File upload not found'}, status=status.HTTP_404_NOT_FOUND)