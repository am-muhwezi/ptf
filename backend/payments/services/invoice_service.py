from datetime import datetime, timedelta
from django.utils import timezone
from ..models import Invoice, PaymentReminder
from memberships.models import Membership


class InvoiceService:
    """Invoice generation and management service"""
    
    @staticmethod
    def generate_invoice_number():
        """Generate unique invoice number"""
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        return f"INV-{timestamp}"
    
    @staticmethod
    def create_invoice(membership_id, amount, description, due_days=7):
        """Create an invoice for a membership"""
        try:
            membership = Membership.objects.get(id=membership_id)
            
            invoice = Invoice.objects.create(
                invoice_number=InvoiceService.generate_invoice_number(),
                membership=membership,
                amount=amount,
                description=description,
                due_date=timezone.now().date() + timedelta(days=due_days)
            )
            
            return invoice, None
            
        except Membership.DoesNotExist:
            return None, "Membership not found"
        except Exception as e:
            return None, str(e)
    
    @staticmethod
    def create_membership_renewal_invoice(membership_id):
        """Create renewal invoice for a membership"""
        try:
            membership = Membership.objects.get(id=membership_id)
            
            # Calculate renewal amount based on plan
            if membership.plan.monthly_fee > 0:
                amount = membership.plan.monthly_fee
                description = f"Monthly renewal for {membership.plan.plan_name}"
            else:
                amount = membership.plan.weekly_fee * 4
                description = f"Monthly renewal for {membership.plan.plan_name}"
            
            invoice, error = InvoiceService.create_invoice(
                membership_id, amount, description, due_days=7
            )
            
            return invoice, error
            
        except Membership.DoesNotExist:
            return None, "Membership not found"
        except Exception as e:
            return None, str(e)
    
    @staticmethod
    def get_overdue_invoices():
        """Get all overdue invoices"""
        current_date = timezone.now().date()
        return Invoice.objects.filter(
            due_date__lt=current_date,
            status__in=['sent', 'draft']
        )
    
    @staticmethod
    def get_upcoming_invoices(days_ahead=7):
        """Get invoices due within specified days"""
        future_date = timezone.now().date() + timedelta(days=days_ahead)
        return Invoice.objects.filter(
            due_date__lte=future_date,
            status='sent'
        )
    
    @staticmethod
    def mark_invoice_sent(invoice_id):
        """Mark invoice as sent"""
        try:
            invoice = Invoice.objects.get(id=invoice_id)
            invoice.status = 'sent'
            invoice.save()
            return True, "Invoice marked as sent"
        except Invoice.DoesNotExist:
            return False, "Invoice not found"
    
    @staticmethod
    def mark_invoice_paid(invoice_id):
        """Mark invoice as paid"""
        try:
            invoice = Invoice.objects.get(id=invoice_id)
            invoice.mark_paid()
            return True, "Invoice marked as paid"
        except Invoice.DoesNotExist:
            return False, "Invoice not found"
    
    @staticmethod
    def send_payment_reminder(membership_id, reminder_type, reminder_method, subject, message):
        """Send payment reminder"""
        try:
            membership = Membership.objects.get(id=membership_id)
            
            reminder = PaymentReminder.objects.create(
                membership=membership,
                reminder_type=reminder_type,
                reminder_method=reminder_method,
                subject=subject,
                message=message
            )
            
            # TODO: Implement actual sending logic (email, SMS, push notification)
            # For now, just mark as delivered
            reminder.is_delivered = True
            reminder.delivered_at = timezone.now()
            reminder.save()
            
            return True, "Reminder sent successfully"
            
        except Membership.DoesNotExist:
            return False, "Membership not found"
        except Exception as e:
            return False, str(e)
    
    @staticmethod
    def generate_payment_reminders():
        """Generate automatic payment reminders for memberships"""
        from django.conf import settings
        
        payment_settings = getattr(settings, 'PAYMENT_SETTINGS', {})
        reminder_days = payment_settings.get('AUTO_REMINDER_DAYS', [7, 3, 1])
        
        results = []
        
        for days in reminder_days:
            # Get memberships expiring in X days
            target_date = timezone.now().date() + timedelta(days=days)
            
            memberships = Membership.objects.filter(
                end_date=target_date,
                status='active',
                payment_status__in=['pending', 'overdue']
            )
            
            for membership in memberships:
                # Check if reminder already sent
                existing_reminder = PaymentReminder.objects.filter(
                    membership=membership,
                    reminder_type='membership_expiry',
                    sent_at__date=timezone.now().date()
                ).exists()
                
                if not existing_reminder:
                    subject = f"Membership Renewal Reminder - {days} days left"
                    message = f"""
Dear {membership.member.first_name},

Your membership for {membership.plan.plan_name} is expiring in {days} days.

Membership Details:
- Plan: {membership.plan.plan_name}
- Expiry Date: {membership.end_date}
- Sessions Remaining: {membership.sessions_remaining}

Please renew your membership to continue enjoying our services.

Best regards,
Paul's Tropical Fitness
                    """.strip()
                    
                    success, result = InvoiceService.send_payment_reminder(
                        membership.id,
                        'membership_expiry',
                        'email',
                        subject,
                        message
                    )
                    
                    results.append({
                        'membership_id': membership.id,
                        'days': days,
                        'success': success,
                        'message': result
                    })
        
        return results