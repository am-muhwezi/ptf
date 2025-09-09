from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.utils import timezone
from .models import Member
from attendance.models import AttendanceLog


@api_view(["POST"])
def checkin(request, member_id):
    """Simple check-in with member ID in URL"""
    try:
        # Get visit type from query params or default to indoor
        visit_type = request.query_params.get("visit_type", "indoor")

        member = Member.objects.get(id=member_id, status="active")

        # Check if already checked in
        if AttendanceLog.objects.filter(
            member=member, check_out_time__isnull=True
        ).exists():
            return Response(
                {
                    "error": f"{member.first_name} {member.last_name} is already checked in"
                },
                status=400,
            )

        # Create attendance
        attendance = AttendanceLog.objects.create(
            member=member, visit_type=visit_type, status="checked_in"
        )

        # Update member stats
        member.total_visits += 1
        member.last_visit = timezone.now()
        member.save()

        # Try to use session from membership
        active_membership = member.memberships.filter(status="active").first()
        sessions_remaining = 0
        if (
            active_membership
            and active_membership.sessions_used
            < active_membership.total_sessions_allowed
        ):
            active_membership.sessions_used += 1
            active_membership.save()
            sessions_remaining = (
                active_membership.total_sessions_allowed
                - active_membership.sessions_used
            )

        return Response(
            {
                "success": True,
                "message": f"✅ {member.first_name} {member.last_name} checked in successfully",
                "member_name": f"{member.first_name} {member.last_name}",
                "visit_type": visit_type,
                "sessions_remaining": sessions_remaining,
                "check_in_time": attendance.check_in_time.isoformat(),
            }
        )

    except Member.DoesNotExist:
        return Response({"error": "Member not found"}, status=404)
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(["POST"])
def checkout(request, member_id):
    """Simple check-out with member ID in URL"""
    try:
        member = Member.objects.get(id=member_id)

        # Find active check-in
        attendance = AttendanceLog.objects.filter(
            member=member, check_out_time__isnull=True
        ).first()

        if not attendance:
            return Response(
                {"error": f"{member.first_name} {member.last_name} is not checked in"},
                status=400,
            )

        # Check out
        attendance.check_out_time = timezone.now()
        attendance.status = "checked_out"
        attendance.save()

        return Response(
            {
                "success": True,
                "message": f"✅ {member.first_name} {member.last_name} checked out successfully",
                "member_name": f"{member.first_name} {member.last_name}",
                "duration": attendance.formatted_duration,
                "visit_type": attendance.visit_type,
            }
        )

    except Member.DoesNotExist:
        return Response({"error": "Member not found"}, status=404)
    except Exception as e:
        return Response({"error": str(e)}, status=500)
