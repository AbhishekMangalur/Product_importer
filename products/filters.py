import django_filters
from .models import Product

class ProductFilter(django_filters.FilterSet):
    sku = django_filters.CharFilter(lookup_expr='icontains')  # Case-insensitive contains
    name = django_filters.CharFilter(lookup_expr='icontains')  # Case-insensitive contains
    description = django_filters.CharFilter(lookup_expr='icontains')  # Case-insensitive contains
    
    class Meta:
        model = Product
        fields = ['sku', 'active']