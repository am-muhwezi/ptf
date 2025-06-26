from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count, Q
from django.utils import timezone
from datetime import datetime, timedelta
from memberships.models import Member, Membership, Attendance
from .models import Notification
from .serializers import NotificationSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """Get dashboard statistics"""
    try:
        # Membership data
        indoor_members = Member.objects.filter(membership_type__in=['indoor', 'both'], status='active').count()
        outdoor_members = Member.objects.filter(membership_type__in=['outdoor', 'both'], status='active').count()
        
        # Renewals due (next 30 days)
        thirty_days_from_now = timezone.now().date() + timedelta(days=30)
        renewals_due = Membership.objects.filter(
            expiry_date__lte=thirty_days_from_now,
            expiry_date__gte=timezone.now().date(),
            is_active=True
        ).count()
        
        # Payment overdue
        payment_overdue = Membership.objects.filter(
            payment_status='overdue',
            is_active=True
        ).count()
        
        # Today's attendance
        today = timezone.now().date()
        indoor_visits_today = Attendance.objects.filter(
            date=today,
            membership_type__in=['indoor', 'both']
        ).count()
        
        outdoor_visits_today = Attendance.objects.filter(
            date=today,
            membership_type__in=['outdoor', 'both']
        ).count()
        
        # Mock data for other sections (you can implement these later)
        stats = {
            'membershipData': {
                'indoor': indoor_members,
                'outdoor': outdoor_members,
                'renewalsDue': renewals_due,
                'paymentOverdue': payment_overdue
            },
            'bookingData': {
                'groupSessions': 5,  # Mock data
                'oneOnOneSessions': 8,  # Mock data
                'trainersAvailable': 3,  # Mock data
                'waitlistRequests': 2  # Mock data
            },
            'attendanceData': {
                'indoorVisits': indoor_visits_today,
                'outdoorVisits': outdoor_visits_today
            },
            'feedbackData': {
                'openTickets': 3,  # Mock data
                'avgResolutionTime': '2 days'  # Mock data
            },
            'inventoryData': {
                'availableStock': 85,  # Mock data
                'lowStockAlerts': 4  # Mock data
            }
        }
        
        return Response(stats, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': 'Failed to fetch dashboard statistics', 'detail': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_notifications(request):
    """Get dashboard notifications"""
    try:
        notifications = Notification.objects.filter(is_read=False)[:10]
        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': 'Failed to fetch notifications', 'detail': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )