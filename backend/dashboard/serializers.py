
from rest_framework import serializers
from .models import (
    Member, Booking, Trainer, Waitlist, Attendance,
    Feedback, InventoryItem, Notification
)

class MemberSerializer(serializers.ModelSerializer):
    is_renewal_due = serializers.ReadOnlyField()
    is_payment_overdue = serializers.ReadOnlyField()
    
    class Meta:
        model = Member
        fields = '__all__'

class BookingSerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(source='member.first_name', read_only=True)
    
    class Meta:
        model = Booking
        fields = '__all__'

class TrainerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Trainer
        fields = '__all__'

class WaitlistSerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(source='member.first_name', read_only=True)
    
    class Meta:
        model = Waitlist
        fields = '__all__'

class AttendanceSerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(source='member.first_name', read_only=True)
    
    class Meta:
        model = Attendance
        fields = '__all__'

class FeedbackSerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(source='member.first_name', read_only=True)
    resolution_time = serializers.ReadOnlyField()
    
    class Meta:
        model = Feedback
        fields = '__all__'

class InventoryItemSerializer(serializers.ModelSerializer):
    is_low_stock = serializers.ReadOnlyField()
    
    class Meta:
        model = InventoryItem
        fields = '__all__'

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'
