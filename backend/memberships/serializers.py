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