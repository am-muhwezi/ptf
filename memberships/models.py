from django.db import models
from django.conf import settings
from django.utils import timezone
import uuid

class Member(models.Model):
    MEMBERSHIP_TYPES = (
        ('indoor', 'Indoor'),
        ('outdoor', 'Outdoor'),
        ('both', 'Indoor + Outdoor'),
    )
    
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('expired', 'Expired'),
        ('suspended', 'Suspended'),
    )
    
    PAYMENT_STATUS_CHOICES = (
        ('paid', 'Paid'),
        ('pending', 'Pending'),
        ('overdue', 'Overdue'),
    )

    id = models.CharField(max_length=20, primary_key=True, unique=True)
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20)
    id_passport = models.CharField(max_length=50)
    blood_group = models.CharField(max_length=5, blank=True)
    membership_type = models.CharField(max_length=10, choices=MEMBERSHIP_TYPES)
    emergency_contact = models.CharField(max_length=100)
    emergency_phone = models.CharField(max_length=20)
    medical_conditions = models.TextField(blank=True)
    date_of_birth = models.DateField()
    address = models.TextField(blank=True)
    registration_date = models.DateTimeField(default=timezone.now)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.id})"

class Membership(models.Model):
    PLAN_TYPES = (
        ('Monthly Basic', 'Monthly Basic'),
        ('Monthly Premium', 'Monthly Premium'),
        ('Quarterly Basic', 'Quarterly Basic'),
        ('Quarterly Premium', 'Quarterly Premium'),
        ('Annual Basic', 'Annual Basic'),
        ('Annual Premium', 'Annual Premium'),
    )

    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='memberships')
    plan_type = models.CharField(max_length=20, choices=PLAN_TYPES)
    start_date = models.DateField(default=timezone.now)
    expiry_date = models.DateField()
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_status = models.CharField(max_length=10, choices=Member.PAYMENT_STATUS_CHOICES, default='pending')
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.member.first_name} {self.member.last_name} - {self.plan_type}"

class Attendance(models.Model):
    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='attendance_records')
    check_in_time = models.DateTimeField(default=timezone.now)
    check_out_time = models.DateTimeField(null=True, blank=True)
    date = models.DateField(default=timezone.now)
    membership_type = models.CharField(max_length=10, choices=Member.MEMBERSHIP_TYPES)
    
    class Meta:
        ordering = ['-check_in_time']
    
    def __str__(self):
        return f"{self.member.first_name} {self.member.last_name} - {self.date}"