from django.urls import path
from .views import ProductListCreateView, ProductDetailView, bulk_delete_products

urlpatterns = [
    path('', ProductListCreateView.as_view(), name='product-list-create'),
    path('<int:pk>/', ProductDetailView.as_view(), name='product-detail'),
    path('bulk-delete/', bulk_delete_products, name='product-bulk-delete'),
]