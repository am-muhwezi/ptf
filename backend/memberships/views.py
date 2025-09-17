from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import MembershipPlan, Membership, SessionLog
from .serializers import (
    MembershipPlanSerializer, 
    MembershipSerializer, 
    IndoorMembershipListSerializer,
    OutdoorMembershipListSerializer,
    CreateMembershipSerializer,
    SessionUsageSerializer,
    SessionLogSerializer
)
from .services import MembershipService, MembershipPlanService
import logging

logger = logging.getLogger(__name__)


class MembershipPagination(PageNumberPagination):
    """Custom pagination for memberships"""
    page_size = 20
    page_size_query_param = 'limit'
    max_page_size = 100


class MembershipPlanViewSet(viewsets.ModelViewSet):
    """ViewSet for managing membership plans (now using normalized models)"""
    
    serializer_class = MembershipPlanSerializer
    pagination_class = MembershipPagination

    def get_queryset(self):
        queryset = MembershipPlan.objects.all()
        membership_type = self.request.query_params.get('membership_type')
        if membership_type:
            queryset = queryset.filter(membership_type=membership_type)
        return queryset
    



class MembershipViewSet(viewsets.ModelViewSet):
    """ViewSet for managing individual memberships (now using normalized models)"""
    
    serializer_class = MembershipSerializer
    pagination_class = MembershipPagination
    
    def get_queryset(self):
        return Membership.objects.select_related(
            'member',
            'plan',
            'location'
        ).prefetch_related('session_logs').order_by('-created_at')

    def get_serializer_class(self):
        if self.action == 'list':
            # Use optimized serializer for listing - default to outdoor
            return OutdoorMembershipListSerializer
        elif self.action == 'indoor':
            # Use indoor-specific serializer
            return IndoorMembershipListSerializer
        elif self.action == 'outdoor':
            # Use outdoor-specific serializer  
            return OutdoorMembershipListSerializer
        elif self.action == 'create':
            return CreateMembershipSerializer
        return MembershipSerializer

    def filter_queryset(self, queryset):
        # Use service layer for search filtering
        membership_type = self.request.query_params.get('membership_type')
        status_filter = self.request.query_params.get('status')
        location_filter = self.request.query_params.get('location')
        search = self.request.query_params.get('search') or self.request.query_params.get('q')

        filters = MembershipService.search_memberships(
            search_query=search,
            membership_type=membership_type,
            status_filter=status_filter,
            location_filter=location_filter
        )

        return queryset.filter(filters).order_by('-created_at')

    @action(detail=False, methods=['get'])
    def outdoor(self, request):
        """Get outdoor memberships with pagination and search"""
        import time
        start_time = time.time()

        # Filter for outdoor memberships only
        queryset = self.filter_queryset(self.get_queryset().filter(plan__membership_type='outdoor'))

        # Apply pagination
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            response = self.get_paginated_response(serializer.data)
        else:
            serializer = self.get_serializer(queryset, many=True)
            response = Response({
                'success': True,
                'data': serializer.data,
                'count': queryset.count()
            })

        end_time = time.time()
        duration_ms = round((end_time - start_time) * 1000, 2)
        page_num = request.query_params.get('page', 1)
        limit = request.query_params.get('limit', 20)
        print(f"[Outdoor API] query took {duration_ms}ms (page={page_num}, limit={limit})")

        return response

    @action(detail=False, methods=['get'])
    def indoor(self, request):
        """Get indoor memberships with pagination and search"""
        import time
        start_time = time.time()

        # Filter for indoor memberships only
        queryset = self.filter_queryset(self.get_queryset().filter(plan__membership_type='indoor'))

        # Apply pagination
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            response = self.get_paginated_response(serializer.data)
        else:
            serializer = self.get_serializer(queryset, many=True)
            response = Response({
                'success': True,
                'data': serializer.data,
                'count': queryset.count()
            })

        end_time = time.time()
        duration_ms = round((end_time - start_time) * 1000, 2)
        page_num = request.query_params.get('page', 1)
        limit = request.query_params.get('limit', 20)
        print(f"[Indoor API] query took {duration_ms}ms (page={page_num}, limit={limit})")

        return response

    @action(detail=False, methods=['get'])
    def indoor_stats(self, request):
        """Get indoor membership statistics"""
        import time
        start_time = time.time()

        try:
            stats = MembershipService.get_membership_statistics(membership_type='indoor')

            end_time = time.time()
            duration_ms = round((end_time - start_time) * 1000, 2)
            print(f"[Indoor Stats API] query took {duration_ms}ms")

            return Response({
                'success': True,
                'data': stats
            })

        except Exception as e:
            end_time = time.time()
            duration_ms = round((end_time - start_time) * 1000, 2)
            logger.error(f"Error calculating indoor stats after {duration_ms}ms: {e}")
            return Response({
                'success': False,
                'error': 'Failed to calculate statistics'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def outdoor_stats(self, request):
        """Get outdoor membership statistics"""
        import time
        start_time = time.time()

        try:
            stats = MembershipService.get_membership_statistics(membership_type='outdoor')

            end_time = time.time()
            duration_ms = round((end_time - start_time) * 1000, 2)
            print(f"[Outdoor Stats API] query took {duration_ms}ms")

            return Response({
                'success': True,
                'data': stats
            })

        except Exception as e:
            end_time = time.time()
            duration_ms = round((end_time - start_time) * 1000, 2)
            logger.error(f"Error calculating outdoor stats after {duration_ms}ms: {e}")
            return Response({
                'success': False,
                'error': 'Failed to calculate statistics'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def use_session(self, request, pk=None):
        """Use a session (check-in)"""
        try:
            membership = self.get_object()
            
            # Validate session usage data
            serializer = SessionUsageSerializer(data=request.data)
            if not serializer.is_valid():
                return Response({
                    'success': False,
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Use the session through service layer
            success, message = MembershipService.use_session(
                membership=membership,
                session_type=serializer.validated_data.get('session_type', 'regular'),
                notes=serializer.validated_data.get('notes', '')
            )
            
            if success:
                return Response({
                    'success': True,
                    'message': message,
                    'sessions_remaining': membership.sessions_remaining
                })
            else:
                return Response({
                    'success': False,
                    'error': message
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f"Error using session: {e}")
            return Response({
                'success': False,
                'error': 'Failed to use session. Please try again.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def suspend(self, request, pk=None):
        """Suspend a membership"""
        try:
            membership = self.get_object()
            reason = request.data.get('reason', '')
            
            success, message = MembershipService.suspend_membership(membership, reason)
            
            if success:
                return Response({
                    'success': True,
                    'message': message
                })
            else:
                return Response({
                    'success': False,
                    'error': message
                }, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            logger.error(f"Error suspending membership: {e}")
            return Response({
                'success': False,
                'error': 'Failed to suspend membership.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def reactivate(self, request, pk=None):
        """Reactivate a suspended membership"""
        try:
            membership = self.get_object()
            
            success, message = MembershipService.reactivate_membership(membership)
            
            if success:
                return Response({
                    'success': True,
                    'message': message
                })
            else:
                return Response({
                    'success': False,
                    'error': message
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f"Error reactivating membership: {e}")
            return Response({
                'success': False,
                'error': 'Failed to reactivate membership.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

