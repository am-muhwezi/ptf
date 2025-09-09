from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Payment
from .services import PaymentService


@api_view(["PATCH"])
def update_payment_status(request, payment_id):
    """
    Update payment status from pending to completed/failed
    """
    try:
        payment = get_object_or_404(Payment, payment_id=payment_id)
        new_status = request.data.get("status")
        
        if not new_status:
            return Response({"error": "status field is required"}, status=400)
            
        if new_status not in ["completed", "failed"]:
            return Response({"error": "status must be 'completed' or 'failed'"}, status=400)
            
        # Update payment status using service
        result = PaymentService.update_payment_status(payment, new_status)
        
        return Response({
            "success": True,
            "payment_id": str(payment.payment_id),
            "status": payment.status,
            "membership_status": result.get("membership_status")
        })
        
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(["GET"])
def get_payment_status(request, payment_id):
    """
    Get current payment status
    """
    try:
        payment = get_object_or_404(Payment, payment_id=payment_id)
        
        return Response({
            "payment_id": str(payment.payment_id),
            "status": payment.status,
            "amount": str(payment.amount),
            "currency": payment.currency,
            "membership_id": payment.membership.id,
            "created_at": payment.created_at
        })
        
    except Exception as e:
        return Response({"error": str(e)}, status=500)