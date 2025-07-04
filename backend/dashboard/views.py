from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view
from django.utils import timezone
from django.db.models import Count, Avg
from datetime import timedelta
from .models import (
    Member, Booking, Trainer, Waitlist, Attendance, 
    Feedback, InventoryItem, Notification
)

@api_view(['GET'])
def dashboard_stats(request: Request):
    """
    Get comprehensive dashboard statistics
    Returns data structure expected by frontend
    """
    try:
        today = timezone.now().date()
        
        # Membership Data
        indoor_memberships = Member.objects.filter(
            membership_type__in=['indoor', 'both'], 
            is_active=True
        ).count()
        
        outdoor_memberships = Member.objects.filter(
            membership_type__in=['outdoor', 'both'], 
            is_active=True
        ).count()
        
        renewals_due = Member.objects.filter(
            is_active=True,
            membership_end_date__lte=today + timedelta(days=30)
        ).count()
        
        payment_overdue = Member.objects.filter(
            is_active=True,
            payment_due_date__lt=today
        ).count()
        
        # Booking Data
        group_sessions_today = Booking.objects.filter(
            session_date__date=today,
            session_type='group'
        ).count()
        
        one_on_one_sessions_today = Booking.objects.filter(
            session_date__date=today,
            session_type='one_on_one'
        ).count()
        
        trainers_available = Trainer.objects.filter(is_available=True).count()
        
        waitlist_requests = Waitlist.objects.filter(is_resolved=False).count()
        
        # Attendance Data
        indoor_visits_today = Attendance.objects.filter(
            check_in_time__date=today,
            visit_type='indoor'
        ).count()
        
        outdoor_visits_today = Attendance.objects.filter(
            check_in_time__date=today,
            visit_type='outdoor'
        ).count()
        
        # Feedback Data
        open_tickets = Feedback.objects.filter(status='open').count()
        
        # Calculate average resolution time
        resolved_feedback = Feedback.objects.filter(
            status='resolved',
            resolved_at__isnull=False
        )
        
        if resolved_feedback.exists():
            avg_resolution_days = resolved_feedback.aggregate(
                avg_days=Avg('resolved_at') - Avg('created_at')
            )
            # Convert to days (this is simplified - you might want more precise calculation)
            avg_resolution_time = "3 days"  # Placeholder - implement proper calculation
        else:
            avg_resolution_time = "0 days"
        
        # Inventory Data
        available_stock = InventoryItem.objects.aggregate(
            total=Count('id')
        )['total'] or 0
        
        low_stock_alerts = InventoryItem.objects.filter(
            quantity__lte=models.F('min_stock_level')
        ).count()
        
        # Prepare response data matching frontend expectations
        response_data = {
            "membershipData": {
                "indoor": indoor_memberships,
                "outdoor": outdoor_memberships,
                "renewalsDue": renewals_due,
                "paymentOverdue": payment_overdue
            },
            "bookingData": {
                "groupSessions": group_sessions_today,
                "oneOnOneSessions": one_on_one_sessions_today,
                "trainersAvailable": trainers_available,
                "waitlistRequests": waitlist_requests
            },
            "attendanceData": {
                "indoorVisits": indoor_visits_today,
                "outdoorVisits": outdoor_visits_today
            },
            "feedbackData": {
                "openTickets": open_tickets,
                "avgResolutionTime": avg_resolution_time
            },
            "inventoryData": {
                "availableStock": available_stock,
                "lowStockAlerts": low_stock_alerts
            }
        }
        
        return Response(data=response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            data={"error": f"Failed to fetch dashboard statistics: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET', 'POST'])
def notifications(request: Request):
    """
    Handle notifications - GET to retrieve, POST to create
    """
    if request.method == 'GET':
        try:
            # Get recent notifications (last 10)
            notifications = Notification.objects.filter(is_read=False)[:10]
            
            notifications_data = [
                {
                    "id": notification.id,
                    "title": notification.title,
                    "message": notification.message,
                    "type": notification.notification_type,
                    "timestamp": notification.created_at.isoformat(),
                    "isRead": notification.is_read
                }
                for notification in notifications
            ]
            
            return Response(data=notifications_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                data={"error": f"Failed to fetch notifications: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    elif request.method == 'POST':
        try:
            # Create new notification
            title = request.data.get('title')
            message = request.data.get('message')
            notification_type = request.data.get('type', 'info')
            
            if not title or not message:
                return Response(
                    data={"error": "Title and message are required"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            notification = Notification.objects.create(
                title=title,
                message=message,
                notification_type=notification_type
            )
            
            response_data = {
                "id": notification.id,
                "title": notification.title,
                "message": notification.message,
                "type": notification.notification_type,
                "timestamp": notification.created_at.isoformat(),
                "isRead": notification.is_read
            }
            
            return Response(data=response_data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                data={"error": f"Failed to create notification: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

@api_view(['POST'])
def member_checkin(request: Request):
    """
    Handle member check-in
    Expected data: {"memberId": int, "visitType": "indoor"|"outdoor"}
    """
    try:
        member_id = request.data.get('memberId')
        visit_type = request.data.get('visitType', 'indoor')
        
        if not member_id:
            return Response(
                data={"error": "Member ID is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            member = Member.objects.get(id=member_id, is_active=True)
        except Member.DoesNotExist:
            return Response(
                data={"error": "Member not found or inactive"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Create attendance record
        attendance = Attendance.objects.create(
            member=member,
            visit_type=visit_type
        )
        
        response_data = {
            "id": attendance.id,
            "memberName": f"{member.first_name} {member.last_name}",
            "visitType": attendance.visit_type,
            "checkInTime": attendance.check_in_time.isoformat(),
            "message": f"{member.first_name} {member.last_name} checked in successfully!"
        }
        
        return Response(data=response_data, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response(
            data={"error": f"Failed to check in member: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )