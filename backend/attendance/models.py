from django.db import models
from django.utils import timezone
from members.models import Member


class AttendanceLog(models.Model):
    """
    Daily attendance log for better tracking and analytics
    """

    VISIT_TYPES = [
        ("indoor", "Indoor"),
        ("outdoor", "Outdoor"),
    ]

    STATUS_CHOICES = [
        ("checked_in", "Checked In"),
        ("checked_out", "Checked Out"),
        ("active", "Currently Active"),
    ]

    member = models.ForeignKey(
        Member, on_delete=models.CASCADE, related_name="attendance_logs"
    )
    visit_type = models.CharField(max_length=10, choices=VISIT_TYPES)
    check_in_time = models.DateTimeField(default=timezone.now)
    check_out_time = models.DateTimeField(null=True, blank=True)
    duration_minutes = models.IntegerField(null=True, blank=True)
    status = models.CharField(
        max_length=15, choices=STATUS_CHOICES, default="checked_in"
    )

    # Activity tracking
    activities = models.JSONField(
        default=list, blank=True
    )  # ['Weight Training', 'Cardio']
    trainer = models.CharField(max_length=100, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-check_in_time"]
        indexes = [
            models.Index(fields=["member", "check_in_time"]),
            models.Index(fields=["visit_type", "check_in_time"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self):
        return (
            f"{self.member} - {self.visit_type} - {self.check_in_time.date() if self.check_in_time else ''}"
        )

    def calculate_duration(self):
        """Calculate visit duration in minutes"""
        if self.check_out_time and self.check_in_time:
            delta = self.check_out_time - self.check_in_time
            return int(delta.total_seconds() / 60)
        return None

    def save(self, *args, **kwargs):
        # Auto-calculate duration on save
        if self.check_out_time and not self.duration_minutes:
            self.duration_minutes = self.calculate_duration()

        # Update status based on check_out_time
        if self.check_out_time:
            self.status = "checked_out"
        elif self.status == "checked_in":
            self.status = "active"

        super().save(*args, **kwargs)

    @property
    def is_active(self):
        return self.status in ["checked_in", "active"] and not self.check_out_time

    @property
    def formatted_duration(self):
        if self.duration_minutes:
            hours = self.duration_minutes // 60
            minutes = self.duration_minutes % 60
            if hours > 0:
                return f"{hours}h {minutes}m"
            return f"{minutes}m"
        return "Active" if self.is_active else "N/A"


class Attendance(models.Model):
    """
    Updated attendance model with better tracking
    """

    member = models.ForeignKey(
        Member, on_delete=models.CASCADE, related_name="daily_attendance"
    )
    date = models.DateField(default=timezone.now)

    # Daily counters
    total_visits_today = models.IntegerField(default=0)
    indoor_visits_today = models.IntegerField(default=0)
    outdoor_visits_today = models.IntegerField(default=0)

    # Status
    currently_active = models.BooleanField(default=False)
    last_activity_time = models.DateTimeField(null=True, blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ["member", "date"]
        ordering = ["-date"]

    def __str__(self):
        return f"{self.member.full_name} - {self.date}"

    @classmethod
    def get_or_create_today(cls, member):
        """Get or create today's attendance record"""
        today = timezone.now().date()
        attendance, created = cls.objects.get_or_create(
            member=member,
            date=today,
            defaults={
                "total_visits_today": 0,
                "indoor_visits_today": 0,
                "outdoor_visits_today": 0,
                "currently_active": False,
            },
        )
        return attendance

    def update_visit_count(self, visit_type):
        """Update visit counts for the day"""
        self.total_visits_today += 1
        if visit_type == "indoor":
            self.indoor_visits_today += 1
        elif visit_type == "outdoor":
            self.outdoor_visits_today += 1

        self.last_activity_time = timezone.now()
        self.save()

    def set_active_status(self, is_active):
        """Set current active status"""
        self.currently_active = is_active
        if is_active:
            self.last_activity_time = timezone.now()
        self.save()
