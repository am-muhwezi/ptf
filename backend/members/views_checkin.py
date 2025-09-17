from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.utils import timezone
from .models import Member
from attendance.models import AttendanceLog


@api_view(["POST"])
def checkin(request, member_id):
    """Simple check-in with member ID in URL"""
    try:
        member = Member.objects.select_related().prefetch_related('memberships__plan').get(id=member_id, status="active")

        # Automatically determine visit type from member's active membership
        active_membership = member.memberships.filter(status='active').first()
        if not active_membership:
            return Response(
                {"error": f"{member.first_name} {member.last_name} has no active membership"},
                status=400
            )

        visit_type = active_membership.plan.membership_type

        # Check payment status
        if active_membership.payment_status == 'pending':
            return Response(
                {"error": "Cannot check-in: Payment is still pending. Please complete payment first."},
                status=400
            )

        if active_membership.payment_status == 'overdue':
            return Response(
                {"error": "Cannot check-in: Payment is overdue. Please update payment to continue."},
                status=400
            )

        # Check if membership is expired
        if active_membership.is_expired:
            return Response(
                {"error": "Membership has expired. Please renew to continue."},
                status=400
            )

        # Check sessions remaining
        if active_membership.sessions_used >= active_membership.total_sessions_allowed:
            return Response(
                {"error": "No sessions remaining on this membership."},
                status=400
            )

        # Check if already checked in today (allow one check-in per day)
        from django.utils import timezone
        today = timezone.now().date()

        if AttendanceLog.objects.filter(
            member=member,
            check_in_time__date=today
        ).exists():
            return Response(
                {
                    "error": f"{member.first_name} {member.last_name} has already checked in today"
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
                "message": f"✅ {member.first_name} {member.last_name} checked in successfully",
                "visit_type": visit_type,
                "sessions_remaining": sessions_remaining,
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
