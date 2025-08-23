from django.db import models
from django.utils import timezone
from decimal import Decimal


class MembershipPlan(models.Model):
    """Rate cards for membership plans"""
    
    MEMBERSHIP_TYPES = [
        ("indoor", "Indoor"),
        ("outdoor", "Outdoor"),
    ]

    PLAN_TYPES = [
        ("daily", "Daily Drop-in"),
        ("weekly", "Weekly"),
        ("monthly", "Monthly"),
        ("quarterly", "Quarterly"),
        ("annual", "Annual"),
        ("1_session_week", "1 Session/Week"),
        ("2_sessions_week", "2 Sessions/Week"),
        ("3_sessions_week", "3 Sessions/Week"),
        ("4_sessions_week", "4 Sessions/Week"),
        ("5_sessions_week", "5 Sessions/Week"),
    ]
    
    plan_name = models.CharField(max_length=100)
    plan_code = models.CharField(max_length=50, unique=True)
    membership_type = models.CharField(max_length=10, choices=MEMBERSHIP_TYPES)
    plan_type = models.CharField(max_length=20, choices=PLAN_TYPES)
    
    # Session configuration
    sessions_per_week = models.PositiveIntegerField(default=1)
    duration_weeks = models.PositiveIntegerField(default=4, help_text="Plan duration in weeks")
    
    # Pricing
    weekly_fee = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    monthly_fee = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    per_session_fee = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=Decimal("1000.00"),
        help_text="For drop-in sessions"
    )
    
    # Additional info
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['membership_type', 'sessions_per_week']
        constraints = [
            models.UniqueConstraint(
                fields=['plan_code', 'membership_type'], 
                name='unique_plan_per_type'
            )
        ]
    
    def __str__(self):
        return f"{self.plan_name} ({self.membership_type})"

    @property
    def sessions_per_month(self):
        """Calculate total sessions per month (4 weeks)"""
        return self.sessions_per_week * 4


class Membership(models.Model):
    """Normalized membership - business relationships only"""
    
    STATUS_CHOICES = [
        ("active", "Active"),
        ("suspended", "Suspended"),
        ("expired", "Expired"),
        ("cancelled", "Cancelled"),
    ]

    PAYMENT_STATUS_CHOICES = [
        ("paid", "Paid"),
        ("pending", "Pending"),
        ("overdue", "Overdue"),
        ("partial", "Partial"),
    ]
    
    # Relationships
    member = models.ForeignKey(
        'members.Member', 
        on_delete=models.CASCADE, 
        related_name='memberships'
    )
    plan = models.ForeignKey(
        MembershipPlan, 
        on_delete=models.CASCADE, 
        related_name='memberships'
    )
    location = models.ForeignKey(
        'members.Location', 
        on_delete=models.SET_NULL, 
        related_name='memberships',
        blank=True, 
        null=True,
        help_text="Required for outdoor memberships"
    )
    
    # Membership status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    # Session tracking
    total_sessions_allowed = models.PositiveIntegerField()
    sessions_used = models.PositiveIntegerField(default=0)
    
    # Dates
    start_date = models.DateField()
    end_date = models.DateField()
    
    # Payment
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2)
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    next_billing_date = models.DateField(blank=True, null=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.member.first_name} {self.member.last_name} - {self.plan.plan_name}"

    @property
    def sessions_remaining(self):
        """Calculate sessions remaining"""
        return self.total_sessions_allowed - self.sessions_used

    @property
    def is_expired(self):
        """Check if membership is expired"""
        return self.end_date < timezone.now().date() or self.sessions_remaining <= 0

    @property
    def is_expiring_soon(self):
        """Check if membership is expiring within 7 days or has <=3 sessions left"""
        days_until_expiry = (self.end_date - timezone.now().date()).days
        return days_until_expiry <= 7 or self.sessions_remaining <= 3

    @property
    def usage_percentage(self):
        """Calculate usage percentage"""
        if self.total_sessions_allowed == 0:
            return 0
        return (self.sessions_used / self.total_sessions_allowed) * 100

    def use_session(self):
        """Use one session and update remaining count - DEPRECATED: Use MembershipService.use_session()"""
        from .services import MembershipService
        success, message = MembershipService.use_session(self)
        return success


class SessionLog(models.Model):
    """Track individual session usage"""
    
    SESSION_TYPES = [
        ("regular", "Regular Session"),
        ("trial", "Trial Session"),
        ("makeup", "Make-up Session"),
        ("complimentary", "Complimentary Session"),
    ]
    
    membership = models.ForeignKey(
        Membership, 
        on_delete=models.CASCADE, 
        related_name='session_logs'
    )
    date_used = models.DateTimeField(auto_now_add=True)
    session_type = models.CharField(
        max_length=20, 
        choices=SESSION_TYPES, 
        default='regular'
    )
    notes = models.TextField(blank=True, null=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-date_used']
    
    def __str__(self):
        return f"{self.membership.member.first_name} {self.membership.member.last_name} - {self.date_used.strftime('%Y-%m-%d %H:%M')}"