from django.urls import path
from . import views

urlpatterns = [
    # Web UI routes
    path('', views.webhooks_list_view, name='webhooks-list'),
]
