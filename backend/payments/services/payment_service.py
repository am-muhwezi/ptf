from decimal import Decimal
from django.utils import timezone
from django.db import transaction
from ..models import Payment, PaymentMethod, Invoice
from memberships.models import Membership


class PaymentService:
    """Main payment processing service"""
    
    @staticmethod
    def create_payment(membership, amount, payment_method_name, purpose='membership_fee'):
        """Create a new payment record"""
        try:
            payment_method = PaymentMethod.objects.get(name=payment_method_name, is_active=True)
            
            payment = Payment.objects.create(
                membership=membership,
                payment_method=payment_method,
                amount=Decimal(str(amount)),
                purpose=purpose,
                status='pending'
            )
            return payment, None
        except PaymentMethod.DoesNotExist:
            return None, f"Payment method '{payment_method_name}' not found or inactive"
        except Exception as e:
            return None, str(e)
    
    @staticmethod
    def process_membership_payment(membership_id, amount, payment_method_name):
        """Process payment for a membership"""
        try:
            with transaction.atomic():
                membership = Membership.objects.get(id=membership_id)
                
                # Create payment record
                payment, error = PaymentService.create_payment(
                    membership, amount, payment_method_name, 'membership_fee'
                )
                
                if error:
                    return False, error
                
                # Update membership payment status
                membership.amount_paid = Decimal(str(amount))
                membership.payment_status = 'paid'
                membership.save()
                
                # Mark payment as completed
                payment.mark_completed()
                
                return True, "Payment processed successfully"
                
        except Membership.DoesNotExist:
            return False, "Membership not found"
        except Exception as e:
            return False, str(e)
    
    @staticmethod
    def get_payment_by_id(payment_id):
        """Get payment by UUID"""
        try:
            return Payment.objects.get(payment_id=payment_id)
        except Payment.DoesNotExist:
            return None
    
    @staticmethod
    def get_membership_payments(membership_id):
        """Get all payments for a membership"""
        return Payment.objects.filter(membership_id=membership_id)
    
    @staticmethod
    def get_pending_payments():
        """Get all pending payments"""
        return Payment.objects.filter(status='pending')
    
    @staticmethod
    def mark_payment_failed(payment_id, reason=None):
        """Mark a payment as failed"""
        try:
            payment = Payment.objects.get(payment_id=payment_id)
            payment.mark_failed(reason)
            return True, "Payment marked as failed"
        except Payment.DoesNotExist:
            return False, "Payment not found"
    
    @staticmethod
    def refund_payment(payment_id, reason=None):
        """Process payment refund"""
        try:
            with transaction.atomic():
                payment = Payment.objects.get(payment_id=payment_id)
                
                if payment.status != 'completed':
                    return False, "Only completed payments can be refunded"
                
                # Update payment status
                payment.status = 'refunded'
                payment.notes = f"Refunded: {reason}" if reason else "Refunded"
                payment.save()
                
                # Update membership payment status
                membership = payment.membership
                membership.payment_status = 'pending'
                membership.save()
                
                return True, "Payment refunded successfully"
                
        except Payment.DoesNotExist:
            return False, "Payment not found"
        except Exception as e:
            return False, str(e)
    
    @staticmethod
    def record_manual_payment(membership_id, amount, payment_method_name, reference_number, notes=None, recorded_by=None, payment_date=None):
        """Record a manual payment (cash, bank transfer, cheque, etc.)"""
        try:
            with transaction.atomic():
                membership = Membership.objects.get(id=membership_id)
                
                # Create payment record
                payment, error = PaymentService.create_payment(
                    membership, amount, payment_method_name, 'membership_fee'
                )
                
                if error:
                    return None, error
                
                # Add manual payment details
                payment.external_reference = reference_number
                if notes:
                    payment.notes = notes
                if recorded_by:
                    if payment.notes:
                        payment.notes += f" | Recorded by: {recorded_by}"
                    else:
                        payment.notes = f"Recorded by: {recorded_by}"
                
                # Set payment date if provided
                if payment_date:
                    from django.utils.dateparse import parse_datetime
                    if isinstance(payment_date, str):
                        parsed_date = parse_datetime(payment_date)
                        if parsed_date:
                            payment.initiated_at = parsed_date
                
                # Mark payment as completed immediately for manual payments
                payment.mark_completed()
                
                # Update membership payment status
                membership.amount_paid = Decimal(str(amount))
                membership.payment_status = 'paid'
                membership.save()
                
                return payment, None
                
        except Membership.DoesNotExist:
            return None, "Membership not found"
        except Exception as e:
            return None, str(e)
    
    @staticmethod
    def get_payment_status(payment_id):
        """Get payment status by payment ID"""
        try:
            payment = Payment.objects.get(payment_id=payment_id)
            return {
                'payment_id': str(payment.payment_id),
                'status': payment.status,
                'amount': str(payment.amount),
                'currency': payment.currency,
                'payment_method': payment.payment_method.name if payment.payment_method else None,
                'external_reference': payment.external_reference,
                'initiated_at': payment.initiated_at.isoformat(),
                'completed_at': payment.completed_at.isoformat() if payment.completed_at else None,
                'notes': payment.notes
            }, None
        except Payment.DoesNotExist:
            return None, "Payment not found"
    
    @staticmethod
    def verify_payment(payment_id):
        """Verify payment status and update if needed"""
        try:
            payment = Payment.objects.get(payment_id=payment_id)
            
            # For manual payments, they're already verified when recorded
            if payment.payment_method and payment.payment_method.payment_type in ['cash', 'bank_transfer', 'cheque']:
                return {
                    'verified': True,
                    'status': payment.status,
                    'message': 'Manual payment verified'
                }, None
            
            # For electronic payments, implement gateway verification
            # This is where you'd check with M-Pesa, Card gateway, etc.
            return {
                'verified': payment.status == 'completed',
                'status': payment.status,
                'message': 'Payment verification completed'
            }, None
            
        except Payment.DoesNotExist:
            return None, "Payment not found"
    
    @staticmethod
    def cancel_payment(payment_id, reason=None):
        """Cancel a pending payment"""
        try:
            payment = Payment.objects.get(payment_id=payment_id)
            
            if payment.status not in ['pending', 'processing']:
                return False, f"Cannot cancel payment with status: {payment.status}"
            
            payment.status = 'cancelled'
            if reason:
                payment.notes = f"Cancelled: {reason}"
            payment.save()
            
            return True, "Payment cancelled successfully"
            
        except Payment.DoesNotExist:
            return False, "Payment not found"