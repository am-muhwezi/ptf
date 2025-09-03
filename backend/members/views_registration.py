from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db import transaction
from .models import Member, PhysicalProfile
from memberships.services import MembershipService
from payments.services import PaymentService


@api_view(["POST"])
def register_member(request):
    """
    DEV NOTE: This is the CONDUCTOR, not the orchestra
    It only coordinates between different services
    """
    try:
        with transaction.atomic():
            # 1. MEMBERS APP: Create member (personal info only)
            member_data = extract_member_data(request.data)
            member = create_member_record(member_data)

            # 2. MEMBERSHIPS APP: Handle subscription logic
            membership = MembershipService.create_membership(
                member=member, plan_code=request.data["plan_code"]
            )

            # 3. PAYMENTS APP: Handle payment processing
            payment = PaymentService.process_initial_payment(
                membership=membership,
                payment_method=request.data.get("payment_method", "cash"),
            )

            return Response(
                {
                    "success": True,
                    "member_id": member.id,
                    "membership_id": membership.id,
                    "payment_status": payment["status"],
                }
            )
    except Exception as e:
        return Response({"error": str(e)}, status=500)


def create_member_record(member_data):
    """STAYS IN MEMBERS APP - only personal info"""
    return Member.objects.create(**member_data)


def extract_member_data(request_data):
    """Clean separation: only member fields"""
    return {
        "first_name": request_data["first_name"],
        "last_name": request_data["last_name"],
        "phone": request_data["phone"],
        "email": request_data.get("email"),
        "status": "active",
    }
