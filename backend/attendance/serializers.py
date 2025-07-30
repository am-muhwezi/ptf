from rest_framework import serializers
from .models import AttendanceLog, Attendance
from members.serializers import MemberSearchSerializer


class AttendanceLogSerializer(serializers.ModelSerializer):
    member = MemberSearchSerializer(read_only=True)
    member_id = serializers.IntegerField(write_only=True)
    formatted_duration = serializers.ReadOnlyField()
    is_active = serializers.ReadOnlyField()

    class Meta:
        model = AttendanceLog
        fields = [
            "id",
            "member",
            "member_id",
            "visit_type",
            "check_in_time",
            "check_out_time",
            "duration_minutes",
            "formatted_duration",
            "status",
            "activities",
            "trainer",
            "notes",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "duration_minutes",
            "status",
            "created_at",
            "updated_at",
        ]


class AttendanceSerializer(serializers.ModelSerializer):
    member = MemberSearchSerializer(read_only=True)

    class Meta:
        model = Attendance
        fields = [
            "id",
            "member",
            "date",
            "total_visits_today",
            "indoor_visits_today",
            "outdoor_visits_today",
            "currently_active",
            "last_activity_time",
        ]
