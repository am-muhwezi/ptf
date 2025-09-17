from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.authentication import SessionAuthentication
from django.utils import timezone
from datetime import datetime, date
from django.db import transaction
import json

from members.models import Member
from memberships.models import Membership
from .models import AttendanceLog, Attendance
from .serializers import AttendanceLogSerializer, AttendanceSerializer


class CheckInView(APIView):
    """
    Handle member check-in for both indoor and outdoor activities
    """
    authentication_classes = [JWTAuthentication, SessionAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            # Handle both JSON and form data
            if hasattr(request, 'data'):
                data = request.data
            else:
                data = json.loads(request.body) if request.body else {}
                
            member_id = data.get('member_id')
            activities = data.get('activities', [])
            notes = data.get('notes', '')

            if not member_id:
                return Response(
                    {"error": "member_id is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:
                member = Member.objects.select_related().prefetch_related('memberships__plan').get(id=member_id)
            except Member.DoesNotExist:
                return Response(
                    {"error": "Member not found"},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Automatically determine visit_type from member's active membership
            active_membership = member.memberships.filter(status='active').first()
            if not active_membership:
                return Response(
                    {"error": "Member has no active membership"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            visit_type = active_membership.plan.membership_type
            
            # Check if member is already checked in today
            today = timezone.now().date()
            active_checkin = AttendanceLog.objects.filter(
                member=member,
                check_in_time__date=today,
                status__in=['checked_in', 'active'],
                check_out_time__isnull=True
            ).first()
            
            if active_checkin:
                return Response(
                    {
                        "error": "Member is already checked in",
                        "current_checkin": AttendanceLogSerializer(active_checkin).data
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create attendance log
            with transaction.atomic():
                attendance_log = AttendanceLog.objects.create(
                    member=member,
                    visit_type=visit_type,
                    check_in_time=timezone.now(),
                    status='checked_in',
                    activities=activities,
                    notes=notes
                )
                
                # Update daily attendance record
                daily_attendance = Attendance.get_or_create_today(member)
                daily_attendance.update_visit_count(visit_type)
                daily_attendance.set_active_status(True)
                
                # Update member's last visit
                member.last_visit = timezone.now()
                member.total_visits += 1
                member.save()
            
            return Response(
                {
                    "message": "Check-in successful",
                    "attendance": AttendanceLogSerializer(attendance_log).data
                },
                status=status.HTTP_201_CREATED
            )
            
        except Exception as e:
            return Response(
                {"error": "Check-in failed", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CheckOutView(APIView):
    """
    Handle member check-out
    """
    authentication_classes = [JWTAuthentication, SessionAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            # Handle both JSON and form data
            if hasattr(request, 'data'):
                data = request.data
            else:
                data = json.loads(request.body) if request.body else {}
                
            member_id = data.get('member_id')
            attendance_id = data.get('attendance_id')
            notes = data.get('notes', '')
            
            if not member_id:
                return Response(
                    {"error": "member_id is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                member = Member.objects.get(id=member_id)
            except Member.DoesNotExist:
                return Response(
                    {"error": "Member not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Find active check-in
            today = timezone.now().date()
            active_checkin = None
            
            if attendance_id:
                try:
                    active_checkin = AttendanceLog.objects.get(
                        id=attendance_id,
                        member=member,
                        check_out_time__isnull=True
                    )
                except AttendanceLog.DoesNotExist:
                    pass
            
            if not active_checkin:
                active_checkin = AttendanceLog.objects.filter(
                    member=member,
                    check_in_time__date=today,
                    status__in=['checked_in', 'active'],
                    check_out_time__isnull=True
                ).first()
            
            if not active_checkin:
                return Response(
                    {"error": "No active check-in found for this member"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Process check-out
            with transaction.atomic():
                active_checkin.check_out_time = timezone.now()
                active_checkin.status = 'checked_out'
                active_checkin.duration_minutes = active_checkin.calculate_duration()
                if notes:
                    active_checkin.notes = notes
                active_checkin.save()
                
                # Update daily attendance status
                daily_attendance = Attendance.get_or_create_today(member)
                
                # Check if member has any other active check-ins today
                other_active = AttendanceLog.objects.filter(
                    member=member,
                    check_in_time__date=today,
                    status__in=['checked_in', 'active'],
                    check_out_time__isnull=True
                ).exists()
                
                daily_attendance.set_active_status(other_active)
            
            return Response(
                {
                    "message": "Check-out successful",
                    "attendance": AttendanceLogSerializer(active_checkin).data
                },
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            return Response(
                {"error": "Check-out failed", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AttendanceStatusView(APIView):
    """
    Get member's current attendance status
    """
    authentication_classes = [JWTAuthentication, SessionAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        try:
            member_id = request.query_params.get('member_id')
            
            if not member_id:
                return Response(
                    {"error": "member_id is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                member = Member.objects.get(id=member_id)
            except Member.DoesNotExist:
                return Response(
                    {"error": "Member not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            today = timezone.now().date()
            
            # Get active check-ins
            active_checkins = AttendanceLog.objects.filter(
                member=member,
                check_in_time__date=today,
                status__in=['checked_in', 'active'],
                check_out_time__isnull=True
            )
            
            # Get today's attendance summary
            daily_attendance = Attendance.objects.filter(
                member=member,
                date=today
            ).first()
            
            return Response(
                {
                    "member": {
                        "id": member.id,
                        "name": member.full_name,
                        "is_active": bool(active_checkins.exists()),
                    },
                    "active_checkins": AttendanceLogSerializer(active_checkins, many=True).data,
                    "daily_summary": AttendanceSerializer(daily_attendance).data if daily_attendance else None,
                },
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            return Response(
                {"error": "Failed to get attendance status", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class TodaysAttendanceView(APIView):
    """
    Get today's attendance overview for dashboard
    """
    authentication_classes = [JWTAuthentication, SessionAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        try:
            today = timezone.now().date()
            mode = request.query_params.get('mode', 'full')  # 'full' or 'summary'

            # Optimize queries with prefetch_related for member's active memberships
            todays_checkins = AttendanceLog.objects.filter(
                check_in_time__date=today
            ).select_related('member').prefetch_related(
                'member__memberships__plan'
            )

            # Get currently active members
            currently_active = todays_checkins.filter(
                status__in=['checked_in', 'active'],
                check_out_time__isnull=True
            )

            # Use aggregate queries for better performance
            from django.db.models import Count, Q
            summary_data = todays_checkins.aggregate(
                total_checkins=Count('id'),
                outdoor_total=Count('id', filter=Q(visit_type='outdoor')),
                currently_active=Count('id', filter=Q(
                    status__in=['checked_in', 'active'],
                    check_out_time__isnull=True
                )),
                outdoor_active=Count('id', filter=Q(
                    visit_type='outdoor',
                    status__in=['checked_in', 'active'],
                    check_out_time__isnull=True
                ))
            )

            response_data = {
                "date": today.isoformat(),
                "summary": {
                    "total_checkins": summary_data['total_checkins'],
                    "currently_active": summary_data['currently_active'],
                    "outdoor": {
                        "total": summary_data['outdoor_total'],
                        "active": summary_data['outdoor_active']
                    }
                }
            }

            # Only include active_members in full mode to reduce data transfer
            if mode == 'full':
                response_data["active_members"] = [
                    {
                        "id": log.member.id,
                        "name": log.member.full_name,
                        "member_type": log.member.membership_type,
                        "check_in_time": log.check_in_time.isoformat(),
                        "activities": log.activities[:1] if log.activities else []  # Only first activity
                    }
                    for log in currently_active
                ]

            return Response(response_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {"error": "Failed to get today's attendance", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )