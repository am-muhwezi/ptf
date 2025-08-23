from django.db import models
from django.utils import timezone
from decimal import Decimal
import uuid


class PaymentMethod(models.Model):
    """Different payment methods available"""
    PAYMENT_TYPES = [
        ('mpesa', 'M-Pesa'),
        ('card', 'Credit/Debit Card'),
        ('bank_transfer', 'Bank Transfer'),
        ('cash', 'Cash'),
    ]
    
    name = models.CharField(max_length=50)
    payment_type = models.CharField(max_length=20, choices=PAYMENT_TYPES)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.name} ({self.get_payment_type_display()})"


class Payment(models.Model):
    """Individual payment transactions"""
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
        ('refunded', 'Refunded'),
    ]
    
    PAYMENT_PURPOSE_CHOICES = [
        ('membership_fee', 'Membership Fee'),
        ('renewal_fee', 'Renewal Fee'),
        ('session_fee', 'Session Fee'),
        ('late_fee', 'Late Fee'),
        ('other', 'Other'),
    ]
    
    # Basic payment info
    payment_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    membership = models.ForeignKey(
        'memberships.Membership', 
        on_delete=models.CASCADE, 
        related_name='payments'
    )
    payment_method = models.ForeignKey(PaymentMethod, on_delete=models.SET_NULL, null=True)
    
    # Amount and purpose
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='KES')
    purpose = models.CharField(max_length=20, choices=PAYMENT_PURPOSE_CHOICES, default='membership_fee')
    
    # Status and tracking
    status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    external_reference = models.CharField(max_length=200, blank=True, null=True, help_text="Payment gateway reference")
    
    # Timestamps
    initiated_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    failed_at = models.DateTimeField(blank=True, null=True)
    
    # Additional info
    notes = models.TextField(blank=True, null=True)
    failure_reason = models.TextField(blank=True, null=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Payment {self.payment_id} - {self.amount} {self.currency} ({self.status})"
    
    def mark_completed(self):
        """Mark payment as completed"""
        self.status = 'completed'
        self.completed_at = timezone.now()
        self.save()
    
    def mark_failed(self, reason=None):
        """Mark payment as failed"""
        self.status = 'failed'
        self.failed_at = timezone.now()
        if reason:
            self.failure_reason = reason
        self.save()


class Invoice(models.Model):
    """Payment invoices for members"""
    INVOICE_STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('sent', 'Sent'),
        ('paid', 'Paid'),
        ('overdue', 'Overdue'),
        ('cancelled', 'Cancelled'),
    ]
    
    # Basic info
    invoice_number = models.CharField(max_length=50, unique=True)
    membership = models.ForeignKey(
        'memberships.Membership', 
        on_delete=models.CASCADE, 
        related_name='invoices'
    )
    
    # Amount and dates
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='KES')
    
    issue_date = models.DateField(auto_now_add=True)
    due_date = models.DateField()
    paid_date = models.DateField(blank=True, null=True)
    
    # Status
    status = models.CharField(max_length=20, choices=INVOICE_STATUS_CHOICES, default='draft')
    
    # Description
    description = models.TextField()
    notes = models.TextField(blank=True, null=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Invoice {self.invoice_number} - {self.amount} {self.currency}"
    
    @property
    def is_overdue(self):
        """Check if invoice is overdue"""
        return self.due_date < timezone.now().date() and self.status != 'paid'
    
    def mark_paid(self):
        """Mark invoice as paid"""
        self.status = 'paid'
        self.paid_date = timezone.now().date()
        self.save()


class PaymentReminder(models.Model):
    """Track payment reminders sent to members"""
    REMINDER_TYPES = [
        ('upcoming_payment', 'Upcoming Payment'),
        ('overdue_payment', 'Overdue Payment'),
        ('membership_expiry', 'Membership Expiry'),
    ]
    
    REMINDER_METHODS = [
        ('email', 'Email'),
        ('sms', 'SMS'),
        ('push_notification', 'Push Notification'),
    ]
    
    membership = models.ForeignKey(
        'memberships.Membership', 
        on_delete=models.CASCADE, 
        related_name='payment_reminders'
    )
    reminder_type = models.CharField(max_length=30, choices=REMINDER_TYPES)
    reminder_method = models.CharField(max_length=20, choices=REMINDER_METHODS)
    
    # Content
    subject = models.CharField(max_length=200)
    message = models.TextField()
    
    # Status
    sent_at = models.DateTimeField(auto_now_add=True)
    is_delivered = models.BooleanField(default=False)
    delivered_at = models.DateTimeField(blank=True, null=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Reminder: {self.reminder_type} for {self.membership.member.first_name}"


class MpesaTransaction(models.Model):
    """M-Pesa specific transaction details"""
    payment = models.OneToOneField(Payment, on_delete=models.CASCADE, related_name='mpesa_details')
    
    # M-Pesa specific fields
    checkout_request_id = models.CharField(max_length=200)
    merchant_request_id = models.CharField(max_length=200)
    phone_number = models.CharField(max_length=15)
    account_reference = models.CharField(max_length=50)
    transaction_desc = models.CharField(max_length=100)
    
    # Callback data
    mpesa_receipt_number = models.CharField(max_length=50, blank=True, null=True)
    transaction_date = models.DateTimeField(blank=True, null=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"M-Pesa Transaction {self.checkout_request_id}"


class CardTransaction(models.Model):
    """Card payment specific transaction details"""
    payment = models.OneToOneField(Payment, on_delete=models.CASCADE, related_name='card_details')
    
    # Card specific fields
    transaction_reference = models.CharField(max_length=200)
    card_last_four = models.CharField(max_length=4, blank=True, null=True)
    card_type = models.CharField(max_length=50, blank=True, null=True)
    authorization_code = models.CharField(max_length=200, blank=True, null=True)
    
    # Gateway response
    gateway_response = models.JSONField(blank=True, null=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Card Transaction {self.transaction_reference}"
