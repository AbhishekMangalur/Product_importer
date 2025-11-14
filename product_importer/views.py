from django.shortcuts import render

def index(request):
    """
    Render the main index page
    """
    return render(request, 'products/list.html')

def upload_view(request):
    """
    Render the file upload page
    """
    return render(request, 'file_processor/upload.html')