from django.urls import path
from .views import upload_file, file_upload_status

urlpatterns = [
    path('upload/', upload_file, name='file-upload'),
    path('status/<int:upload_id>/', file_upload_status, name='file-upload-status'),
]