from django.db import models
from django.utils import timezone


class Location(models.Model):
    """Simple outdoor location reference for member differentiation"""
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=20, unique=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.code})"


class Member(models.Model):
    """Normalized member model - personal information only"""
    
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
    
    # Personal information only
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True, blank=True, null=True)
    phone = models.CharField(max_length=15, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    id_passport = models.CharField(max_length=50, unique=True, blank=True, null=True)
    blood_group = models.CharField(max_length=3, choices=BLOOD_GROUPS, default='nil')
    emergency_contact = models.CharField(max_length=100, blank=True, null=True)
    emergency_phone = models.CharField(max_length=15, blank=True, null=True)
    medical_conditions = models.TextField(blank=True, null=True)
    
    # Status and tracking
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')
    registration_date = models.DateTimeField(auto_now_add=True)
    total_visits = models.PositiveIntegerField(default=0)
    last_visit = models.DateTimeField(blank=True, null=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    
    class Meta:
        ordering = ['-registration_date']
    
    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    def update_visit_count(self):
        """Update total visits when member checks in"""
        self.total_visits += 1
        self.last_visit = timezone.now()
        self.save()
    
    @property 
    def membership_type(self):
        """Get the member's current membership type"""
        active_membership = self.memberships.filter(status='active').first()
        return active_membership.plan.membership_type if active_membership else 'unknown'
    
    @property
    def active_membership(self):
        """Get the member's active membership"""
        return self.memberships.filter(status='active').first()


class PhysicalProfile(models.Model):
    """Physical profile for indoor members only"""
    
    FITNESS_LEVELS = [
        ("beginner", "Beginner"),
        ("intermediate", "Intermediate"),
        ("advanced", "Advanced"),
        ("athlete", "Athlete"),
    ]
    
    member = models.OneToOneField(
        Member, 
        on_delete=models.CASCADE, 
        related_name='physical_profile'
    )
    
    # Physical measurements
    height = models.FloatField(blank=True, null=True, help_text="Height in cm")
    weight = models.FloatField(blank=True, null=True, help_text="Weight in kg")
    body_fat_percentage = models.FloatField(blank=True, null=True)
    fitness_level = models.CharField(
        max_length=12, 
        choices=FITNESS_LEVELS, 
        blank=True, 
        null=True
    )
    
    # Test results
    strength_test_results = models.TextField(blank=True, null=True)
    cardio_test_results = models.TextField(blank=True, null=True)
    flexibility_test_results = models.TextField(blank=True, null=True)
    
    # Goals
    short_term_goals = models.TextField(blank=True, null=True)
    long_term_goals = models.TextField(blank=True, null=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Physical Profile"
        verbose_name_plural = "Physical Profiles"
    
    def __str__(self):
        return f"Profile: {self.member.first_name} {self.member.last_name}"

    @property
    def bmi(self):
        """Calculate BMI if height and weight are available"""
        if self.height and self.weight:
            height_m = self.height / 100
            return round(self.weight / (height_m * height_m), 1)
        return None