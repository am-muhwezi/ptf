from django.db import models
from members.models import Member


class Attendance(models.Model):
    member_id = models.ForeignKey(Member, on_delete=models.CASCADE)
    Total_Attendance_today = models.IntegerField(default=0)
    Indoor_Attendance_today = models.IntegerField(default=0)
    Outdoor_Attendance_today = models.IntegerField(default=0)
    Currently_active = models.BooleanField(default=False)
