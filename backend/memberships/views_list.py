from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.utils import timezone
from .models import Membership, MembershipPlan


@api_view(["GET"])
def list_all_memberships(request):
    """
    JUNIOR DEV NOTE: Shows ALL memberships with member and payment info
    """
    try:
        memberships = (
            Membership.objects.select_related("member", "plan")
            .prefetch_related("payments")
            .order_by("-created_at")
        )

        memberships_data = []
        for membership in memberships:
            member = membership.member
            plan = membership.plan

            membership_info = {
                "membership_id": membership.id,
                "member_name": f"{member.first_name} {member.last_name}",
                "member_phone": member.phone,
                "plan_name": plan.plan_name,
                "membership_type": plan.membership_type,
                "status": membership.status,
                "payment_status": membership.payment_status,
                "start_date": membership.start_date.isoformat(),
                "end_date": membership.end_date.isoformat(),
                "sessions_allowed": membership.total_sessions_allowed,
                "sessions_used": membership.sessions_used,
                "sessions_remaining": membership.total_sessions_allowed
                - membership.sessions_used,
                "amount_paid": str(membership.amount_paid),
                "is_expired": membership.end_date < timezone.now().date(),
                "created_at": membership.created_at.isoformat(),
            }
            memberships_data.append(membership_info)

        return Response(
            {
                "success": True,
                "memberships": memberships_data,
                "count": len(memberships_data),
            }
        )

    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(["GET"])
def list_memberships_by_plan(request, plan_code):
    """List all memberships for a specific plan"""
    try:
        memberships = (
            Membership.objects.filter(plan__plan_code=plan_code)
            .select_related("member", "plan")
            .order_by("-created_at")
        )

        memberships_data = []
        for membership in memberships:
            member = membership.member

            membership_info = {
                "membership_id": membership.id,
                "member_name": f"{member.first_name} {member.last_name}",
                "member_phone": member.phone,
                "status": membership.status,
                "payment_status": membership.payment_status,
                "sessions_remaining": membership.total_sessions_allowed
                - membership.sessions_used,
                "start_date": membership.start_date.isoformat(),
                "end_date": membership.end_date.isoformat(),
            }
            memberships_data.append(membership_info)

        return Response(
            {
                "success": True,
                "plan_code": plan_code,
                "memberships": memberships_data,
                "count": len(memberships_data),
            }
        )

    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(["GET"])
def list_expiring_memberships(request):
    """List memberships expiring in next 7 days"""
    try:
        from datetime import timedelta

        next_week = timezone.now().date() + timedelta(days=7)

        expiring_memberships = (
            Membership.objects.filter(
                end_date__lte=next_week,
                end_date__gte=timezone.now().date(),
                status="active",
            )
            .select_related("member", "plan")
            .order_by("end_date")
        )

        memberships_data = []
        for membership in expiring_memberships:
            member = membership.member
            days_left = (membership.end_date - timezone.now().date()).days

            membership_info = {
                "membership_id": membership.id,
                "member_name": f"{member.first_name} {member.last_name}",
                "member_phone": member.phone,
                "plan_name": membership.plan.plan_name,
                "end_date": membership.end_date.isoformat(),
                "days_left": days_left,
                "sessions_remaining": membership.total_sessions_allowed
                - membership.sessions_used,
                "payment_status": membership.payment_status,
            }
            memberships_data.append(membership_info)

        return Response(
            {
                "success": True,
                "expiring_memberships": memberships_data,
                "count": len(memberships_data),
            }
        )

    except Exception as e:
        return Response({"error": str(e)}, status=500)
