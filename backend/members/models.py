from django.db import models
from datetime import timedelta
from django.utils import timezone


class Member(models.Model):
    MEMBERSHIP_TYPES = [
        ("indoor", "Indoor"),
        ("outdoor", "Outdoor"),
        ("both", "Both"),
    ]

    PLAN_TYPES = [
        ("Monthly", "Monthly"),
        ("Quarterly", "Quarterly"),
        ("Bi-Annual", "Bi-Annual"),
        ("Yearly", "Yearly"),
    ]

    BLOOD_GROUPS = [
        ("A+", "A+"),
        ("A-", "A-"),
        ("B+", "B+"),
        ("B-", "B-"),
        ("AB+", "AB+"),
        ("AB-", "AB-"),
        ("O+", "O+"),
        ("O-", "O-"),
        ("nil", "Not Specified"),
    ]

    STATUS_CHOICES = [
        ("active", "Active"),
        ("inactive", "Inactive"),
        ("suspended", "Suspended"),
    ]

    PAYMENT_STATUS_CHOICES = [
        ("paid", "Paid"),
        ("pending", "Pending"),
        ("overdue", "Overdue"),
    ]

    FITNESS_LEVELS = [
        ("beginner", "Beginner"),
        ("intermediate", "Intermediate"),
        ("advanced", "Advanced"),
        ("athlete", "Athlete"),
    ]

    # Basic Information
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True, blank=True)
    phone = models.CharField(max_length=15, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    dateOfBirth = models.DateField(blank=True, null=True)

    # Membership Information
    membership_type = models.CharField(
        max_length=10, choices=MEMBERSHIP_TYPES, default="indoor"
    )
    plan_type = models.CharField(max_length=10, choices=PLAN_TYPES, default="basic")
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="active")
    payment_status = models.CharField(
        max_length=10, choices=PAYMENT_STATUS_CHOICES, default="pending"
    )

    # Health Information
    bloodGroup = models.CharField(max_length=3, choices=BLOOD_GROUPS, default="nil")
    idPassport = models.CharField(max_length=50, unique=True, blank=True, null=True)
    emergencyContact = models.CharField(max_length=100, blank=True, null=True)
    emergencyPhone = models.CharField(max_length=15, blank=True, null=True)
    medicalConditions = models.TextField(max_length=500, blank=True, null=True)

    # Physical Measurements
    height = models.FloatField(blank=True, null=True, help_text="Height in cm")
    weight = models.FloatField(blank=True, null=True, help_text="Weight in kg")
    body_fat_percentage = models.FloatField(blank=True, null=True)

    # Fitness Information
    fitness_level = models.CharField(
        max_length=12, choices=FITNESS_LEVELS, blank=True, null=True
    )
    strength_test_results = models.TextField(blank=True, null=True)
    cardio_test_results = models.TextField(blank=True, null=True)
    flexibility_test_results = models.TextField(blank=True, null=True)
    short_term_goals = models.TextField(blank=True, null=True)
    long_term_goals = models.TextField(blank=True, null=True)

    # Membership Dates and Activity
    registrationDate = models.DateTimeField(auto_now_add=True)
    membership_start_date = models.DateField(blank=True, null=True)
    membership_end_date = models.DateField(blank=True, null=True)
    last_visit = models.DateTimeField(blank=True, null=True)

    # Activity Tracking
    is_checked_in = models.BooleanField(default=False)
    total_visits = models.PositiveIntegerField(default=0)

    # Payment Information
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    last_payment = models.DateTimeField(blank=True, null=True)

    def __str__(self) -> str:
        return f"{self.first_name} {self.last_name} ({self.email})"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def member_id(self):
        return f"PTF{str(self.id).zfill(6)}"

    @property
    def bmi(self):
        if self.height and self.weight:
            height_m = self.height / 100
            return round(self.weight / (height_m * height_m), 1)
        return None

    @property
    def days_until_expiry(self):
        if self.membership_end_date:
            today = timezone.now().date()
            return (self.membership_end_date - today).days
        return None

    @property
    def is_expiring_soon(self):
        days = self.days_until_expiry
        return days is not None and 0 < days <= 30

    def update_visit_count(self):
        """Update total visits when member checks in"""
        self.total_visits += 1
        self.last_visit = timezone.now()
        self.save()

    class Meta:
        ordering = ["-registrationDate"]
