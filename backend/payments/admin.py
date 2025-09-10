from django.contrib import admin
from .models import (
    PaymentMethod, Payment, PaymentReminder,
    MpesaTransaction, CardTransaction
)


@admin.register(PaymentMethod)
class PaymentMethodAdmin(admin.ModelAdmin):
    list_display = ['name', 'payment_type', 'is_active', 'created_at']
    list_filter = ['payment_type', 'is_active']
    search_fields = ['name']


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = [
        'payment_id', 'membership', 'amount', 'currency', 
        'payment_method', 'status', 'purpose', 'initiated_at'
    ]
    list_filter = ['status', 'purpose', 'payment_method', 'currency']
    search_fields = ['payment_id', 'membership__member__first_name', 'membership__member__last_name']
    readonly_fields = ['payment_id', 'initiated_at', 'created_at', 'updated_at']
    
    def get_member_name(self, obj):
        return f"{obj.membership.member.first_name} {obj.membership.member.last_name}"
    get_member_name.short_description = 'Member'


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = [
        'invoice_number', 'membership', 'amount', 'currency',
        'status', 'issue_date', 'due_date', 'is_overdue'
    ]
    list_filter = ['status', 'currency', 'issue_date']
    search_fields = ['invoice_number', 'membership__member__first_name', 'membership__member__last_name']
    readonly_fields = ['invoice_number', 'issue_date', 'created_at', 'updated_at']
    
    def get_member_name(self, obj):
        return f"{obj.membership.member.first_name} {obj.membership.member.last_name}"
    get_member_name.short_description = 'Member'


@admin.register(PaymentReminder)
class PaymentReminderAdmin(admin.ModelAdmin):
    list_display = [
        'membership', 'reminder_type', 'reminder_method', 
        'subject', 'sent_at', 'is_delivered'
    ]
    list_filter = ['reminder_type', 'reminder_method', 'is_delivered']
    search_fields = ['membership__member__first_name', 'membership__member__last_name', 'subject']
    readonly_fields = ['sent_at', 'created_at']


@admin.register(MpesaTransaction)
class MpesaTransactionAdmin(admin.ModelAdmin):
    list_display = [
        'payment', 'checkout_request_id', 'phone_number', 
        'mpesa_receipt_number', 'transaction_date'
    ]
    search_fields = [
        'checkout_request_id', 'merchant_request_id', 
        'phone_number', 'mpesa_receipt_number'
    ]
    readonly_fields = ['created_at', 'updated_at']


@admin.register(CardTransaction)
class CardTransactionAdmin(admin.ModelAdmin):
    list_display = [
        'payment', 'transaction_reference', 'card_last_four', 
        'card_type', 'authorization_code'
    ]
    search_fields = ['transaction_reference', 'card_last_four', 'authorization_code']
    readonly_fields = ['created_at', 'updated_at']
