from rest_framework import serializers
from .models import MembershipPlan, Membership, SessionLog
from members.models import Member


class MembershipPlanSerializer(serializers.ModelSerializer):
    sessions_per_month = serializers.ReadOnlyField()
    
    class Meta:
        model = MembershipPlan
        fields = [
            'id',
            'plan_name',
            'membership_type',
            'plan_type',
            'category',
            'sessions_per_week',
            'sessions_per_month',
            'weekly_fee',
            'monthly_fee',
            'per_session_fee',
            'description',
            'is_active',
            'created_at',
            'updated_at'
        ]


class SessionLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = SessionLog
        fields = ['id', 'date_used', 'location', 'notes']


class MembershipSerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(source='member.full_name', read_only=True)
    member_email = serializers.CharField(source='member.email', read_only=True)
    member_phone = serializers.CharField(source='member.phone', read_only=True)
    member_id_display = serializers.CharField(source='member.member_id', read_only=True)
    
    plan_name = serializers.CharField(source='plan.plan_name', read_only=True)
    sessions_per_week = serializers.IntegerField(source='plan.sessions_per_week', read_only=True)
    
    # Calculated fields
    is_expired = serializers.ReadOnlyField()
    is_expiring_soon = serializers.ReadOnlyField()
    usage_percentage = serializers.ReadOnlyField()
    
    # Recent session logs
    recent_sessions = SessionLogSerializer(source='session_logs', many=True, read_only=True)
    
    class Meta:
        model = Membership
        fields = [
            'id',
            'member',
            'member_name',
            'member_email', 
            'member_phone',
            'member_id_display',
            'plan',
            'plan_name',
            'sessions_per_week',
            'status',
            'payment_status',
            'total_sessions_allowed',
            'sessions_used',
            'sessions_remaining',
            'start_date',
            'end_date',
            'amount_paid',
            'next_billing_date',
            'location',
            'is_expired',
            'is_expiring_soon',
            'usage_percentage',
            'recent_sessions',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'sessions_remaining']

    def validate(self, data):
        """Validate membership data"""
        if data.get('start_date') and data.get('end_date'):
            if data['start_date'] >= data['end_date']:
                raise serializers.ValidationError(
                    {"end_date": "End date must be after start date."}
                )
        return data


class IndoorMembershipListSerializer(serializers.ModelSerializer):
    """Optimized serializer for listing indoor memberships (duration-based)"""
    
    member_name = serializers.CharField(source='member.full_name', read_only=True)
    member_email = serializers.CharField(source='member.email', read_only=True)
    member_phone = serializers.CharField(source='member.phone', read_only=True)
    member_id_display = serializers.CharField(source='member.member_id', read_only=True)
    
    # Member health/fitness data for indoor
    height = serializers.DecimalField(source='member.height', max_digits=5, decimal_places=2, read_only=True)
    weight = serializers.DecimalField(source='member.weight', max_digits=5, decimal_places=2, read_only=True)
    bmi = serializers.DecimalField(source='member.bmi', max_digits=4, decimal_places=1, read_only=True)
    body_fat_percentage = serializers.DecimalField(source='member.body_fat_percentage', max_digits=4, decimal_places=1, read_only=True)
    fitness_level = serializers.CharField(source='member.fitness_level', read_only=True)
    
    # Goals and test results
    short_term_goals = serializers.CharField(source='member.short_term_goals', read_only=True)
    long_term_goals = serializers.CharField(source='member.long_term_goals', read_only=True)
    strength_test_results = serializers.CharField(source='member.strength_test_results', read_only=True)
    cardio_test_results = serializers.CharField(source='member.cardio_test_results', read_only=True)
    flexibility_test_results = serializers.CharField(source='member.flexibility_test_results', read_only=True)
    
    # Indoor plan details (duration-based)
    plan_name = serializers.CharField(source='plan.plan_name', read_only=True)
    plan_type = serializers.CharField(source='plan.plan_type', read_only=True)
    monthly_fee = serializers.DecimalField(source='plan.monthly_fee', max_digits=10, decimal_places=2, read_only=True)
    
    # Visit tracking
    total_visits = serializers.SerializerMethodField()
    last_visit = serializers.SerializerMethodField()
    
    is_expired = serializers.ReadOnlyField()
    is_expiring_soon = serializers.ReadOnlyField()
    
    class Meta:
        model = Membership
        fields = [
            'id',
            'member',
            'member_name',
            'member_email', 
            'member_phone',
            'member_id_display',
            'height',
            'weight',
            'bmi',
            'body_fat_percentage',
            'fitness_level',
            'short_term_goals',
            'long_term_goals', 
            'strength_test_results',
            'cardio_test_results',
            'flexibility_test_results',
            'plan_name',
            'plan_type',
            'monthly_fee',
            'status',
            'payment_status',
            'total_visits',
            'last_visit',
            'is_expired',
            'is_expiring_soon',
            'start_date',
            'end_date'
        ]
    
    def get_total_visits(self, obj):
        """Get total number of visits"""
        return obj.session_logs.count()
    
    def get_last_visit(self, obj):
        """Get date of last visit"""
        last_session = obj.session_logs.first()  # Already ordered by -date_used
        return last_session.date_used if last_session else None


class OutdoorMembershipListSerializer(serializers.ModelSerializer):
    """Optimized serializer for listing outdoor memberships"""
    
    member_name = serializers.CharField(source='member.full_name', read_only=True)
    member_email = serializers.CharField(source='member.email', read_only=True)
    member_phone = serializers.CharField(source='member.phone', read_only=True)
    member_id_display = serializers.CharField(source='member.member_id', read_only=True)
    
    plan_name = serializers.CharField(source='plan.plan_name', read_only=True)
    sessions_per_week = serializers.IntegerField(source='plan.sessions_per_week', read_only=True)
    weekly_fee = serializers.DecimalField(source='plan.weekly_fee', max_digits=10, decimal_places=2, read_only=True)
    
    is_expired = serializers.ReadOnlyField()
    is_expiring_soon = serializers.ReadOnlyField()
    usage_percentage = serializers.ReadOnlyField()
    
    class Meta:
        model = Membership
        fields = [
            'id',
            'member',
            'member_name',
            'member_email', 
            'member_phone',
            'member_id_display',
            'plan_name',
            'sessions_per_week',
            'weekly_fee',
            'status',
            'payment_status',
            'total_sessions_allowed',
            'sessions_used',
            'sessions_remaining',
            'location',
            'is_expired',
            'is_expiring_soon',
            'usage_percentage',
            'start_date',
            'end_date'
        ]


class CreateMembershipSerializer(serializers.ModelSerializer):
    """Serializer for creating new memberships"""
    
    class Meta:
        model = Membership
        fields = [
            'member',
            'plan',
            'status',
            'payment_status',
            'total_sessions_allowed',
            'start_date',
            'end_date',
            'amount_paid',
            'location'
        ]

    def create(self, validated_data):
        # Auto-calculate sessions_remaining when creating
        membership = Membership(**validated_data)
        membership.sessions_remaining = membership.total_sessions_allowed - membership.sessions_used
        membership.save()
        return membership


class SessionUsageSerializer(serializers.Serializer):
    """Serializer for session usage (check-in)"""
    location = serializers.CharField(max_length=100, required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)


class PaymentDueSerializer(serializers.ModelSerializer):
    """Serializer for payments due - optimized for payments page"""
    
    member_details = serializers.SerializerMethodField()
    days_overdue = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    amount_due = serializers.SerializerMethodField()
    total_outstanding = serializers.SerializerMethodField()
    plan_details = serializers.SerializerMethodField()
    invoice_number = serializers.SerializerMethodField()
    last_payment = serializers.SerializerMethodField()
    
    class Meta:
        model = Membership
        fields = [
            'id', 'member_details', 'plan_details', 'next_billing_date', 
            'days_overdue', 'status', 'amount_due', 'total_outstanding',
            'payment_status', 'invoice_number', 'last_payment', 'created_at'
        ]
    
    def get_member_details(self, obj):
        return {
            'id': f'PTF{str(obj.member.id).zfill(6)}',
            'firstName': obj.member.first_name,
            'lastName': obj.member.last_name,
            'email': obj.member.email,
            'phone': obj.member.phone,
        }
    
    def get_plan_details(self, obj):
        return {
            'planType': obj.plan.plan_name,
            'membershipType': obj.plan.membership_type,
            'amount': float(obj.plan.monthly_fee)
        }
    
    def get_days_overdue(self, obj):
        from django.utils import timezone
        if obj.next_billing_date and obj.next_billing_date < timezone.now().date():
            return (timezone.now().date() - obj.next_billing_date).days
        return 0
    
    def get_status(self, obj):
        from django.utils import timezone
        if not obj.next_billing_date:
            return 'unknown'
        
        days_diff = (obj.next_billing_date - timezone.now().date()).days
        
        if days_diff < 0:
            return 'overdue'
        elif days_diff == 0:
            return 'due_today'
        elif days_diff <= 7:
            return 'due_soon'
        else:
            return 'current'
    
    def get_amount_due(self, obj):
        return float(obj.plan.monthly_fee)
    
    def get_total_outstanding(self, obj):
        # Calculate total outstanding based on overdue periods
        days_overdue = self.get_days_overdue(obj)
        if days_overdue > 0:
            # For simplicity, assume monthly billing
            months_overdue = max(1, days_overdue // 30)
            return float(obj.plan.monthly_fee * months_overdue)
        return float(obj.plan.monthly_fee)
    
    def get_invoice_number(self, obj):
        # Generate invoice number based on membership ID
        return f'INV-2024-{str(obj.id).zfill(3)}'
    
    def get_last_payment(self, obj):
        # Return start date as last payment for now
        return obj.start_date


class RenewalDueSerializer(serializers.ModelSerializer):
    """Serializer for renewals due - optimized for renewals page"""
    
    member_details = serializers.SerializerMethodField()
    plan_details = serializers.SerializerMethodField()
    days_until_expiry = serializers.SerializerMethodField()
    urgency = serializers.SerializerMethodField()
    renewal_amount = serializers.SerializerMethodField()
    last_renewal = serializers.SerializerMethodField()
    total_renewals = serializers.SerializerMethodField()
    
    class Meta:
        model = Membership
        fields = [
            'id', 'member_details', 'plan_details', 'end_date',
            'days_until_expiry', 'urgency', 'renewal_amount',
            'last_renewal', 'total_renewals', 'status'
        ]
    
    def get_member_details(self, obj):
        return {
            'id': f'PTF{str(obj.member.id).zfill(6)}',
            'firstName': obj.member.first_name,
            'lastName': obj.member.last_name,
            'email': obj.member.email,
            'phone': obj.member.phone,
            'preferredContact': 'email'  # Default, could be a field on member
        }
    
    def get_plan_details(self, obj):
        return {
            'currentPlan': obj.plan.plan_name,
            'membershipType': obj.plan.membership_type,
        }
    
    def get_days_until_expiry(self, obj):
        from django.utils import timezone
        return (obj.end_date - timezone.now().date()).days
    
    def get_urgency(self, obj):
        days_until_expiry = self.get_days_until_expiry(obj)
        
        if days_until_expiry <= 7:
            return 'critical'
        elif days_until_expiry <= 15:
            return 'high'
        elif days_until_expiry <= 30:
            return 'medium'
        else:
            return 'low'
    
    def get_renewal_amount(self, obj):
        return float(obj.plan.monthly_fee)
    
    def get_last_renewal(self, obj):
        return obj.start_date
    
    def get_total_renewals(self, obj):
        # Count how many times this member has had memberships
        return Membership.objects.filter(member=obj.member).count()


class PaymentRecordSerializer(serializers.Serializer):
    """Serializer for recording payments"""
    
    payment_method = serializers.ChoiceField(choices=[
        ('cash', 'Cash'),
        ('mpesa', 'M-Pesa'),
        ('bank_transfer', 'Bank Transfer'),
        ('card', 'Card')
    ])
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    description = serializers.CharField(max_length=500, required=False)
    transaction_reference = serializers.CharField(max_length=100, required=False)
    recorded_by = serializers.CharField(max_length=100)
    
    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than 0")
        return value


class PaymentReminderSerializer(serializers.Serializer):
    """Serializer for sending payment reminders"""
    
    reminder_type = serializers.ChoiceField(choices=[
        ('email', 'Email'),
        ('sms', 'SMS'),
        ('both', 'Both')
    ])
    message = serializers.CharField(max_length=500, required=False)


class BulkPaymentReminderSerializer(serializers.Serializer):
    """Serializer for bulk payment reminders"""
    
    member_ids = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=1
    )
    reminder_type = serializers.ChoiceField(choices=[
        ('email', 'Email'),
        ('sms', 'SMS'),
        ('both', 'Both')
    ])
    message = serializers.CharField(max_length=500, required=False)