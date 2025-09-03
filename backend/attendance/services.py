# RESPONSIBILITY: Everything about attendance (check-in, check-out, tracking)
from django.utils import timezone
from .models import AttendanceLog
from memberships.services import MembershipService


class AttendanceService:

    @staticmethod
    def check_in_member(member, visit_type="indoor"):
        """
        JUNIOR DEV NOTE: This handles check-in logic
        - Validates member can check in
        - Creates attendance record
        - Uses session from membership
        """
        # Check if already checked in
        if AttendanceService._is_already_checked_in(member):
            raise ValueError("Member is already checked in")

        # Create attendance record
        attendance = AttendanceLog.objects.create(
            member=member, visit_type=visit_type, status="checked_in"
        )

        # Use session from active membership
        active_membership = member.memberships.filter(status="active").first()
        if active_membership:
            try:
                sessions_remaining = MembershipService.use_session(active_membership)
            except ValueError:
                sessions_remaining = 0
        else:
            sessions_remaining = 0

        # Update member visit count
        member.total_visits += 1
        member.last_visit = timezone.now()
        member.save()

        return {"attendance": attendance, "sessions_remaining": sessions_remaining}

    @staticmethod
    def check_out_member(member):
        """Handle member check-out"""
        attendance = AttendanceService._get_active_attendance(member)
        if not attendance:
            raise ValueError("No active check-in found")

        attendance.check_out_time = timezone.now()
        attendance.status = "checked_out"
        attendance.save()

        return attendance

    @staticmethod
    def _is_already_checked_in(member):
        """Check if member is currently checked in"""
        return AttendanceLog.objects.filter(
            member=member, check_out_time__isnull=True, status="checked_in"
        ).exists()

    @staticmethod
    def _get_active_attendance(member):
        """Get current active attendance record"""
        return AttendanceLog.objects.filter(
            member=member, check_out_time__isnull=True, status="checked_in"
        ).first()
