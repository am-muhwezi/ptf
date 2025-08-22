from rest_framework import serializers
from .models import MembershipPlan, Membership, SessionLog


class MembershipPlanSerializer(serializers.ModelSerializer):
    sessions_per_month = serializers.SerializerMethodField()
    
    class Meta:
        model = MembershipPlan
        fields = [
            'id',
            'plan_name',
            'plan_code',
            'membership_type',
            'plan_type',
            'sessions_per_week',
            'duration_weeks',
            'sessions_per_month',
            'weekly_fee',
            'monthly_fee',
            'per_session_fee',
            'description',
            'is_active',
            'created_at',
            'updated_at'
        ]
    
    def get_sessions_per_month(self, obj):
        return obj.sessions_per_week * 4


class SessionLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = SessionLog
        fields = ['id', 'date_used', 'session_type', 'notes']


class MembershipSerializer(serializers.ModelSerializer):
    member_name = serializers.SerializerMethodField()
    member_email = serializers.CharField(source='member.email', read_only=True)
    member_phone = serializers.CharField(source='member.phone', read_only=True)
    member_id_display = serializers.CharField(source='member.id', read_only=True)
    
    plan_name = serializers.CharField(source='plan.plan_name', read_only=True)
    membership_type = serializers.CharField(source='plan.membership_type', read_only=True)
    sessions_per_week = serializers.IntegerField(source='plan.sessions_per_week', read_only=True)
    
    # Location info (for outdoor memberships)
    location_name = serializers.CharField(source='location.name', read_only=True)
    location_code = serializers.CharField(source='location.code', read_only=True)
    
    # Calculated fields
    sessions_remaining = serializers.SerializerMethodField()
    is_expired = serializers.SerializerMethodField()
    is_expiring_soon = serializers.SerializerMethodField()
    usage_percentage = serializers.SerializerMethodField()
    
    # Recent session logs
    recent_sessions = SessionLogSerializer(source='session_logs', many=True, read_only=True)
    
    def get_member_name(self, obj):
        return f"{obj.member.first_name} {obj.member.last_name}"
    
    def get_sessions_remaining(self, obj):
        return obj.total_sessions_allowed - obj.sessions_used
    
    def get_is_expired(self, obj):
        from django.utils import timezone
        return obj.end_date < timezone.now().date() or self.get_sessions_remaining(obj) <= 0
    
    def get_is_expiring_soon(self, obj):
        from django.utils import timezone
        days_until_expiry = (obj.end_date - timezone.now().date()).days
        return days_until_expiry <= 7 or self.get_sessions_remaining(obj) <= 3
    
    def get_usage_percentage(self, obj):
        if obj.total_sessions_allowed == 0:
            return 0
        return (obj.sessions_used / obj.total_sessions_allowed) * 100
    
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
            'membership_type',
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
            'location_name',
            'location_code',
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
    
    member_name = serializers.SerializerMethodField()
    member_email = serializers.CharField(source='member.email', read_only=True)
    member_phone = serializers.CharField(source='member.phone', read_only=True)
    member_id_display = serializers.CharField(source='member.id', read_only=True)
    
    # Member health/fitness data for indoor (from physical profile)
    height = serializers.SerializerMethodField()
    weight = serializers.SerializerMethodField()
    body_fat_percentage = serializers.SerializerMethodField()
    fitness_level = serializers.SerializerMethodField()
    
    # Goals and test results
    short_term_goals = serializers.SerializerMethodField()
    long_term_goals = serializers.SerializerMethodField()
    strength_test_results = serializers.SerializerMethodField()
    cardio_test_results = serializers.SerializerMethodField()
    flexibility_test_results = serializers.SerializerMethodField()
    
    def get_member_name(self, obj):
        return f"{obj.member.first_name} {obj.member.last_name}"
    
    def get_height(self, obj):
        if hasattr(obj.member, 'physical_profile'):
            return float(obj.member.physical_profile.height) if obj.member.physical_profile.height else None
        return None
    
    def get_weight(self, obj):
        if hasattr(obj.member, 'physical_profile'):
            return float(obj.member.physical_profile.weight) if obj.member.physical_profile.weight else None
        return None
    
    def get_body_fat_percentage(self, obj):
        if hasattr(obj.member, 'physical_profile'):
            return float(obj.member.physical_profile.body_fat_percentage) if obj.member.physical_profile.body_fat_percentage else None
        return None
    
    def get_fitness_level(self, obj):
        if hasattr(obj.member, 'physical_profile'):
            return obj.member.physical_profile.fitness_level
        return None
    
    def get_short_term_goals(self, obj):
        if hasattr(obj.member, 'physical_profile'):
            return obj.member.physical_profile.short_term_goals
        return None
    
    def get_long_term_goals(self, obj):
        if hasattr(obj.member, 'physical_profile'):
            return obj.member.physical_profile.long_term_goals
        return None
    
    def get_strength_test_results(self, obj):
        if hasattr(obj.member, 'physical_profile'):
            return obj.member.physical_profile.strength_test_results
        return None
    
    def get_cardio_test_results(self, obj):
        if hasattr(obj.member, 'physical_profile'):
            return obj.member.physical_profile.cardio_test_results
        return None
    
    def get_flexibility_test_results(self, obj):
        if hasattr(obj.member, 'physical_profile'):
            return obj.member.physical_profile.flexibility_test_results
        return None
    
    # Indoor plan details (duration-based)
    plan_name = serializers.CharField(source='plan.plan_name', read_only=True)
    plan_type = serializers.CharField(source='plan.plan_type', read_only=True)
    monthly_fee = serializers.DecimalField(source='plan.monthly_fee', max_digits=10, decimal_places=2, read_only=True)
    
    # Visit tracking
    total_visits = serializers.SerializerMethodField()
    last_visit = serializers.SerializerMethodField()
    
    is_expired = serializers.SerializerMethodField()
    is_expiring_soon = serializers.SerializerMethodField()
    
    def get_is_expired(self, obj):
        from django.utils import timezone
        sessions_remaining = obj.total_sessions_allowed - obj.sessions_used
        return obj.end_date < timezone.now().date() or sessions_remaining <= 0
    
    def get_is_expiring_soon(self, obj):
        from django.utils import timezone
        days_until_expiry = (obj.end_date - timezone.now().date()).days
        sessions_remaining = obj.total_sessions_allowed - obj.sessions_used
        return days_until_expiry <= 7 or sessions_remaining <= 3
    
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
    
    member_name = serializers.SerializerMethodField()
    member_email = serializers.CharField(source='member.email', read_only=True)
    member_phone = serializers.CharField(source='member.phone', read_only=True)
    member_id_display = serializers.CharField(source='member.id', read_only=True)
    
    plan_name = serializers.CharField(source='plan.plan_name', read_only=True)
    membership_type = serializers.CharField(source='plan.membership_type', read_only=True)
    sessions_per_week = serializers.IntegerField(source='plan.sessions_per_week', read_only=True)
    weekly_fee = serializers.DecimalField(source='plan.weekly_fee', max_digits=10, decimal_places=2, read_only=True)
    
    # Location info
    location_name = serializers.CharField(source='location.name', read_only=True)
    location_code = serializers.CharField(source='location.code', read_only=True)
    
    # Calculated fields
    sessions_remaining = serializers.SerializerMethodField()
    is_expired = serializers.SerializerMethodField()
    is_expiring_soon = serializers.SerializerMethodField()
    usage_percentage = serializers.SerializerMethodField()
    
    def get_member_name(self, obj):
        return f"{obj.member.first_name} {obj.member.last_name}"
    
    def get_sessions_remaining(self, obj):
        return obj.total_sessions_allowed - obj.sessions_used
    
    def get_is_expired(self, obj):
        from django.utils import timezone
        return obj.end_date < timezone.now().date() or self.get_sessions_remaining(obj) <= 0
    
    def get_is_expiring_soon(self, obj):
        from django.utils import timezone
        days_until_expiry = (obj.end_date - timezone.now().date()).days
        return days_until_expiry <= 7 or self.get_sessions_remaining(obj) <= 3
    
    def get_usage_percentage(self, obj):
        if obj.total_sessions_allowed == 0:
            return 0
        return (obj.sessions_used / obj.total_sessions_allowed) * 100
    
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
            'membership_type',
            'sessions_per_week',
            'weekly_fee',
            'status',
            'payment_status',
            'total_sessions_allowed',
            'sessions_used',
            'sessions_remaining',
            'location',
            'location_name',
            'location_code',
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
            'location',
            'status',
            'payment_status',
            'total_sessions_allowed',
            'start_date',
            'end_date',
            'amount_paid'
        ]

    def create(self, validated_data):
        # Create the membership with normalized structure
        membership = Membership.objects.create(**validated_data)
        return membership


class SessionUsageSerializer(serializers.Serializer):
    """Serializer for session usage (check-in)"""
    session_type = serializers.ChoiceField(
        choices=[('regular', 'Regular Session'), ('trial', 'Trial Session'), ('makeup', 'Make-up Session'), ('complimentary', 'Complimentary Session')],
        default='regular'
    )
    notes = serializers.CharField(required=False, allow_blank=True)