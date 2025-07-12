from django.db import models


"""
class Member(models.Model):
    id int
    first_name str
    last_name str
    email 
    phone_number 
    address	""

    bloodGroup	"O+"
    dateOfBirth	"2002-01-01"
    email	"intricatesyllable@gmail.ckl"
    emergencyContact	"Muhwezi"
    emergencyPhone	"0111111111"
    first_name	"Thabos"
    idPassport	"aii12121"
    last_name	"Muhanguzi"
    medicalConditions	"Lovely"
    memberId	"PTF209969171"
    membershipType	"indoor"
    phone	"0115001965"
    registrationDate	"2025-07-09T12:13:29.969Z"
    status	"active"
"""


class Member(models.Model):

    MEMBERSHIP_TYPES = [
        ("indoor", "Indoor"),
        ("outdoor", "Outdoor"),
        ("both", "Both"),
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
    emergencyPhone = models.CharField(max_length=15, blank=True, null=True)
    medicalConditions = models.TextField(max_length=500)
    emergencyContact = models.CharField(max_length=100, blank=True, null=True)
    registrationDate = models.DateTimeField(auto_now_add=True)

    is_checked_in = models.BooleanField(default=False)
    total_visits = models.PositiveIntegerField(default=0)

    def __str__(self) -> str:
        return f"{self.first_name} {self.last_name} ({self.email})"

    def check_in(self):
        """Check in the member"""

        if not self.is_checked_in:
            self.is_checked_in = True
            self.total_visits += 1
            self.save
            return True
        return False
