from django.db import models
from django.utils import timezone
from decimal import Decimal


class MembershipPlan(models.Model):
    """
    Model representing a membership plan with session-based pricing.
    """

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

    CATEGORY_CHOICES = [
        ("single", "Single"),
        ("couple", "Couple"),
        ("corporate", "Corporate"),
    ]

    plan_name = models.CharField(max_length=100, unique=True)
    membership_type = models.CharField(
        max_length=10, choices=MEMBERSHIP_TYPES, default="indoor"
    )
    plan_type = models.CharField(max_length=20, choices=PLAN_TYPES, default="monthly")
    category = models.CharField(
        max_length=20, choices=CATEGORY_CHOICES, default="single"
    )

    # Session-based pricing
    sessions_per_week = models.PositiveIntegerField(
        default=1, help_text="Number of sessions per week"
    )
    weekly_fee = models.DecimalField(
        default=Decimal("0.00"),
        max_digits=10,
        decimal_places=2,
        help_text="Weekly fee in KES",
    )
    monthly_fee = models.DecimalField(
        default=Decimal("0.00"),
        max_digits=10,
        decimal_places=2,
        help_text="Monthly fee in KES",
    )

    # For drop-in sessions
    per_session_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal("1000.00"),
        help_text="Per session fee in KES",
    )

    # Additional details
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["membership_type", "sessions_per_week"]

    def __str__(self):
        return f"{self.plan_name} ({self.membership_type}) - {self.sessions_per_week} sessions/week"

    @property
    def sessions_per_month(self):
        """Calculate total sessions per month (4 weeks)"""
        return self.sessions_per_week * 4

    @classmethod
    def get_outdoor_rate_cards(cls):
        """Get predefined outdoor rate cards"""
        return [
            {
                "plan_name": "1 Session/Week",
                "sessions_per_week": 1,
                "weekly_fee": Decimal("3000.00"),
                "monthly_fee": Decimal("3000.00"),
                "sessions_per_month": 4,
                "description": "1 session per week, perfect for beginners",
            },
            {
                "plan_name": "2 Sessions/Week",
                "sessions_per_week": 2,
                "weekly_fee": Decimal("4000.00"),
                "monthly_fee": Decimal("4000.00"),
                "sessions_per_month": 8,
                "description": "2 sessions per week, ideal for regular fitness",
            },
            {
                "plan_name": "3 Sessions/Week",
                "sessions_per_week": 3,
                "weekly_fee": Decimal("5000.00"),
                "monthly_fee": Decimal("5000.00"),
                "sessions_per_month": 12,
                "description": "3 sessions per week, great for building strength",
            },
            {
                "plan_name": "4 Sessions/Week",
                "sessions_per_week": 4,
                "weekly_fee": Decimal("6000.00"),
                "monthly_fee": Decimal("6000.00"),
                "sessions_per_month": 16,
                "description": "4 sessions per week, for serious fitness goals",
            },
            {
                "plan_name": "5 Sessions/Week",
                "sessions_per_week": 5,
                "weekly_fee": Decimal("7000.00"),
                "monthly_fee": Decimal("7000.00"),
                "sessions_per_month": 20,
                "description": "5 sessions per week, for fitness enthusiasts",
            },
        ]


class Membership(models.Model):
    """
    Model representing an active membership for a member.
    """

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

    member = models.ForeignKey(
        "members.Member", on_delete=models.CASCADE, related_name="memberships"
    )
    plan = models.ForeignKey(
        MembershipPlan, on_delete=models.CASCADE, related_name="memberships"
    )

    # Membership details
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")
    payment_status = models.CharField(
        max_length=20, choices=PAYMENT_STATUS_CHOICES, default="pending"
    )

    # Session tracking
    total_sessions_allowed = models.PositiveIntegerField(
        help_text="Total sessions allowed for this membership period"
    )
    sessions_used = models.PositiveIntegerField(
        default=0, help_text="Number of sessions used"
    )
    sessions_remaining = models.PositiveIntegerField(help_text="Sessions remaining")

    # Dates
    start_date = models.DateField()
    end_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Payment info
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2)
    next_billing_date = models.DateField(blank=True, null=True)

    # Location for outdoor memberships
    location = models.CharField(
        max_length=100, blank=True, help_text="Outdoor location preference"
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.member.full_name} - {self.plan.plan_name}"

    def save(self, *args, **kwargs):
        # Calculate sessions_remaining
        self.sessions_remaining = self.total_sessions_allowed - self.sessions_used

        # Auto-expire if no sessions left
        if self.sessions_remaining <= 0 and self.status == "active":
            self.status = "expired"

        super().save(*args, **kwargs)

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
        """Use one session and update remaining count"""
        if self.sessions_remaining > 0:
            self.sessions_used += 1
            self.save()
            return True
        return False


class SessionLog(models.Model):
    """
    Model to track individual session usage.
    """

    membership = models.ForeignKey(
        Membership, on_delete=models.CASCADE, related_name="session_logs"
    )
    date_used = models.DateTimeField(auto_now_add=True)
    location = models.CharField(
        max_length=100, blank=True, help_text="Where the session took place"
    )
    notes = models.TextField(
        blank=True, help_text="Any additional notes about the session"
    )

    class Meta:
        ordering = ["-date_used"]

    def __str__(self):
        return f"{self.membership.member.full_name} - {self.date_used.strftime('%Y-%m-%d %H:%M')}"
