from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db import models
import json

from .models import Payment, PaymentMethod, Invoice, PaymentReminder
from .serializers import (
    PaymentSerializer, PaymentMethodSerializer, InvoiceSerializer,
    PaymentReminderSerializer
)
from .services import PaymentService, MpesaService, InvoiceService


class PaymentMethodViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PaymentMethod.objects.filter(is_active=True)
    serializer_class = PaymentMethodSerializer
    permission_classes = [IsAuthenticated]


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'payment_id'
    
    def get_queryset(self):
        queryset = Payment.objects.all()
        membership_id = self.request.query_params.get('membership_id')
        if membership_id:
            queryset = queryset.filter(membership_id=membership_id)
        return queryset
    
    def create(self, request):
        """Create a new payment"""
        try:
            membership_id = request.data.get('membership_id')
            amount = request.data.get('amount')
            payment_method_name = request.data.get('payment_method')
            purpose = request.data.get('purpose', 'membership_fee')
            
            if not all([membership_id, amount, payment_method_name]):
                return Response({
                    'success': False,
                    'message': 'Missing required fields'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            payment, error = PaymentService.create_payment(
                membership_id, amount, payment_method_name, purpose
            )
            
            if error:
                return Response({
                    'success': False,
                    'message': error
                }, status=status.HTTP_400_BAD_REQUEST)
            
            serializer = self.get_serializer(payment)
            return Response({
                'success': True,
                'data': serializer.data,
                'message': 'Payment created successfully'
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def initiate_mpesa(self, request, payment_id=None):
        """Initiate M-Pesa STK Push payment"""
        try:
            payment = self.get_object()
            phone_number = request.data.get('phone_number')
            account_reference = request.data.get('account_reference')
            transaction_desc = request.data.get('transaction_desc', 'Membership Payment')
            
            if not all([phone_number, account_reference]):
                return Response({
                    'success': False,
                    'message': 'Missing required fields'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Initiate M-Pesa STK Push
            mpesa_service = MpesaService()
            success, result = mpesa_service.initiate_stk_push(
                phone_number, payment.amount, account_reference, 
                transaction_desc, payment.id
            )
            
            if success:
                # Update payment status to processing
                payment.status = 'processing'
                payment.save()
                
                return Response({
                    'success': True,
                    'message': 'STK Push initiated successfully',
                    'data': result
                })
            else:
                return Response({
                    'success': False,
                    'message': result
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def mpesa_callback(self, request):
        """Handle M-Pesa payment callback"""
        try:
            callback_data = request.data
            
            # Process the callback
            mpesa_service = MpesaService()
            success, message = mpesa_service.process_callback(callback_data)
            
            return JsonResponse({
                'ResultCode': 0 if success else 1,
                'ResultDesc': message
            })
            
        except Exception as e:
            return JsonResponse({
                'ResultCode': 1,
                'ResultDesc': str(e)
            })
    
    @action(detail=False, methods=['get'])
    def query_mpesa(self, request):
        """Query M-Pesa payment status"""
        try:
            checkout_request_id = request.query_params.get('checkout_request_id')
            if not checkout_request_id:
                return Response({
                    'success': False,
                    'message': 'checkout_request_id is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            mpesa_service = MpesaService()
            result, error = mpesa_service.query_stk_status(checkout_request_id)
            
            if error:
                return Response({
                    'success': False,
                    'message': error
                }, status=status.HTTP_400_BAD_REQUEST)
            
            return Response({
                'success': True,
                'data': result
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def manual(self, request):
        """Record manual payment (cash, bank transfer, etc.)"""
        try:
            member_id = request.data.get('member_id')
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
            
            serializer = self.get_serializer(payment)
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
    
    @action(detail=False, methods=['post'])
    def process(self, request):
        """Generic payment processing endpoint"""
        try:
            payment_method = request.data.get('payment_method')
            membership_id = request.data.get('membership_id')
            amount = request.data.get('amount')
            description = request.data.get('description')
            metadata = request.data.get('metadata', {})
            customer_info = request.data.get('customer_info', {})
            
            if not all([payment_method, membership_id, amount]):
                return Response({
                    'success': False,
                    'message': 'Missing required fields'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Handle different payment methods
            if payment_method in ['cash', 'bank_transfer', 'cheque']:
                # Manual payment
                reference_number = metadata.get('reference_number') or request.data.get('reference_number')
                notes = metadata.get('notes') or request.data.get('notes')
                recorded_by = metadata.get('recorded_by') or request.data.get('recorded_by')
                
                if not reference_number:
                    return Response({
                        'success': False,
                        'message': 'Reference number required for manual payments'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                payment, error = PaymentService.record_manual_payment(
                    membership_id, amount, payment_method, reference_number,
                    notes, recorded_by
                )
                
                if error:
                    return Response({
                        'success': False,
                        'message': error
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                return Response({
                    'success': True,
                    'payment_id': str(payment.payment_id),
                    'transaction_id': str(payment.payment_id),
                    'status': payment.status,
                    'message': 'Payment processed successfully'
                })
            else:
                # Electronic payment (M-Pesa, Card)
                payment, error = PaymentService.create_payment(
                    membership_id, amount, payment_method, 'membership_fee'
                )
                
                if error:
                    return Response({
                        'success': False,
                        'message': error
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                return Response({
                    'success': True,
                    'payment_id': str(payment.payment_id),
                    'transaction_id': str(payment.payment_id),
                    'status': payment.status,
                    'message': 'Payment created successfully'
                })
            
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'], url_path='status/(?P<transaction_id>[^/.]+)')
    def status_by_id(self, request, transaction_id=None):
        """Check payment status by transaction ID"""
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
    
    @action(detail=True, methods=['post'])
    def verify(self, request, payment_id=None):
        """Verify payment"""
        try:
            payment = self.get_object()
            verification_data, error = PaymentService.verify_payment(payment.payment_id)
            
            if error:
                return Response({
                    'success': False,
                    'message': error
                }, status=status.HTTP_400_BAD_REQUEST)
            
            return Response({
                'success': True,
                'data': verification_data,
                'verified': verification_data['verified'],
                'status': verification_data['status'],
                'message': verification_data['message']
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, payment_id=None):
        """Cancel payment"""
        try:
            payment = self.get_object()
            reason = request.data.get('reason')
            
            success, message = PaymentService.cancel_payment(payment.payment_id, reason)
            
            if success:
                return Response({
                    'success': True,
                    'message': message
                })
            else:
                return Response({
                    'success': False,
                    'message': message
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def refund(self, request, payment_id=None):
        """Refund payment"""
        try:
            payment = self.get_object()
            reason = request.data.get('reason')
            
            success, message = PaymentService.refund_payment(payment.payment_id, reason)
            
            if success:
                return Response({
                    'success': True,
                    'message': message,
                    'refund_id': str(payment.payment_id)  # In real system, generate separate refund ID
                })
            else:
                return Response({
                    'success': False,
                    'message': message
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'], url_path='history/(?P<member_id>[^/.]+)')
    def history_by_member(self, request, member_id=None):
        """Get payment history for a member"""
        try:
            
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
            
            serializer = self.get_serializer(payments, many=True)
            
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


class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = Invoice.objects.all()
        membership_id = self.request.query_params.get('membership_id')
        if membership_id:
            queryset = queryset.filter(membership_id=membership_id)
        return queryset
    
    def create(self, request):
        """Create an invoice"""
        try:
            membership_id = request.data.get('membership_id')
            amount = request.data.get('amount')
            description = request.data.get('description')
            due_days = request.data.get('due_days', 7)
            
            if not all([membership_id, amount, description]):
                return Response({
                    'success': False,
                    'message': 'Missing required fields'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            invoice, error = InvoiceService.create_invoice(
                membership_id, amount, description, due_days
            )
            
            if error:
                return Response({
                    'success': False,
                    'message': error
                }, status=status.HTTP_400_BAD_REQUEST)
            
            serializer = self.get_serializer(invoice)
            return Response({
                'success': True,
                'data': serializer.data,
                'message': 'Invoice created successfully'
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def overdue(self, request):
        """Get overdue invoices"""
        try:
            invoices = InvoiceService.get_overdue_invoices()
            serializer = self.get_serializer(invoices, many=True)
            
            return Response({
                'success': True,
                'data': serializer.data
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def mark_paid(self, request, pk=None):
        """Mark invoice as paid"""
        try:
            invoice = self.get_object()
            success, message = InvoiceService.mark_invoice_paid(invoice.id)
            
            if success:
                serializer = self.get_serializer(invoice)
                return Response({
                    'success': True,
                    'data': serializer.data,
                    'message': message
                })
            else:
                return Response({
                    'success': False,
                    'message': message
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PaymentReminderViewSet(viewsets.ModelViewSet):
    queryset = PaymentReminder.objects.all()
    serializer_class = PaymentReminderSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = PaymentReminder.objects.all()
        membership_id = self.request.query_params.get('membership_id')
        if membership_id:
            queryset = queryset.filter(membership_id=membership_id)
        return queryset