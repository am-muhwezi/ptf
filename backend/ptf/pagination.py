"""
Centralized pagination utilities for the PTF application.
This module provides consistent pagination across all API endpoints.
"""

from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from rest_framework.response import Response


class PaginationHelper:
    """
    Centralized pagination helper for consistent pagination across all endpoints.
    """
    
    DEFAULT_PAGE_SIZE = 20
    MAX_PAGE_SIZE = 100
    
    @staticmethod
    def paginate_queryset(request, queryset, default_page_size=None):
        """
        Paginate a queryset based on request parameters.
        
        Args:
            request: Django request object
            queryset: Django queryset to paginate
            default_page_size: Default page size if not specified (defaults to 20)
        
        Returns:
            dict: Contains paginated data and metadata
        """
        # Get pagination parameters from request (support multiple parameter names)
        page = request.GET.get('page', 1)
        limit = request.GET.get('limit',
                               request.GET.get('page_size',
                                             default_page_size or PaginationHelper.DEFAULT_PAGE_SIZE))
        
        # Convert to integers and validate
        try:
            page = int(page)
            limit = int(limit)
        except (ValueError, TypeError):
            page = 1
            limit = default_page_size or PaginationHelper.DEFAULT_PAGE_SIZE
        
        # Enforce maximum page size to prevent abuse
        limit = min(limit, PaginationHelper.MAX_PAGE_SIZE)
        limit = max(limit, 1)  # Ensure minimum of 1
        page = max(page, 1)    # Ensure minimum page of 1
        
        # Create paginator
        paginator = Paginator(queryset, limit)
        
        try:
            paginated_data = paginator.page(page)
        except PageNotAnInteger:
            # If page is not an integer, deliver first page
            paginated_data = paginator.page(1)
            page = 1
        except EmptyPage:
            # If page is out of range, deliver last page
            paginated_data = paginator.page(paginator.num_pages)
            page = paginator.num_pages
        
        return {
            'objects': paginated_data.object_list,
            'page': page,
            'per_page': limit,
            'total_pages': paginator.num_pages,
            'total_count': paginator.count,
            'has_next': paginated_data.has_next(),
            'has_previous': paginated_data.has_previous(),
            'next_page': page + 1 if paginated_data.has_next() else None,
            'previous_page': page - 1 if paginated_data.has_previous() else None,
        }
    
    @staticmethod
    def create_paginated_response(request, queryset, data_serializer_func, 
                                success_message=None, default_page_size=None):
        """
        Create a complete paginated response.
        
        Args:
            request: Django request object
            queryset: Django queryset to paginate
            data_serializer_func: Function to serialize each object in the queryset
            success_message: Optional success message
            default_page_size: Default page size if not specified
        
        Returns:
            Response: DRF Response object with paginated data
        """
        # Get paginated data
        paginated_data = PaginationHelper.paginate_queryset(
            request, queryset, default_page_size
        )
        
        # Serialize the objects
        serialized_data = []
        for obj in paginated_data['objects']:
            try:
                serialized_obj = data_serializer_func(obj)
                serialized_data.append(serialized_obj)
            except Exception as e:
                # Log the error but continue with other objects
                print(f"Error serializing object {obj.id if hasattr(obj, 'id') else 'unknown'}: {e}")
                continue
        
        # Create response data with both new and legacy formats
        response_data = {
            'success': True,
            'data': serialized_data,
            'results': serialized_data,  # Alternative field name for compatibility
            'count': paginated_data['total_count'],  # Total count for pagination display
            'total': paginated_data['total_count'],  # Alternative field name
            'next': f"page={paginated_data['next_page']}" if paginated_data['has_next'] else None,
            'previous': f"page={paginated_data['previous_page']}" if paginated_data['has_previous'] else None,
            'pagination': {
                'page': paginated_data['page'],
                'page_size': paginated_data['per_page'],
                'per_page': paginated_data['per_page'],
                'total_pages': paginated_data['total_pages'],
                'total_count': paginated_data['total_count'],
                'has_next': paginated_data['has_next'],
                'has_previous': paginated_data['has_previous'],
                'next_page': paginated_data['next_page'],
                'previous_page': paginated_data['previous_page'],
            },
        }
        
        if success_message:
            response_data['message'] = success_message
        else:
            response_data['message'] = f"Retrieved {len(serialized_data)} items successfully"
        
        return Response(response_data)
    
    @staticmethod
    def create_simple_paginated_response(request, queryset, success_message=None):
        """
        Create a simple paginated response for querysets that don't need custom serialization.
        
        Args:
            request: Django request object
            queryset: Django queryset to paginate
            success_message: Optional success message
        
        Returns:
            Response: DRF Response object with paginated data
        """
        # Simple serializer that converts objects to dict
        def simple_serializer(obj):
            if hasattr(obj, '__dict__'):
                return obj.__dict__
            return str(obj)
        
        return PaginationHelper.create_paginated_response(
            request, queryset, simple_serializer, success_message
        )


class SearchPaginationHelper(PaginationHelper):
    """
    Extended pagination helper with search functionality.
    """
    
    @staticmethod
    def search_and_paginate(request, queryset, search_fields, data_serializer_func,
                          success_message=None, default_page_size=None):
        """
        Search and paginate a queryset.
        
        Args:
            request: Django request object
            queryset: Django queryset to search and paginate
            search_fields: List of fields to search in
            data_serializer_func: Function to serialize each object
            success_message: Optional success message
            default_page_size: Default page size if not specified
        
        Returns:
            Response: DRF Response object with searched and paginated data
        """
        from django.db.models import Q
        
        # Get search query - support both 'q' and 'search' parameters
        search_query = request.GET.get('search', request.GET.get('q', '')).strip()
        
        # Apply search if query exists
        if search_query and search_fields:
            search_filter = Q()
            for field in search_fields:
                search_filter |= Q(**{f"{field}__icontains": search_query})
            queryset = queryset.filter(search_filter)
        
        # Add search info to the message
        if search_query:
            if not success_message:
                success_message = f"Search results for '{search_query}'"
        
        return PaginationHelper.create_paginated_response(
            request, queryset, data_serializer_func, success_message, default_page_size
        )