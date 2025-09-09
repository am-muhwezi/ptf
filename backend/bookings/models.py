from django.db import models
from django.conf import settings
from members.models import Member


class Booking(models.Model):
    BOOKING_TYPE_CHOICES = [
        ("indoor", "Indoor"),
        ("outdoor", "Outdoor"),
    ]
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("confirmed", "Confirmed"),
        ("cancelled", "Cancelled"),
        ("completed", "Completed"),
        ("no_show", "No Show"),
    ]

    member = models.ForeignKey(
        Member, on_delete=models.CASCADE, related_name="bookings"
    )
    booking_date = models.DateField()
    start_time = models.TimeField(default="09:00:00")
    end_time = models.TimeField(default="10:00:00")

    booking_type = models.CharField(
        max_length=10, choices=BOOKING_TYPE_CHOICES, default="indoor"
    )
    
    # Additional fields from the database
    cancellation_reason = models.TextField(blank=True)
    cancelled_at = models.DateTimeField(blank=True, null=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        blank=True, null=True,
        related_name="created_bookings"
    )
    is_paid = models.BooleanField(default=False)
    notes = models.TextField(blank=True, help_text="Any special requests or notes")
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    service = models.ForeignKey(
        'BookingService', 
        on_delete=models.CASCADE, 
        related_name="bookings",
        blank=True, null=True
    )

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.member} - {self.booking_date} {self.start_time}"

    class Meta:
        ordering = ["-booking_date", "-start_time"]

    def validate(self, data):
        pass


class BookingService(models.Model):
    CATEGORY_CHOICES = [
        ("fitness", "Fitness Training"),
        ("group_class", "Group Classes"),
        ("personal_training", "Personal Training"),
        ("consultation", "Consultation"),
        ("other", "Other"),
    ]
    
    name = models.CharField(max_length=100)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    description = models.TextField(blank=True)
    duration_minutes = models.PositiveIntegerField(default=60)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)
    max_participants = models.PositiveIntegerField(
        default=1,
        help_text="Max participants per session (1 for personal training)"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name
    
    class Meta:
        ordering = ["category", "name"]


class BookingTimeSlot(models.Model):
    DAY_CHOICES = [
        ("monday", "Monday"),
        ("tuesday", "Tuesday"),
        ("wednesday", "Wednesday"),
        ("thursday", "Thursday"),
        ("friday", "Friday"),
        ("saturday", "Saturday"),
        ("sunday", "Sunday"),
    ]
    
    service = models.ForeignKey(
        BookingService, 
        on_delete=models.CASCADE, 
        related_name="time_slots"
    )
    day_of_week = models.CharField(max_length=10, choices=DAY_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_available = models.BooleanField(default=True)
    max_bookings = models.PositiveIntegerField(
        default=1, 
        help_text="Max simultaneous bookings for this slot"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.service.name} - {self.day_of_week} {self.start_time}-{self.end_time}"
    
    class Meta:
        ordering = ["day_of_week", "start_time"]
        unique_together = [["service", "day_of_week", "start_time"]]
