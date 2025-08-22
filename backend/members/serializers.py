from rest_framework import serializers
from .models import Member, PhysicalProfile
from datetime import date


class PhysicalProfileSerializer(serializers.ModelSerializer):
    bmi = serializers.ReadOnlyField()
    
    class Meta:
        model = PhysicalProfile
        fields = [
            "height",
            "weight",
            "bmi",
            "body_fat_percentage",
            "fitness_level",
            "strength_test_results",
            "cardio_test_results",
            "flexibility_test_results",
            "short_term_goals",
            "long_term_goals",
        ]


class MemberSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    membership_type = serializers.ReadOnlyField()
    payment_status = serializers.SerializerMethodField()
    plan_type = serializers.SerializerMethodField()
    amount = serializers.SerializerMethodField()
    member_id = serializers.SerializerMethodField()
    physical_profile = PhysicalProfileSerializer(required=False)
    
    # Make required fields explicit
    first_name = serializers.CharField(max_length=100, required=True, error_messages={
        'required': 'First name is required.',
        'blank': 'First name cannot be blank.'
    })
    last_name = serializers.CharField(max_length=100, required=True, error_messages={
        'required': 'Last name is required.',
        'blank': 'Last name cannot be blank.'
    })
    phone = serializers.CharField(max_length=15, required=True, error_messages={
        'required': 'Phone number is required.',
        'blank': 'Phone number cannot be blank.'
    })

    class Meta:
        model = Member
        fields = [
            "id",
            "member_id",
            "first_name",
            "last_name",
            "full_name",
            "email",
            "phone",
            "address",
            "date_of_birth",
            "id_passport",
            "blood_group",
            "emergency_contact",
            "emergency_phone",
            "medical_conditions",
            "membership_type",
            "payment_status",
            "plan_type",
            "amount",
            "status",
            "registration_date",
            "total_visits",
            "last_visit",
            "created_at",
            "updated_at",
            "physical_profile",
        ]
        read_only_fields = ["id", "registration_date", "total_visits", "last_visit", "created_at", "updated_at"]

    def get_payment_status(self, obj):
        """Get payment status from active membership"""
        active_membership = obj.memberships.filter(status='active').first()
        return active_membership.payment_status if active_membership else 'unknown'

    def get_plan_type(self, obj):
        """Get plan type from active membership"""
        active_membership = obj.memberships.filter(status='active').first()
        return active_membership.plan.plan_name if active_membership and active_membership.plan else 'No Plan'

    def get_amount(self, obj):
        """Get amount from active membership"""
        active_membership = obj.memberships.filter(status='active').first()
        if active_membership and active_membership.plan:
            # Return monthly fee if available, otherwise weekly fee
            return active_membership.plan.monthly_fee or active_membership.plan.weekly_fee or 0
        return 0

    def get_member_id(self, obj):
        """Generate formatted member ID"""
        return f"PTF{str(obj.id).zfill(6)}"

    def validate_email(self, value):
        """Ensure email is unique during updates"""
        if not value:  # Convert empty string to None for unique constraint
            return None
            
        if self.instance and self.instance.email == value:
            return value

        if Member.objects.filter(email=value).exists():
            raise serializers.ValidationError(
                "A member with this email already exists."
            )
        return value

    def validate_phone(self, value):
        """Validate phone number format and uniqueness"""
        if not value:
            raise serializers.ValidationError("Phone number is required.")
        
        # Check for uniqueness (excluding current instance during updates)
        query = Member.objects.filter(phone=value)
        if self.instance:
            query = query.exclude(pk=self.instance.pk)
        
        if query.exists():
            raise serializers.ValidationError(
                "A member with this phone number already exists."
            )
        return value

    def validate_id_passport(self, value):
        """Validate id_passport uniqueness only for non-empty values"""
        if not value:  # Convert empty string to None for unique constraint
            return None
            
        # Check for uniqueness (excluding current instance during updates)
        query = Member.objects.filter(id_passport=value)
        if self.instance:
            query = query.exclude(pk=self.instance.pk)
        
        if query.exists():
            raise serializers.ValidationError(
                "A member with this id_passport already exists."
            )
        return value

    def create(self, validated_data):
        """Create member with optional physical profile"""
        physical_profile_data = validated_data.pop('physical_profile', None)
        member = Member.objects.create(**validated_data)
        
        if physical_profile_data:
            PhysicalProfile.objects.create(member=member, **physical_profile_data)
        
        return member

    def update(self, instance, validated_data):
        """Update member and physical profile"""
        physical_profile_data = validated_data.pop('physical_profile', None)
        
        # Update member instance
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update or create physical profile
        if physical_profile_data:
            if hasattr(instance, 'physical_profile'):
                for attr, value in physical_profile_data.items():
                    setattr(instance.physical_profile, attr, value)
                instance.physical_profile.save()
            else:
                PhysicalProfile.objects.create(member=instance, **physical_profile_data)
        
        return instance


class MemberListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing members"""

    full_name = serializers.ReadOnlyField()

    class Meta:
        model = Member
        fields = [
            "id",
            "first_name",
            "last_name",
            "full_name",
            "email",
            "phone",
            "status",
            "registration_date",
            "last_visit",
            "total_visits",
        ]


class MemberSearchSerializer(serializers.ModelSerializer):
    """Minimal serializer for search results"""

    full_name = serializers.ReadOnlyField()

    class Meta:
        model = Member
        fields = [
            "id",
            "first_name",
            "last_name",
            "full_name",
            "email",
            "phone",
            "status",
        ]
