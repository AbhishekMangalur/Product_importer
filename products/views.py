from django.shortcuts import render
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.decorators import api_view
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import Product
from .serializers import ProductSerializer
from .filters import ProductFilter

def product_list_view(request):
    """
    Render the main product list page
    """
    return render(request, 'products/list.html')

@method_decorator(csrf_exempt, name='dispatch')
class ProductListCreateView(generics.ListCreateAPIView):
    queryset = Product.objects.all() # type: ignore[reportAttributeAccessIssue]
    serializer_class = ProductSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = ProductFilter
    search_fields = ['sku', 'name', 'description']
    ordering_fields = ['sku', 'name', 'price', 'created_at']
    ordering = ['-created_at']

@method_decorator(csrf_exempt, name='dispatch')
class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.all() # type: ignore[reportAttributeAccessIssue]
    serializer_class = ProductSerializer

@api_view(['POST'])
def bulk_delete_products(request):
    """
    Delete all products with confirmation
    """
    if request.data.get('confirm') == True:
        count = Product.objects.count() # type: ignore[reportAttributeAccessIssue]
        Product.objects.all().delete() # type: ignore[reportUnknownMemberType]
        return Response({
            'message': f'Successfully deleted {count} products',
            'deleted_count': count
        }, status=status.HTTP_200_OK)
    else:
        return Response({
            'error': 'Confirmation required to delete all products'
        }, status=status.HTTP_400_BAD_REQUEST)