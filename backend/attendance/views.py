from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.authentication import SessionAuthentication
from ptf.permissions import IsStaffOrSuperUser
from django.utils import timezone
from datetime import datetime, date
from django.db import transaction
import json

from members.models import Member
from memberships.models import Membership
from .models import AttendanceLog, Attendance
from .serializers import AttendanceLogSerializer, AttendanceSerializer


class AttendanceViewSet(APIView):
    """
    Simplified MVP attendance API - Just returns attendance logs
    """

    authentication_classes = [JWTAuthentication, SessionAuthentication]

    def get(self, request):
        """Get attendance logs with simple filtering"""
        try:
            # Get query parameters
            member_id = request.query_params.get('member_id')
            date_filter = request.query_params.get('date')  # YYYY-MM-DD
            visit_type = request.query_params.get('visit_type')  # indoor/outdoor
            limit = int(request.query_params.get('limit', 50))
            
            # Base query
            logs = AttendanceLog.objects.select_related('member').all()
            
            # Apply filters
            if member_id:
                logs = logs.filter(member_id=member_id)
            if date_filter:
                try:
                    from datetime import datetime
                    date_obj = datetime.strptime(date_filter, '%Y-%m-%d').date()
                    logs = logs.filter(check_in_time__date=date_obj)
                except ValueError:
                    return Response(
                        {"error": "Invalid date format. Use YYYY-MM-DD"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            if visit_type in ['indoor', 'outdoor']:
                logs = logs.filter(visit_type=visit_type)
                
            # Limit results
            logs = logs[:limit]
            
            # Serialize logs
            logs_data = AttendanceLogSerializer(logs, many=True).data
            
            return Response({
                "success": True,
                "count": len(logs_data),
                "logs": logs_data,
                "filters": {
                    "member_id": member_id,
                    "date": date_filter,
                    "visit_type": visit_type,
                    "limit": limit
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {"error": "Failed to retrieve attendance logs", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def post(self, request):
        """Handle basic check-in and check-out"""
        try:
            data = request.data
            action = data.get('action')
            
            if action == 'check_in':
                return self._handle_check_in(data)
            elif action == 'check_out':
                return self._handle_check_out(data)
            else:
                return Response(
                    {"error": "Invalid action. Supported: check_in, check_out"},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            return Response(
                {"error": "Request failed", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _handle_check_in(self, data):
        """Handle member check-in - simplified"""
        member_id = data.get("member_id")
        visit_type = data.get("visit_type", "indoor")
        notes = data.get("notes", "")

        if not member_id:
            return Response(
                {"error": "member_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if visit_type not in ["indoor", "outdoor"]:
            visit_type = "indoor"  # Default fallback

        try:
            member = Member.objects.get(id=member_id)
        except Member.DoesNotExist:
            return Response(
                {"error": "Member not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check if member is already checked in
        existing_checkin = AttendanceLog.objects.filter(
            member=member,
            check_out_time__isnull=True,
            status="checked_in"
        ).first()

        if existing_checkin:
            return Response(
                {
                    "error": "Member is already checked in",
                    "current_checkin": {
                        "id": existing_checkin.id,
                        "check_in_time": existing_checkin.check_in_time,
                        "visit_type": existing_checkin.visit_type
                    }
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create attendance log
        attendance_log = AttendanceLog.objects.create(
            member=member,
            visit_type=visit_type,
            check_in_time=timezone.now(),
            status="checked_in",
            notes=notes
        )

        return Response(
            {
                "success": True,
                "message": "Check-in successful",
                "log": AttendanceLogSerializer(attendance_log).data
            },
            status=status.HTTP_201_CREATED
        )

    def _handle_check_out(self, data):
        """Handle member check-out - simplified"""
        member_id = data.get("member_id")
        attendance_id = data.get("attendance_id")
        notes = data.get("notes", "")

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
        active_checkin = None

        if attendance_id:
            try:
                active_checkin = AttendanceLog.objects.get(
                    id=attendance_id, member=member, check_out_time__isnull=True
                )
            except AttendanceLog.DoesNotExist:
                pass

        if not active_checkin:
            # Find most recent unchecked-out log
            active_checkin = AttendanceLog.objects.filter(
                member=member,
                check_out_time__isnull=True
            ).order_by('-check_in_time').first()

        if not active_checkin:
            return Response(
                {"error": "No active check-in found for this member"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Process check-out
        active_checkin.check_out_time = timezone.now()
        active_checkin.status = "checked_out"
        active_checkin.duration_minutes = active_checkin.calculate_duration()
        if notes:
            active_checkin.notes = f"{active_checkin.notes or ''} {notes}".strip()
        active_checkin.save()

        return Response(
            {
                "success": True,
                "message": "Check-out successful",
                "log": AttendanceLogSerializer(active_checkin).data
            },
            status=status.HTTP_200_OK
        )

