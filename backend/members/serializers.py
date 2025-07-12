from rest_framework import serializers
from .models import Member


class MemberSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(max_length=50)

    class Meta:
        model = Member
        fields = [
            "id",
            "first_name",
            "last_name",
            "email",
            "phone",
            "membership_type",
            "address",
            "bloodGroup",
            "idPassport",
            "emergencyContact",
            "emergencyPhone",
            "dateOfBirth",
            "medicalConditions",
            "registrationDate",
            "is_checked_in",
        ]
