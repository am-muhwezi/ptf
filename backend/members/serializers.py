from rest_framework import serializers
from .models import Member
from datetime import date


class MemberSerializer(serializers.ModelSerializer):
    member_id = serializers.ReadOnlyField()
    full_name = serializers.ReadOnlyField()
    bmi = serializers.ReadOnlyField()
    days_until_expiry = serializers.ReadOnlyField()
    is_expiring_soon = serializers.ReadOnlyField()
    
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
            "membership_type",
            "plan_type",
            "location",
            "status",
            "payment_status",
            "address",
            "dateOfBirth",
            "bloodGroup",
            "idPassport",
            "emergencyContact",
            "emergencyPhone",
            "medicalConditions",
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
            "registrationDate",
            "membership_start_date",
            "membership_end_date",
            "last_visit",
            "is_checked_in",
            "total_visits",
            "amount",
            "last_payment",
            "days_until_expiry",
            "is_expiring_soon",
        ]
        read_only_fields = ["id", "registrationDate", "total_visits", "last_visit"]

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

    def validate_membership_dates(self, data):
        """Validate membership start and end dates"""
        start_date = data.get("membership_start_date")
        end_date = data.get("membership_end_date")

        if start_date and end_date:
            if start_date >= end_date:
                raise serializers.ValidationError(
                    {"membership_end_date": "End date must be after start date."}
                )

        return data

    def validate_height(self, value):
        """Validate height is within reasonable range"""
        if value is not None and (value < 50 or value > 300):
            raise serializers.ValidationError("Height must be between 50-300 cm")
        return value

    def validate_weight(self, value):
        """Validate weight is within reasonable range"""
        if value is not None and (value < 20 or value > 500):
            raise serializers.ValidationError("Weight must be between 20-500 kg")
        return value

    def validate_body_fat_percentage(self, value):
        """Validate body fat percentage"""
        if value is not None and (value < 0 or value > 100):
            raise serializers.ValidationError(
                "Body fat percentage must be between 0-100%"
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

    def validate_idPassport(self, value):
        """Validate idPassport uniqueness only for non-empty values"""
        if not value:  # Convert empty string to None for unique constraint
            return None
            
        # Check for uniqueness (excluding current instance during updates)
        query = Member.objects.filter(idPassport=value)
        if self.instance:
            query = query.exclude(pk=self.instance.pk)
        
        if query.exists():
            raise serializers.ValidationError(
                "A member with this idPassport already exists."
            )
        return value

    def validate_plan_type(self, value):
        """Validate plan type based on membership type"""
        membership_type = self.initial_data.get('membershipType') or self.initial_data.get('membership_type')
        
        if membership_type == 'indoor' and not value:
            raise serializers.ValidationError(
                "Plan type is required for indoor membership."
            )
        elif membership_type == 'outdoor' and not value:
            raise serializers.ValidationError(
                "Plan type is required for outdoor membership."
            )
        
        return value

    def validate_location(self, value):
        """Validate location for outdoor memberships"""
        membership_type = self.initial_data.get('membershipType') or self.initial_data.get('membership_type')
        
        if membership_type == 'outdoor' and not value:
            raise serializers.ValidationError(
                "Location is required for outdoor membership."
            )
        
        return value

    def validate(self, data):
        """Custom validation for the entire object"""
        data = self.validate_membership_dates(data)
        
        # Cross-field validation for membership type requirements
        membership_type = data.get('membership_type') or data.get('membershipType')
        plan_type = data.get('plan_type') or data.get('planType')
        location = data.get('location')
        
        if membership_type == 'indoor' and not plan_type:
            raise serializers.ValidationError({
                'plan_type': 'Plan type is required for indoor membership.'
            })
            
        if membership_type == 'outdoor' and not location:
            raise serializers.ValidationError({
                'location': 'Location is required for outdoor membership.'
            })
        
        return data


class MemberListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing members"""

    member_id = serializers.ReadOnlyField()
    full_name = serializers.ReadOnlyField()
    days_until_expiry = serializers.ReadOnlyField()

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
            "membership_type",
            "plan_type",
            "status",
            "payment_status",
            "registrationDate",
            "membership_end_date",
            "last_visit",
            "total_visits",
            "amount",
            "is_checked_in",
            "days_until_expiry",
        ]


class MemberSearchSerializer(serializers.ModelSerializer):
    """Minimal serializer for search results"""

    member_id = serializers.ReadOnlyField()
    full_name = serializers.ReadOnlyField()

    class Meta:
        model = Member
        fields = [
            "id",
            "member_id",
            "first_name",
            "last_name",
            "full_name",
            "email",
            "membership_type",
            "status",
            "payment_status",
            "is_checked_in",    
        ]
