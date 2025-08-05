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
import logging

logger = logging.getLogger(__name__)


class MembershipPagination(PageNumberPagination):
    """Custom pagination for memberships"""
    page_size = 20
    page_size_query_param = 'limit'
    max_page_size = 100


class MembershipPlanViewSet(viewsets.ModelViewSet):
    """ViewSet for managing membership plans"""
    
    queryset = MembershipPlan.objects.all()
    serializer_class = MembershipPlanSerializer
    pagination_class = MembershipPagination

    def get_queryset(self):
        queryset = super().get_queryset()
        membership_type = self.request.query_params.get('membership_type')
        if membership_type:
            queryset = queryset.filter(membership_type=membership_type)
        return queryset



class MembershipViewSet(viewsets.ModelViewSet):
    """ViewSet for managing individual memberships"""
    
    queryset = Membership.objects.select_related('member', 'plan').prefetch_related('session_logs')
    serializer_class = MembershipSerializer
    pagination_class = MembershipPagination

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

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by membership type
        membership_type = self.request.query_params.get('membership_type')
        if membership_type:
            queryset = queryset.filter(plan__membership_type=membership_type)
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter and status_filter != 'all':
            queryset = queryset.filter(status=status_filter)
        
        # Search functionality
        search = self.request.query_params.get('q')
        if search:
            queryset = queryset.filter(
                Q(member__first_name__icontains=search) |
                Q(member__last_name__icontains=search) |
                Q(member__email__icontains=search) |
                Q(member__phone__icontains=search) |
                Q(location__icontains=search) |
                Q(plan__plan_name__icontains=search)
            ).distinct()
        
        return queryset.order_by('-created_at')

    @action(detail=False, methods=['get'])
    def outdoor(self, request):
        """Get outdoor memberships with pagination and search"""
        # Filter for outdoor memberships only
        queryset = self.get_queryset().filter(plan__membership_type='outdoor')
        
        # Apply pagination
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'data': serializer.data,
            'count': queryset.count()
        })

    @action(detail=False, methods=['get'])
    def indoor(self, request):
        """Get indoor memberships with pagination and search"""
        # Filter for indoor memberships only
        queryset = self.get_queryset().filter(plan__membership_type='indoor')
        
        # Apply pagination
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'data': serializer.data,
            'count': queryset.count()
        })

    @action(detail=False, methods=['get'])
    def indoor_stats(self, request):
        """Get indoor membership statistics"""
        try:
            indoor_memberships = Membership.objects.filter(plan__membership_type='indoor')
            
            stats = {
                'total_memberships': indoor_memberships.count(),
                'active_memberships': indoor_memberships.filter(status='active').count(),
                'expiring_soon': sum(1 for m in indoor_memberships if m.is_expiring_soon),
                'new_this_month': indoor_memberships.filter(
                    created_at__month=timezone.now().month,
                    created_at__year=timezone.now().year
                ).count(),
                'total_revenue': sum(m.amount_paid for m in indoor_memberships.filter(status='active')),
                'sessions_used_today': SessionLog.objects.filter(
                    membership__plan__membership_type='indoor',
                    date_used__date=timezone.now().date()
                ).count()
            }
            
            return Response({
                'success': True,
                'data': stats
            })
            
        except Exception as e:
            logger.error(f"Error calculating indoor stats: {e}")
            return Response({
                'success': False,
                'error': 'Failed to calculate statistics'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def outdoor_stats(self, request):
        """Get outdoor membership statistics"""
        try:
            outdoor_memberships = Membership.objects.filter(plan__membership_type='outdoor')
            
            stats = {
                'total_memberships': outdoor_memberships.count(),
                'active_memberships': outdoor_memberships.filter(status='active').count(),
                'expiring_soon': sum(1 for m in outdoor_memberships if m.is_expiring_soon),
                'new_this_month': outdoor_memberships.filter(
                    created_at__month=timezone.now().month,
                    created_at__year=timezone.now().year
                ).count(),
                'total_revenue': sum(m.amount_paid for m in outdoor_memberships.filter(status='active')),
                'sessions_used_today': SessionLog.objects.filter(
                    membership__plan__membership_type='outdoor',
                    date_used__date=timezone.now().date()
                ).count()
            }
            
            return Response({
                'success': True,
                'data': stats
            })
            
        except Exception as e:
            logger.error(f"Error calculating outdoor stats: {e}")
            return Response({
                'success': False,
                'error': 'Failed to calculate statistics'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def use_session(self, request, pk=None):
        """Use a session (check-in)"""
        try:
            membership = self.get_object()
            
            if membership.status != 'active':
                return Response({
                    'success': False,
                    'error': f'Cannot use session. Membership status is {membership.status}.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if membership.sessions_remaining <= 0:
                return Response({
                    'success': False,
                    'error': 'No sessions remaining in this membership.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Validate session usage data
            serializer = SessionUsageSerializer(data=request.data)
            if not serializer.is_valid():
                return Response({
                    'success': False,
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Use the session
            if membership.use_session():
                # Create session log
                SessionLog.objects.create(
                    membership=membership,
                    location=serializer.validated_data.get('location', membership.location),
                    notes=serializer.validated_data.get('notes', '')
                )
                
                return Response({
                    'success': True,
                    'message': f'Session used successfully. {membership.sessions_remaining} sessions remaining.',
                    'sessions_remaining': membership.sessions_remaining
                })
            else:
                return Response({
                    'success': False,
                    'error': 'Failed to use session.'
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
            membership.status = 'suspended'
            membership.save()
            
            return Response({
                'success': True,
                'message': f'Membership for {membership.member.full_name} has been suspended.'
            })
            
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
            if membership.status == 'suspended':
                membership.status = 'active'
                membership.save()
                
                return Response({
                    'success': True,
                    'message': f'Membership for {membership.member.full_name} has been reactivated.'
                })
            else:
                return Response({
                    'success': False,
                    'error': f'Cannot reactivate membership with status: {membership.status}'
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f"Error reactivating membership: {e}")
            return Response({
                'success': False,
                'error': 'Failed to reactivate membership.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
