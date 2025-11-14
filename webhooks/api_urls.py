from django.urls import path
from .views import WebhookListView, WebhookDetailView, test_webhook

urlpatterns = [
    path('', WebhookListView.as_view(), name='webhook-list-create'),
    path('<int:pk>/', WebhookDetailView.as_view(), name='webhook-detail'),
    path('<int:pk>/test/', test_webhook, name='webhook-test'),
]