from django.db import models


class MembershipPlan(models.Model):
    """
    Model representing a membership type.
    """

    MEMBERSHIP_TYPES = [
        ("indoor", "Indoor"),
        ("outdoor", "Outdoor"),
    ]

    PLAN_TYPES = [
        ("Monthly", "Monthly"),
        ("Quarterly", "Quarterly"),
        ("Bi-Annual", "Bi-Annual"),
        ("Annual", "Annual"),
    ]

    Category_Choices = [
        ("Single", "Single"),
        ("Couple", "Couple"),
        ("Corporate", "Corporate"),
    ]

    plan_name = models.CharField(max_length=50, unique=True)
    membersip_type = models.CharField(
        max_length=10, choices=MEMBERSHIP_TYPES, default="indoor"
    )
    duration = models.CharField(max_length=20, choices=PLAN_TYPES)
    category = models.CharField(max_length=20, choices=Category_Choices)

    fee = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.plan_name} ({self.membersip_type}) - {self.duration}"
