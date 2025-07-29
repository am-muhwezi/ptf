from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.authentication import SessionAuthentication
from django.utils import timezone
from datetime import timedelta
from members.models import Member
from bookings.models import Booking

from .services import get_dashboard_statistics


class DashboardStatsView(APIView):
    """
    Dashboard statistics view with authentication
    """
    authentication_classes = [JWTAuthentication, SessionAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        try:
            stats = get_dashboard_statistics()
            return Response(stats, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": "Could not retrieve dashboard statistics", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class DashboardNotificationsView(APIView):
    """
    Dashboard notifications view with authentication
    """
    authentication_classes = [JWTAuthentication, SessionAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        try:
            notifications = []
            today = timezone.now().date()
            
            # Check for members with expiring memberships
            expiring_soon = Member.objects.filter(
                membership_end_date__lte=today + timedelta(days=30),
                membership_end_date__gt=today,
                status='active'
            ).order_by('membership_end_date')[:5]
            
            for member in expiring_soon:
                days_left = (member.membership_end_date - today).days
                notifications.append({
                    'id': f'expiry_{member.id}',
                    'type': 'warning',
                    'title': 'Membership Expiring',
                    'message': f'{member.full_name} membership expires in {days_left} days',
                    'member_id': member.id,
                    'date': member.membership_end_date.isoformat(),
                    'priority': 'high' if days_left <= 7 else 'medium',
                    'action': 'renew_membership'
                })
            
            # Check for overdue payments
            overdue_payments = Member.objects.filter(
                payment_status='overdue',
                status='active'
            )[:5]
            
            for member in overdue_payments:
                notifications.append({
                    'id': f'payment_{member.id}',
                    'type': 'error',
                    'title': 'Payment Overdue',
                    'message': f'{member.full_name} has overdue payment',
                    'member_id': member.id,
                    'priority': 'high',
                    'action': 'collect_payment'
                })
            
            # Check for pending bookings
            pending_bookings = Booking.objects.filter(
                status='pending',
                booking_date__date__gte=today
            ).order_by('booking_date')[:5]
            
            for booking in pending_bookings:
                notifications.append({
                    'id': f'booking_{booking.id}',
                    'type': 'info',
                    'title': 'Pending Booking',
                    'message': f'Booking for {booking.member.full_name} requires confirmation',
                    'booking_id': booking.id,
                    'member_id': booking.member.id,
                    'date': booking.booking_date.isoformat(),
                    'priority': 'medium',
                    'action': 'confirm_booking'
                })
            
            # Check for new members (registered in last 7 days)
            new_members = Member.objects.filter(
                registrationDate__date__gte=today - timedelta(days=7)
            ).order_by('-registrationDate')[:3]
            
            for member in new_members:
                notifications.append({
                    'id': f'new_member_{member.id}',
                    'type': 'success',
                    'title': 'New Member',
                    'message': f'{member.full_name} joined recently',
                    'member_id': member.id,
                    'date': member.registrationDate.date().isoformat(),
                    'priority': 'low',
                    'action': 'welcome_member'
                })
            
            # Sort notifications by priority and date
            priority_order = {'high': 3, 'medium': 2, 'low': 1}
            notifications.sort(
                key=lambda x: (priority_order.get(x['priority'], 0), x.get('date', '')), 
                reverse=True
            )
            
            return Response({
                'notifications': notifications,
                'count': len(notifications),
                'unreadCount': len([n for n in notifications if n['priority'] in ['high', 'medium']]),
                'categories': {
                    'high': len([n for n in notifications if n['priority'] == 'high']),
                    'medium': len([n for n in notifications if n['priority'] == 'medium']),
                    'low': len([n for n in notifications if n['priority'] == 'low']),
                },
                'lastUpdated': timezone.now().isoformat(),
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {
                    "error": "Could not retrieve notifications", 
                    "details": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )