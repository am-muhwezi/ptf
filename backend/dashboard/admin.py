from django.contrib import admin
from .models import (
    Member, Booking, Trainer, Waitlist, Attendance, 
    Feedback, InventoryItem, Notification
)

@admin.register(Member)
class MemberAdmin(admin.ModelAdmin):
    list_display = ['first_name', 'last_name', 'email', 'membership_type', 'is_active', 'membership_end_date']
    list_filter = ['membership_type', 'is_active', 'membership_start_date']
    search_fields = ['first_name', 'last_name', 'email']
    readonly_fields = ['created_at', 'updated_at']

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ['member', 'session_type', 'session_date', 'trainer_name', 'is_confirmed']
    list_filter = ['session_type', 'is_confirmed', 'session_date']
    search_fields = ['member__first_name', 'member__last_name', 'trainer_name']

@admin.register(Trainer)
class TrainerAdmin(admin.ModelAdmin):
    list_display = ['name', 'specialization', 'is_available']
    list_filter = ['is_available', 'specialization']
    search_fields = ['name', 'specialization']

@admin.register(Waitlist)
class WaitlistAdmin(admin.ModelAdmin):
    list_display = ['member', 'session_type', 'preferred_date', 'is_resolved']
    list_filter = ['session_type', 'is_resolved']
    search_fields = ['member__first_name', 'member__last_name']

@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ['member', 'visit_type', 'check_in_time', 'check_out_time']
    list_filter = ['visit_type', 'check_in_time']
    search_fields = ['member__first_name', 'member__last_name']

@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = ['member', 'subject', 'feedback_type', 'status', 'created_at']
    list_filter = ['feedback_type', 'status', 'created_at']
    search_fields = ['member__first_name', 'member__last_name', 'subject']
    readonly_fields = ['created_at']

@admin.register(InventoryItem)
class InventoryItemAdmin(admin.ModelAdmin):
    list_display = ['name', 'quantity', 'min_stock_level', 'price', 'is_low_stock']
    list_filter = ['quantity', 'created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at', 'updated_at']

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['title', 'notification_type', 'is_read', 'created_at']
    list_filter = ['notification_type', 'is_read', 'created_at']
    search_fields = ['title', 'message']
    readonly_fields = ['created_at']