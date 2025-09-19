from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from django.utils import timezone
from .models import Payment, PaymentMethod
from memberships.models import Membership


@api_view(["POST"])
def confirm_payment(request):
    """Confirm pending payment"""
    try:
        payment_id = request.data.get("payment_id")
        confirmation_method = request.data.get("confirmation_method", "manual")
        reference_number = request.data.get("reference_number", "")

        if not payment_id:
            return Response({"error": "payment_id is required"}, status=400)

        with transaction.atomic():
            try:
                payment = Payment.objects.get(payment_id=payment_id)
            except Payment.DoesNotExist:
                return Response({"error": "Payment not found"}, status=404)

            if payment.status != "pending":
                return Response(
                    {"error": f"Payment is already {payment.status}"}, status=400
                )

            # Update payment - use existing fields only
            payment.status = "completed"
            if hasattr(payment, "external_reference"):
                payment.external_reference = reference_number
            payment.save()

            # Update membership
            membership = payment.membership
            membership.payment_status = "paid"
            membership.save()

            member = membership.member

            return Response(
                {
                    "success": True,
                    "message": f"Payment confirmed for {member.first_name} {member.last_name}",
                    "payment_id": str(payment.payment_id),
                    "member_name": f"{member.first_name} {member.last_name}",
                    "amount": str(payment.amount),
                    "confirmation_method": confirmation_method,
                }
            )

    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(["GET"])
def list_pending_payments_detailed(request):
    """List pending payments - use existing fields only"""
    try:
        pending_payments = (
            Payment.objects.filter(status="pending")
            .select_related("membership__member", "membership__plan", "payment_method")
            .order_by("created_at")
        )

        payments_data = []
        for payment in pending_payments:
            member = payment.membership.member
            plan = payment.membership.plan

            payment_info = {
                "payment_id": str(payment.payment_id),
                "member_name": f"{member.first_name} {member.last_name}",
                "member_phone": member.phone,
                "plan_name": plan.plan_name,
                "membership_type": plan.membership_type,
                "amount": str(payment.amount),
                "currency": payment.currency,
                "payment_method": (
                    payment.payment_method.name if payment.payment_method else "Unknown"
                ),
                "created_at": payment.created_at.isoformat(),
                "member_id": member.id,
                "membership_id": payment.membership.id,
            }
            payments_data.append(payment_info)

        return Response(
            {
                "success": True,
                "pending_payments": payments_data,
                "count": len(payments_data),
            }
        )

    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(["GET"])
def list_completed_payments(request):
    """List completed payments - use existing fields only"""
    try:
        completed_payments = (
            Payment.objects.filter(status="completed")
            .select_related("membership__member", "membership__plan", "payment_method")
            .order_by("-updated_at")
        )  # Use updated_at instead of completed_at

        payments_data = []
        for payment in completed_payments:
            member = payment.membership.member

            payment_info = {
                "payment_id": str(payment.payment_id),
                "member_name": f"{member.first_name} {member.last_name}",
                "amount": str(payment.amount),
                "payment_method": (
                    payment.payment_method.name if payment.payment_method else "Unknown"
                ),
                "completed_at": payment.updated_at.isoformat(),  # Use updated_at
                "external_reference": getattr(payment, "external_reference", "") or "",
            }
            payments_data.append(payment_info)

        return Response(
            {
                "success": True,
                "completed_payments": payments_data,
                "count": len(payments_data),
            }
        )

    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(["POST"])
def record_manual_payment(request):
    """Record manual payment (cash, bank transfer, etc.)"""
    try:
        member_id = request.data.get("memberId")
        amount = request.data.get("amount")
        payment_method = request.data.get("paymentMethod", "cash")
        description = request.data.get("description", "")

        if not member_id or not amount:
            return Response({"error": "memberId and amount are required"}, status=400)

        # Validate payment method
        valid_methods = ["cash", "bank_transfer", "cheque", "mpesa"]
        if payment_method not in valid_methods:
            return Response({"error": f"Invalid payment method. Must be one of: {', '.join(valid_methods)}"}, status=400)

        with transaction.atomic():
            # Find the member's latest unpaid membership
            from memberships.models import Membership
            from members.models import Member
            
            # Get the member first
            try:
                member = Member.objects.get(id=member_id)
            except Member.DoesNotExist:
                return Response({"error": f"Member with ID {member_id} not found"}, status=404)
            
            # Find their unpaid membership (pending or overdue)
            membership = Membership.objects.filter(
                member=member, payment_status__in=["pending", "overdue"]
            ).first()

            if not membership:
                return Response(
                    {"error": "No unpaid membership found for this member"}, status=404
                )

            # Create payment record
            from .services import PaymentService
            payment = PaymentService._create_payment_record(membership, payment_method)
            payment.amount = float(amount)
            payment.purpose = "membership_fee" 
            payment.status = "completed"
            payment.save()

            # Update membership as paid
            membership.payment_status = "paid"
            membership.save()

            # Get member name for response
            member = membership.member
            method_name = payment_method.replace('_', ' ').title()

            return Response(
                {
                    "success": True,
                    "message": f"{method_name} payment recorded successfully for {member.first_name} {member.last_name}",
                    "payment_id": str(payment.payment_id),
                    "amount": str(payment.amount),
                    "status": "completed",
                    "payment_method": payment_method,  # Send original payment method
                    "payment_method_display": method_name,  # Send formatted name
                    "transaction_reference": request.data.get("transactionReference"),
                    "timestamp": payment.created_at.isoformat(),
                }
            )

    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(["GET"])
def list_all_payments(request):
    """List all payments"""
    try:
        payments = Payment.objects.select_related(
            "membership__member", "membership__plan", "payment_method"
        ).order_by("-created_at")

        payments_data = []
        for payment in payments:
            member = payment.membership.member
            plan = payment.membership.plan

            payment_info = {
                "payment_id": str(payment.payment_id),
                "member_name": f"{member.first_name} {member.last_name}",
                "plan_name": plan.plan_name,
                "amount": str(payment.amount),
                "payment_method": (
                    payment.payment_method.name if payment.payment_method else "Unknown"
                ),
                "status": payment.status,
                "created_at": payment.created_at.isoformat(),
            }
            payments_data.append(payment_info)

        return Response(
            {"success": True, "payments": payments_data, "count": len(payments_data)}
        )

    except Exception as e:
        return Response({"error": str(e)}, status=500)
