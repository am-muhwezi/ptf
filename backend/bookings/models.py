from django.db import models
from members.models import Member


class Booking(models.Model):
    SESSION_CHOICES = [
        ("Group Class", "Group Class"),
        ("One-on-One", "One-On-One"),
    ]
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("confirmed", "Confirmed"),
        ("cancelled", "Cancelled"),
    ]

    member = models.ForeignKey(
        Member, on_delete=models.CASCADE, related_name="bookings"
    )
    booking_date = models.DateTimeField()
    booking_time = models.DateTimeField()
    end_time = models.DateTimeField()

    session_type = models.CharField(
        max_length=20, choices=SESSION_CHOICES, default="Group Class"
    )

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.member} - {self.booking_date} {self.booking_time}"

    class Meta:
        ordering = ["-booking_date", "-booking_time"]

    def validate(self, data):
        pass
