from django.db import transaction
from .models import Payment, PaymentMethod


class PaymentService:

    @staticmethod
    def process_initial_payment(membership, payment_method="cash"):
        """
        Creates payment record with pending status
        All payments start as pending and must be updated via payment endpoint
        """
        # Create payment record - always pending
        payment = PaymentService._create_payment_record(membership, payment_method)

        # Keep membership payment status as pending until payment is confirmed
        return {"status": "pending", "payment_id": str(payment.payment_id)}

    @staticmethod
    def _create_payment_record(membership, payment_method):
        """Create payment database record"""
        method_obj = PaymentService._get_or_create_payment_method(payment_method)

        return Payment.objects.create(
            membership=membership,
            payment_method=method_obj,
            amount=membership.amount_paid,
            currency="KES",
            purpose="membership_fee",
            status="pending",
        )

    @staticmethod
    def _is_manual_payment(payment_method):
        """Check if payment is manual (cash, bank transfer, cheque)"""
        return payment_method.lower() in ["cash", "bank_transfer", "cheque"]

    @staticmethod
    def _process_manual_payment(payment, membership):
        """Handle cash/bank payments - auto-complete"""
        payment.status = "completed"
        payment.save()

        membership.payment_status = "paid"
        membership.save()

        return {"status": "completed", "payment_id": str(payment.payment_id)}

    @staticmethod
    def _process_electronic_payment(payment, membership):
        """Handle mpesa/card payments - stay pending"""
        # Keep payment pending for manual verification
        return {"status": "pending", "payment_id": str(payment.payment_id)}

    @staticmethod
    def _get_or_create_payment_method(payment_method):
        """Ensure payment method exists"""
        method_obj, created = PaymentMethod.objects.get_or_create(
            name=payment_method.title(),
            defaults={
                "payment_type": PaymentService._get_payment_type(payment_method),
                "is_active": True,
            },
        )
        return method_obj

    @staticmethod
    def _get_payment_type(payment_method):
        """Map payment method to type"""
        type_map = {
            "cash": "cash",
            "mpesa": "mpesa",
            "card": "card",
            "bank_transfer": "bank_transfer",
        }
        return type_map.get(payment_method.lower(), "cash")

    @staticmethod
    def update_payment_status(payment, new_status):
        """
        Update payment status and related membership
        """
        payment.status = new_status
        payment.save()

        # Update membership payment status based on payment status
        if new_status == "completed":
            payment.membership.payment_status = "paid"
            payment.membership.save()
            return {"membership_status": "paid"}
        elif new_status == "failed":
            payment.membership.payment_status = "unpaid"
            payment.membership.save()
            return {"membership_status": "unpaid"}

        return {"membership_status": payment.membership.payment_status}
