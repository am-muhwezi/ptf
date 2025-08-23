from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json

from .services import PaymentService, MpesaService
from .serializers import PaymentSerializer
from ptf.permissions import IsStaffOrSuperUser, IsSuperUser


@api_view(['POST'])
@permission_classes([IsStaffOrSuperUser])
def record_manual_payment(request):
    """Record manual payment (cash, bank transfer, etc.) - Staff and Superuser only"""
    try:
        membership_id = request.data.get('membership_id')
        amount = request.data.get('amount')
        payment_method = request.data.get('payment_method', 'cash')
        reference_number = request.data.get('reference_number')
        notes = request.data.get('notes')
        payment_date = request.data.get('payment_date')
        recorded_by = request.data.get('recorded_by')
        
        if not all([membership_id, amount, reference_number]):
            return Response({
                'success': False,
                'message': 'Missing required fields: membership_id, amount, reference_number'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Record manual payment
        payment, error = PaymentService.record_manual_payment(
            membership_id, amount, payment_method, reference_number,
            notes, recorded_by, payment_date
        )
        
        if error:
            return Response({
                'success': False,
                'message': error
            }, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = PaymentSerializer(payment)
        return Response({
            'success': True,
            'data': serializer.data,
            'payment_id': str(payment.payment_id),
            'message': 'Manual payment recorded successfully'
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsStaffOrSuperUser])
def get_payment_status(request, transaction_id):
    """Check payment status by transaction ID - Staff and Superuser only"""
    try:
        payment_data, error = PaymentService.get_payment_status(transaction_id)
        
        if error:
            return Response({
                'success': False,
                'message': error
            }, status=status.HTTP_404_NOT_FOUND)
        
        return Response({
            'success': True,
            'data': payment_data,
            'status': payment_data['status'],
            'message': 'Payment status retrieved'
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsStaffOrSuperUser])
def get_payment_history(request, member_id):
    """Get payment history for a member - Staff and Superuser only"""
    try:
        from .models import Payment
        from django.db import models
        
        # Get payments for all memberships of this member
        payments = Payment.objects.filter(
            membership__member_id=member_id
        ).select_related('payment_method', 'membership')
        
        # Apply filters
        status_filter = request.query_params.get('status')
        if status_filter:
            payments = payments.filter(status=status_filter)
        
        date_from = request.query_params.get('date_from')
        if date_from:
            payments = payments.filter(initiated_at__gte=date_from)
            
        date_to = request.query_params.get('date_to')
        if date_to:
            payments = payments.filter(initiated_at__lte=date_to)
        
        limit = request.query_params.get('limit')
        if limit:
            payments = payments[:int(limit)]
        
        serializer = PaymentSerializer(payments, many=True)
        
        # Calculate totals
        total_paid = payments.filter(status='completed').aggregate(
            total=models.Sum('amount')
        )['total'] or 0
        
        total_pending = payments.filter(status__in=['pending', 'processing']).aggregate(
            total=models.Sum('amount')
        )['total'] or 0
        
        return Response({
            'success': True,
            'payments': serializer.data,
            'data': serializer.data,
            'total_paid': str(total_paid),
            'total_pending': str(total_pending),
            'payment_count': payments.count()
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)