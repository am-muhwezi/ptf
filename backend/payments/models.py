import uuid
from django.db import models
from memberships.models import Membership


class PaymentMethod(models.Model):
    """Payment method configuration - focusing on cash payments"""
    
    PAYMENT_TYPES = [
        ('cash', 'Cash'),
    ]
    
    name = models.CharField(max_length=50)
    payment_type = models.CharField(max_length=20, choices=PAYMENT_TYPES)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name


class Payment(models.Model):
    """Payment record for memberships - cash focused"""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    PURPOSE_CHOICES = [
        ('membership_fee', 'Membership Fee'),
    ]
    
    payment_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    membership = models.ForeignKey(
        Membership, 
        on_delete=models.CASCADE, 
        related_name='payments'
    )
    payment_method = models.ForeignKey(
        PaymentMethod, 
        on_delete=models.SET_NULL, 
        null=True
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='KES')
    purpose = models.CharField(max_length=20, choices=PURPOSE_CHOICES, default='membership_fee')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Timestamps
    initiated_at = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Payment {self.payment_id} - {self.status}"