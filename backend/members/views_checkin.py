from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import Member
from attendance.services import AttendanceService


@api_view(["POST"])
def checkin_member(request):
    """
    JUNIOR DEV NOTE: This is just HTTP handling
    Real logic is in AttendanceService
    """
    try:
        member_id = request.data.get("member_id")
        visit_type = request.data.get("visit_type", "indoor")

        if not member_id:
            return Response({"error": "member_id required"}, status=400)

        member = Member.objects.get(id=member_id, status="active")

        # Delegate to attendance service
        result = AttendanceService.check_in_member(member, visit_type)

        return Response(
            {
                "success": True,
                "message": f"{member.first_name} {member.last_name} checked in",
                "sessions_remaining": result["sessions_remaining"],
                "attendance_id": result["attendance"].id,
            }
        )

    except Member.DoesNotExist:
        return Response({"error": "Member not found"}, status=404)
    except ValueError as e:
        return Response({"error": str(e)}, status=400)
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(["POST"])
def checkout_member(request):
    """Handle member check-out"""
    try:
        member_id = request.data.get("member_id")
        member = Member.objects.get(id=member_id)

        # Delegate to attendance service
        attendance = AttendanceService.check_out_member(member)

        return Response(
            {
                "success": True,
                "message": f"{member.first_name} {member.last_name} checked out",
                "duration": attendance.formatted_duration,
            }
        )

    except Member.DoesNotExist:
        return Response({"error": "Member not found"}, status=404)
    except ValueError as e:
        return Response({"error": str(e)}, status=400)
    except Exception as e:
        return Response({"error": str(e)}, status=500)
