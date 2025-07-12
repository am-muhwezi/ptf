from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from django.utils import timezone
from django.db import models
from django.db.models import Count, Q, Avg
from datetime import timedelta
from .models import (
    Member, Booking, Trainer, Waitlist, Attendance,
    Feedback, InventoryItem, Notification
)
from .serializers import (
    MemberSerializer, BookingSerializer, TrainerSerializer,
    WaitlistSerializer, AttendanceSerializer, FeedbackSerializer,
    InventoryItemSerializer, NotificationSerializer
)



class MemberViewSet(viewsets.ModelViewSet):
    queryset = Member.objects.all()
    serializer_class = MemberSerializer

    @action(detail=False, methods=['get'])
    def active_members(self, request):
        active_members = Member.objects.filter(is_active=True)
        serializer = self.get_serializer(active_members, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def renewals_due(self, request):
        members = Member.objects.filter(
            membership_end_date__lte=timezone.now().date() + timedelta(days=30)
        )
        serializer = self.get_serializer(members, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def payments_overdue(self, request):
        members = Member.objects.filter(
            payment_due_date__lt=timezone.now().date()
        )
        serializer = self.get_serializer(members, many=True)
        return Response(serializer.data)

class BookingViewSet(viewsets.ModelViewSet):
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer

    @action(detail=False, methods=['get'])
    def today_bookings(self, request):
        today = timezone.now().date()
        bookings = Booking.objects.filter(session_date__date=today)
        serializer = self.get_serializer(bookings, many=True)
        return Response(serializer.data)

class TrainerViewSet(viewsets.ModelViewSet):
    queryset = Trainer.objects.all()
    serializer_class = TrainerSerializer

    @action(detail=False, methods=['get'])
    def available_trainers(self, request):
        trainers = Trainer.objects.filter(is_available=True)
        serializer = self.get_serializer(trainers, many=True)
        return Response(serializer.data)

class WaitlistViewSet(viewsets.ModelViewSet):
    queryset = Waitlist.objects.all()
    serializer_class = WaitlistSerializer

    @action(detail=False, methods=['get'])
    def pending_waitlist(self, request):
        waitlist = Waitlist.objects.filter(is_resolved=False)
        serializer = self.get_serializer(waitlist, many=True)
        return Response(serializer.data)

class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer

    @action(detail=False, methods=['get'])
    def today_attendance(self, request):
        today = timezone.now().date()
        attendance = Attendance.objects.filter(check_in_time__date=today)
        serializer = self.get_serializer(attendance, many=True)
        return Response(serializer.data)

class FeedbackViewSet(viewsets.ModelViewSet):
    queryset = Feedback.objects.all()
    serializer_class = FeedbackSerializer

    @action(detail=False, methods=['get'])
    def open_feedback(self, request):
        feedback = Feedback.objects.filter(status='open')
        serializer = self.get_serializer(feedback, many=True)
        return Response(serializer.data)

class InventoryItemViewSet(viewsets.ModelViewSet):
    queryset = InventoryItem.objects.all()
    serializer_class = InventoryItemSerializer

    @action(detail=False, methods=['get'])
    def low_stock_items(self, request):
        items = InventoryItem.objects.filter(quantity__lte=models.F('min_stock_level'))
        serializer = self.get_serializer(items, many=True)
        return Response(serializer.data)

class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer

    @action(detail=False, methods=['get'])
    def unread_notifications(self, request):
        notifications = Notification.objects.filter(is_read=False)
        serializer = self.get_serializer(notifications, many=True)
        return Response(serializer.data)

@api_view(['GET'])
def dashboard_stats(request):
    """Get dashboard statistics"""
    today = timezone.now().date()

    stats = {
        "membershipData": {
            "renewalsDue": Member.objects.filter(
                membership_end_date__lte=today + timedelta(days=30)
                ).count(),
                "paymentOverdue": Member.objects.filter(payment_due_date__lt=today).count(),
                "indoor": Attendance.objects.filter(visit_type='indoor', check_in_time__date=today).count(),
                "outdoor": Attendance.objects.filter(visit_type='outdoor', check_in_time__date=today).count(),
                },
                "bookingData": {
                    "groupSessions": Booking.objects.filter(session_type='group', session_date__date=today).count(),
                            "oneOnOneSessions": Booking.objects.filter(session_type='one-on-one', session_date__date=today).count(),
                            "trainersAvailable": Trainer.objects.filter(is_available=True).count(),
                                },
                                    "feedbackData": {
                                        "opentickets": Feedback.objects.filter(status='open').count(),
                                        "avgResolutionTime": "2 days",  # Placeholder, should be calculated based on actual data
                                    },
                                    "attendanceData": {
                                        "indoorVisits": Attendance.objects.filter(visit_type='indoor', check_in_time__date=today).count(),
                                        "outdoorVisits": Attendance.objects.filter(visit_type='outdoor', check_in_time__date=today).count(),
                                    },
                                    "inventoryData": {
                                                "availableStock": InventoryItem.objects.filter(quantity__gt=0).count(),
                                                "lowStockItems": InventoryItem.objects.filter(quantity__lte=models.F('min_stock_level')).count(),
                                    },
                                    }

    return Response(stats)

@api_view(['POST'])
def member_checkin(request):
    """Check in a member"""
    member_id = request.data.get('member_id')
    visit_type = request.data.get('visit_type', 'indoor')

    try:
        member = Member.objects.get(id=member_id, is_active=True)
        attendance = Attendance.objects.create(
            member=member,
            visit_type=visit_type
        )
        serializer = AttendanceSerializer(attendance)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    except Member.DoesNotExist:
        return Response(
            {'error': 'Member not found or inactive'}, 
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['GET'])
def notifications(request):
    """Get recent notifications"""
    notifications = Notification.objects.all()[:10]
    serializer = NotificationSerializer(notifications, many=True)
    return Response(serializer.data)