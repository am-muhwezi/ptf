from django.db import models
from memberships.models import MembershipPlan


class Member(models.Model):

    MEMBERSHIP_TYPES = [
        ("indoor", "Indoor"),
        ("outdoor", "Outdoor"),
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
    id = models.AutoField(primary_key=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=15, blank=True, null=True)
    membership_type = models.CharField(
        max_length=10, choices=MEMBERSHIP_TYPES, default="indoor"
    )
    address = models.TextField(blank=True, null=True)
    bloodGroup = models.CharField(max_length=3, choices=BLOOD_GROUPS, default="nil")
    dateOfBirth = models.DateTimeField(auto_now_add=True)
    idPassport = models.CharField(max_length=50, unique=True, blank=True, null=True)
    medicalConditions = models.TextField(max_length=500)
    active = models.BooleanField(default=True)
    emergencyPhone = models.CharField(max_length=15, blank=True, null=True)
    emergencyContact = models.CharField(max_length=100, blank=True, null=True)
    registrationDate = models.DateTimeField(auto_now_add=True)
    membership_plan = models.ForeignKey(
        MembershipPlan, on_delete=models.SET_NULL, null=True, blank=True
    )

    checked_in = models.BooleanField(default=False)
    total_visits = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.membership_type})"
