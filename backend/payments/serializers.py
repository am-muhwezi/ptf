from rest_framework import serializers
from .models import Payment, PaymentMethod, Invoice, PaymentReminder, MpesaTransaction, CardTransaction


class PaymentMethodSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentMethod
        fields = ['id', 'name', 'payment_type', 'is_active']


class PaymentSerializer(serializers.ModelSerializer):
    payment_method_name = serializers.CharField(source='payment_method.name', read_only=True)
    payment_method_type = serializers.CharField(source='payment_method.payment_type', read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'payment_id', 'membership', 'payment_method', 'payment_method_name', 
            'payment_method_type', 'amount', 'currency', 'purpose', 'status',
            'external_reference', 'initiated_at', 'completed_at', 'failed_at',
            'notes', 'failure_reason'
        ]
        read_only_fields = ['payment_id', 'initiated_at', 'completed_at', 'failed_at']


class InvoiceSerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(
        source='membership.member.first_name', read_only=True
    )
    
    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'membership', 'member_name',
            'amount', 'currency', 'issue_date', 'due_date', 'paid_date',
            'status', 'description', 'notes', 'is_overdue'
        ]
        read_only_fields = ['invoice_number', 'issue_date', 'is_overdue']


class PaymentReminderSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentReminder
        fields = [
            'id', 'membership', 'reminder_type', 'reminder_method',
            'subject', 'message', 'sent_at', 'is_delivered', 'delivered_at'
        ]
        read_only_fields = ['sent_at', 'delivered_at']


class MpesaTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = MpesaTransaction
        fields = [
            'payment', 'checkout_request_id', 'merchant_request_id',
            'phone_number', 'account_reference', 'transaction_desc',
            'mpesa_receipt_number', 'transaction_date'
        ]


class CardTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CardTransaction
        fields = [
            'payment', 'transaction_reference', 'card_last_four',
            'card_type', 'authorization_code', 'gateway_response'
        ]