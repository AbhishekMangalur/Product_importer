from django.shortcuts import render
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework import generics
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Webhook
from .serializers import WebhookSerializer
from typing import TYPE_CHECKING
import requests
import time

if TYPE_CHECKING:
    from django.db.models import QuerySet
    from .models import Webhook as WebhookModel

def webhooks_list_view(request):
    """
    Render the webhooks list page
    """
    return render(request, 'webhooks/list.html')

@method_decorator(csrf_exempt, name='dispatch')
@authentication_classes([])
@permission_classes([])
class WebhookListView(generics.ListCreateAPIView):
    queryset: 'QuerySet[WebhookModel]' = Webhook.objects.all()
    serializer_class = WebhookSerializer

@method_decorator(csrf_exempt, name='dispatch')
@authentication_classes([])
@permission_classes([])
class WebhookDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset: 'QuerySet[WebhookModel]' = Webhook.objects.all()
    serializer_class = WebhookSerializer

@api_view(['POST'])
@csrf_exempt
@authentication_classes([])
@permission_classes([])
def test_webhook(request, pk):
    """
    Test a webhook by sending a sample payload
    """
    try:
        webhook = Webhook.objects.get(id=pk)  # pyright: ignore[reportAttributeAccessIssue]
        
        # Create a sample payload
        payload = {
            "event_type": webhook.event_type,
            "timestamp": time.time(),
            "data": {
                "message": "This is a test webhook"
            }
        }
        
        # Send the request and measure response time
        start_time = time.time()
        try:
            response = requests.post(webhook.url, json=payload, timeout=10)
            response_time = (time.time() - start_time) * 1000  # Convert to milliseconds
            
            return Response({
                "status": "success",
                "response_code": response.status_code,
                "response_time": round(response_time, 2),
                "response_body": response.text[:200]  # Limit response body length
            })
        except requests.exceptions.RequestException as e:
            response_time = (time.time() - start_time) * 1000
            return Response({
                "status": "error",
                "error": str(e),
                "response_time": round(response_time, 2)
            })
            
    except Webhook.DoesNotExist:  # pyright: ignore[reportAttributeAccessIssue]
        return Response({"error": "Webhook not found"}, status=404)