from django.urls import path
from . import views

urlpatterns = [
    path('', views.WebhookListView.as_view(), name='webhook-list'),
    path('<int:pk>/', views.WebhookDetailView.as_view(), name='webhook-detail'),
    path('<int:pk>/test/', views.test_webhook, name='webhook-test'),
]