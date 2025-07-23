from rest_framework import serializers
from .models import Booking
from members.serializers import MemberSerializer


class BookingSerializer(serializers.ModelSerializer):
    member = MemberSerializer(read_only=True)
    member_id = serializers.IntegerField(write_only=True)
    class Meta:
        model = Booking
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, data):
        """
        Custom validation logic for Booking.
        """
        # Example validation: Ensure booking time is before end time
        if data["booking_time"] >= data["end_time"]:
            raise serializers.ValidationError("Booking time can't be same as end time.")
        return data
