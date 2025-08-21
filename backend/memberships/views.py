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
    SessionLogSerializer,
    PaymentDueSerializer,
    RenewalDueSerializer,
    PaymentRecordSerializer,
    PaymentReminderSerializer,
    BulkPaymentReminderSerializer
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
        
        # Always apply pagination for consistent response format
        page = self.paginate_queryset(queryset)
        serializer = self.get_serializer(page or queryset, many=True)
        return self.get_paginated_response(serializer.data)

    @action(detail=False, methods=['get'])
    def indoor(self, request):
        """Get indoor memberships with pagination and search"""
        # Filter for indoor memberships only
        queryset = self.get_queryset().filter(plan__membership_type='indoor')
        
        # Always apply pagination for consistent response format
        page = self.paginate_queryset(queryset)
        serializer = self.get_serializer(page or queryset, many=True)
        return self.get_paginated_response(serializer.data)

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

    @action(detail=False, methods=['get'])
    def payments_due(self, request):
        """Get memberships with payments due"""
        try:
            # Get memberships that have payments due
            queryset = self.get_queryset().filter(
                payment_status__in=['pending', 'overdue', 'partial']
            ).exclude(status='cancelled')
            
            # Apply search and filters
            search = request.query_params.get('q')
            if search:
                queryset = queryset.filter(
                    Q(member__first_name__icontains=search) |
                    Q(member__last_name__icontains=search) |
                    Q(member__email__icontains=search) |
                    Q(member__phone__icontains=search)
                ).distinct()
            
            # Filter by payment status
            payment_status_filter = request.query_params.get('status')
            if payment_status_filter and payment_status_filter != 'all':
                queryset = queryset.filter(payment_status=payment_status_filter)
            
            # Pagination
            page = self.paginate_queryset(queryset)
            serializer = PaymentDueSerializer(page or queryset, many=True)
            return self.get_paginated_response(serializer.data)
            
        except Exception as e:
            logger.error(f"Error fetching payments due: {e}")
            return Response({
                'success': False,
                'error': 'Failed to fetch payments due'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def renewals_due(self, request):
        """Get memberships that need renewal"""
        try:
            # Get memberships expiring in the next 30 days
            cutoff_date = timezone.now().date() + timezone.timedelta(days=30)
            queryset = self.get_queryset().filter(
                end_date__lte=cutoff_date,
                status='active'
            )
            
            # Apply search and filters
            search = request.query_params.get('q')
            if search:
                queryset = queryset.filter(
                    Q(member__first_name__icontains=search) |
                    Q(member__last_name__icontains=search) |
                    Q(member__email__icontains=search) |
                    Q(member__phone__icontains=search)
                ).distinct()
            
            # Filter by urgency
            urgency_filter = request.query_params.get('urgency')
            if urgency_filter and urgency_filter != 'all':
                today = timezone.now().date()
                if urgency_filter == 'critical':
                    queryset = queryset.filter(end_date__lte=today + timezone.timedelta(days=7))
                elif urgency_filter == 'high':
                    queryset = queryset.filter(
                        end_date__gt=today + timezone.timedelta(days=7),
                        end_date__lte=today + timezone.timedelta(days=15)
                    )
                elif urgency_filter == 'medium':
                    queryset = queryset.filter(
                        end_date__gt=today + timezone.timedelta(days=15),
                        end_date__lte=today + timezone.timedelta(days=30)
                    )
            
            # Pagination
            page = self.paginate_queryset(queryset)
            serializer = RenewalDueSerializer(page or queryset, many=True)
            return self.get_paginated_response(serializer.data)
            
        except Exception as e:
            logger.error(f"Error fetching renewals due: {e}")
            return Response({
                'success': False,
                'error': 'Failed to fetch renewals due'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def record_payment(self, request, pk=None):
        """Record a payment for a membership"""
        try:
            membership = self.get_object()
            
            serializer = PaymentRecordSerializer(data=request.data)
            if not serializer.is_valid():
                return Response({
                    'success': False,
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Update membership payment status
            membership.payment_status = 'paid'
            membership.amount_paid += serializer.validated_data['amount']
            
            # Update next billing date (add 1 month)
            if membership.next_billing_date:
                membership.next_billing_date += timezone.timedelta(days=30)
            else:
                membership.next_billing_date = timezone.now().date() + timezone.timedelta(days=30)
            
            membership.save()
            
            # Create payment record (you might want a separate Payment model)
            payment_data = {
                'member_id': membership.member.id,
                'member_name': membership.member.full_name,
                'amount': float(serializer.validated_data['amount']),
                'payment_method': serializer.validated_data['payment_method'],
                'description': serializer.validated_data.get('description', ''),
                'transaction_reference': serializer.validated_data.get('transaction_reference', ''),
                'recorded_by': serializer.validated_data['recorded_by'],
                'timestamp': timezone.now().isoformat(),
                'status': 'completed',
                'membership_id': membership.id
            }
            
            return Response({
                'success': True,
                'message': f'Payment of {serializer.validated_data["amount"]} recorded successfully for {membership.member.full_name}',
                'payment': payment_data
            })
            
        except Exception as e:
            logger.error(f"Error recording payment: {e}")
            return Response({
                'success': False,
                'error': 'Failed to record payment'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def send_payment_reminder(self, request, pk=None):
        """Send payment reminder to a member"""
        try:
            membership = self.get_object()
            
            serializer = PaymentReminderSerializer(data=request.data)
            if not serializer.is_valid():
                return Response({
                    'success': False,
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Here you would integrate with email/SMS service
            # For now, just return success
            reminder_type = serializer.validated_data['reminder_type']
            
            return Response({
                'success': True,
                'message': f'Payment reminder sent via {reminder_type} to {membership.member.full_name}'
            })
            
        except Exception as e:
            logger.error(f"Error sending payment reminder: {e}")
            return Response({
                'success': False,
                'error': 'Failed to send payment reminder'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def send_bulk_reminders(self, request):
        """Send bulk payment reminders"""
        try:
            serializer = BulkPaymentReminderSerializer(data=request.data)
            if not serializer.is_valid():
                return Response({
                    'success': False,
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
            
            member_ids = serializer.validated_data['member_ids']
            reminder_type = serializer.validated_data['reminder_type']
            
            # Here you would integrate with email/SMS service
            # For now, just return success
            
            return Response({
                'success': True,
                'message': f'Bulk reminders sent via {reminder_type} to {len(member_ids)} members'
            })
            
        except Exception as e:
            logger.error(f"Error sending bulk reminders: {e}")
            return Response({
                'success': False,
                'error': 'Failed to send bulk reminders'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def process_renewal(self, request, pk=None):
        """Process membership renewal"""
        try:
            membership = self.get_object()
            
            # Extend membership by 1 month
            membership.end_date += timezone.timedelta(days=30)
            membership.payment_status = 'paid'
            membership.save()
            
            return Response({
                'success': True,
                'message': f'Membership renewed for {membership.member.full_name}. New expiry date: {membership.end_date}'
            })
            
        except Exception as e:
            logger.error(f"Error processing renewal: {e}")
            return Response({
                'success': False,
                'error': 'Failed to process renewal'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def payment_stats(self, request):
        """Get payment statistics"""
        try:
            payments_due = Membership.objects.filter(
                payment_status__in=['pending', 'overdue', 'partial']
            ).exclude(status='cancelled')
            
            today = timezone.now().date()
            overdue_count = 0
            due_today_count = 0
            total_outstanding = 0
            
            for membership in payments_due:
                if membership.next_billing_date:
                    days_diff = (membership.next_billing_date - today).days
                    if days_diff < 0:
                        overdue_count += 1
                    elif days_diff == 0:
                        due_today_count += 1
                
                # Calculate outstanding amount
                if membership.next_billing_date and membership.next_billing_date < today:
                    days_overdue = (today - membership.next_billing_date).days
                    months_overdue = max(1, days_overdue // 30)
                    total_outstanding += float(membership.plan.monthly_fee * months_overdue)
                else:
                    total_outstanding += float(membership.plan.monthly_fee)
            
            stats = {
                'total': payments_due.count(),
                'overdue': overdue_count,
                'dueToday': due_today_count,
                'totalOutstanding': total_outstanding
            }
            
            return Response({
                'success': True,
                'data': stats
            })
            
        except Exception as e:
            logger.error(f"Error calculating payment stats: {e}")
            return Response({
                'success': False,
                'error': 'Failed to calculate payment statistics'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def renewal_stats(self, request):
        """Get renewal statistics"""
        try:
            today = timezone.now().date()
            renewals_due = Membership.objects.filter(
                end_date__lte=today + timezone.timedelta(days=30),
                status='active'
            )
            
            critical = renewals_due.filter(end_date__lte=today + timezone.timedelta(days=7)).count()
            high = renewals_due.filter(
                end_date__gt=today + timezone.timedelta(days=7),
                end_date__lte=today + timezone.timedelta(days=15)
            ).count()
            medium = renewals_due.filter(
                end_date__gt=today + timezone.timedelta(days=15),
                end_date__lte=today + timezone.timedelta(days=30)
            ).count()
            
            stats = {
                'total': renewals_due.count(),
                'critical': critical,
                'high': high,
                'medium': medium
            }
            
            return Response({
                'success': True,
                'data': stats
            })
            
        except Exception as e:
            logger.error(f"Error calculating renewal stats: {e}")
            return Response({
                'success': False,
                'error': 'Failed to calculate renewal statistics'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
