from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from django.utils import timezone
from datetime import timedelta
from .models import Member, PhysicalProfile
from memberships.models import MembershipPlan, Membership
from payments.models import Payment, PaymentMethod

# Updated plans with proper pricing structure
MEMBERSHIP_PLANS = {
    # Indoor Membership Plans
    "indoor_daily": {
        "name": "Indoor Daily",
        "type": "indoor",
        "price": 1000,
        "sessions": 1,
        "days": 1,
    },
    "indoor_monthly": {
        "name": "Indoor Monthly",
        "type": "indoor",
        "price": 8000,
        "sessions": 30,
        "days": 30,
    },
    "indoor_quarterly": {
        "name": "Indoor Quarterly",
        "type": "indoor",
        "price": 22000,
        "sessions": 90,
        "days": 90,
    },
    "indoor_bi_annual": {
        "name": "Indoor Bi-Annual",
        "type": "indoor",
        "price": 40000,
        "sessions": 180,
        "days": 180,
    },
    "indoor_annual": {
        "name": "Indoor Annual",
        "type": "indoor",
        "price": 75000,
        "sessions": 365,
        "days": 365,
    },
    # Outdoor Membership Plans (Dance Classes) - Updated to match frontend
    "outdoor_daily": {
        "name": "Daily Drop-in",
        "type": "outdoor",
        "price": 1000,
        "sessions": 1,
        "days": 1,
    },
    "1_session_week": {
        "name": "1x/Week",
        "type": "outdoor",
        "price": 3000,
        "sessions": 4,
        "days": 30,
    },
    "2_sessions_week": {
        "name": "2x/Week",
        "type": "outdoor",
        "price": 4000,
        "sessions": 8,
        "days": 30,
    },
    "3_sessions_week": {
        "name": "3x/Week",
        "type": "outdoor",
        "price": 5000,
        "sessions": 12,
        "days": 30,
    },
    "4_sessions_week": {
        "name": "4x/Week",
        "type": "outdoor",
        "price": 6000,
        "sessions": 16,
        "days": 30,
    },
    "5_sessions_week": {
        "name": "5x/Week",
        "type": "outdoor",
        "price": 7000,
        "sessions": 20,
        "days": 30,
    },
}

# Valid dance class locations
DANCE_LOCATIONS = [
    "arboretum",
    "boxwood",
    "karura",
    "sagret",
    "mushroom",
    "pcea_loreto",
    "bethany",
    "5star",
    "kijani",
    "rustique",
]

# Valid blood groups
BLOOD_GROUPS = ["A(-)", "A(+)", "B(+)", "B(-)", "AB(+)", "AB(-)", "O(+)", "O(-)"]


@api_view(["POST"])
def register_member(request):
    """
    Complete member registration with all required fields
    """
    try:
        with transaction.atomic():
            # Validate required fields - simplified to only essential gym data
            required_fields = [
                "first_name",
                "last_name", 
                "phone",
                "membership_type",
            ]

            for field in required_fields:
                if not request.data.get(field):
                    return Response({"error": f"{field} is required"}, status=400)
            
            # Auto-generate plan_code if not provided
            plan_code = request.data.get("plan_code")
            if not plan_code:
                membership_type = request.data["membership_type"].lower()
                plan_type = request.data.get("plan_type", "").lower()
                
                if not plan_type:
                    return Response({"error": "plan_type is required when plan_code is not provided"}, status=400)
                
                # Generate plan_code
                if membership_type == "indoor":
                    plan_code = f"indoor_{plan_type}"
                else:  # outdoor
                    plan_code = plan_type  # For outdoor, plan_type already contains the full code
                
                request.data["plan_code"] = plan_code

            # Validate membership type
            membership_type = request.data["membership_type"].lower()
            if membership_type not in ["indoor", "outdoor"]:
                return Response(
                    {"error": "Membership type must be 'indoor' or 'outdoor'"},
                    status=400,
                )

            # Validate plan code
            plan_code = request.data["plan_code"]
            if plan_code not in MEMBERSHIP_PLANS:
                return Response(
                    {
                        "error": f"Invalid plan: {plan_code}",
                        "available_plans": list(MEMBERSHIP_PLANS.keys()),
                    },
                    status=400,
                )

            # Ensure plan matches membership type
            plan_data = MEMBERSHIP_PLANS[plan_code]
            if plan_data["type"] != membership_type:
                return Response(
                    {
                        "error": f"Plan {plan_code} doesn't match membership type {membership_type}"
                    },
                    status=400,
                )

            # Validate dance location for outdoor membership
            if membership_type == "outdoor":
                location = request.data.get("dance_location", "").lower()
                if not location or location not in DANCE_LOCATIONS:
                    return Response(
                        {
                            "error": "Dance class location is required for outdoor membership",
                            "available_locations": DANCE_LOCATIONS,
                        },
                        status=400,
                    )

            # Validate blood group if provided, default to "nil"
            blood_group = request.data.get("blood_group")
            if not blood_group or blood_group == "":
                blood_group = "nil"
            elif blood_group not in BLOOD_GROUPS + ["nil"]:
                return Response(
                    {
                        "error": "Invalid blood group",
                        "valid_blood_groups": BLOOD_GROUPS + ["nil"],
                    },
                    status=400,
                )

            # Check for duplicate phone numbers
            phone = request.data["phone"]
            if Member.objects.filter(phone=phone).exists():
                return Response(
                    {"error": "Phone number already registered"}, status=400
                )

            # Check for duplicate ID/Passport if provided
            id_passport = request.data.get("id_passport_no")
            if (
                id_passport
                and Member.objects.filter(id_passport=id_passport).exists()
            ):
                return Response(
                    {"error": "ID/Passport number already registered"}, status=400
                )

            # 1. CREATE MEMBER with all collected information
            # Handle empty date_of_birth (convert empty string to None)
            date_of_birth = request.data.get("date_of_birth")
            if date_of_birth == "":
                date_of_birth = None
            
            # Handle empty email (convert empty string to None for unique constraint)
            email = request.data.get("email")
            if email == "":
                email = None
            
            member_data = {
                "first_name": request.data["first_name"],
                "other_names": request.data.get("other_names"),
                "last_name": request.data["last_name"],
                "phone": phone,
                "email": email,
                "id_passport": id_passport,
                "blood_group": blood_group,
                "date_of_birth": date_of_birth,
                "address": request.data.get("physical_address"),
                "emergency_contact": request.data.get("emergency_contact_name"),
                "emergency_phone": request.data.get("emergency_contact_phone"),
                "medical_conditions": request.data.get("medical_conditions"),
                "status": "active",
            }

            member = Member.objects.create(**member_data)

            # 2. CREATE MEMBERSHIP
            plan_obj = get_or_create_plan(plan_code, plan_data)

            membership_data = {
                "member": member,
                "plan": plan_obj,
                "start_date": timezone.now().date(),
                "end_date": timezone.now().date() + timedelta(days=plan_data["days"]),
                "total_sessions_allowed": plan_data["sessions"],
                "sessions_used": 0,
                "amount_paid": plan_data["price"],
                "payment_status": "pending",
                "status": "active",
            }

            # Add location for outdoor members
            if membership_type == "outdoor":
                from members.models import Location
                location_name = request.data["dance_location"]
                location, _ = Location.objects.get_or_create(
                    code=location_name,
                    defaults={"name": location_name.replace("_", " ").title()}
                )
                membership_data["location"] = location

            membership = Membership.objects.create(**membership_data)

            # 3. CREATE PHYSICAL PROFILE (Indoor members only)
            if membership_type == "indoor":
                PhysicalProfile.objects.create(
                    member=member,
                    height=request.data.get("height"),
                    weight=request.data.get("weight"),
                    fitness_level=request.data.get("fitness_level", "beginner"),
                    short_term_goals=request.data.get("short_term_goals"),
                    long_term_goals=request.data.get("long_term_goals"),
                )

            # 4. CREATE PAYMENT RECORD
            payment_method = request.data.get("payment_method", "cash")
            payment = create_pending_payment(membership, payment_method)

            # Prepare response
            response_data = {
                "success": True,
                "member_id": member.id,
                "membership_id": membership.id,
                "payment_id": str(payment.payment_id),
                "member_name": f"{member.first_name} {member.last_name}",
                "membership_type": membership_type,
                "plan_name": plan_data["name"],
                "amount_due": str(plan_data["price"]),
                "payment_status": "pending",
                "message": f'Member registered successfully. Payment of KES {plan_data["price"]} is pending confirmation.',
            }

            # Add location info for outdoor members
            if membership_type == "outdoor":
                response_data["dance_location"] = request.data["dance_location"]

            return Response(response_data, status=201)

    except Exception as e:
        return Response({"error": str(e)}, status=500)


def create_pending_payment(membership, payment_method):
    """Create payment record - always starts as pending"""
    method_obj, created = PaymentMethod.objects.get_or_create(
        name=payment_method.title(),
        defaults={"payment_type": get_payment_type(payment_method), "is_active": True},
    )

    payment = Payment.objects.create(
        membership=membership,
        payment_method=method_obj,
        amount=membership.amount_paid,
        currency="KES",
        purpose="membership_fee",
        status="pending",
    )

    return payment


def get_payment_type(payment_method):
    """Map payment method to type"""
    type_map = {
        "cash": "cash",
        "mpesa": "mpesa",
        "card": "card",
        "bank_transfer": "bank_transfer",
        "cheque": "cash",
    }
    return type_map.get(payment_method.lower(), "cash")


def get_or_create_plan(plan_code, plan_data):
    """Get or create membership plan"""
    plan_obj, created = MembershipPlan.objects.get_or_create(
        plan_code=plan_code,
        defaults={
            "plan_name": plan_data["name"],
            "membership_type": plan_data["type"],
            "plan_type": plan_code.split("_")[1] if "_" in plan_code else "custom",
            "sessions_per_week": calculate_sessions_per_week(plan_code, plan_data),
            "duration_weeks": max(1, plan_data["days"] // 7),
            "monthly_fee": plan_data["price"] if "monthly" in plan_code else 0,
            "weekly_fee": plan_data["price"] if "week" in plan_code else 0,
            "per_session_fee": (
                plan_data["price"]
                if "daily" in plan_code or "dropin" in plan_code
                else 0
            ),
            "is_active": True,
        },
    )
    return plan_obj


def calculate_sessions_per_week(plan_code, plan_data):
    """Calculate sessions per week based on plan code"""
    if "1_session_week" in plan_code:
        return 1
    elif "2_sessions_week" in plan_code:
        return 2
    elif "3_sessions_week" in plan_code:
        return 3
    elif "4_sessions_week" in plan_code:
        return 4
    elif "5_sessions_week" in plan_code:
        return 5
    elif "daily" in plan_code:
        return 1
    else:
        return 1


@api_view(["GET"])
def get_plans(request):
    """Get available plans"""
    membership_type = request.GET.get("membership_type", "").lower()

    if membership_type:
        # Filter plans by membership type
        filtered_plans = {
            k: v for k, v in MEMBERSHIP_PLANS.items() if v["type"] == membership_type
        }
        plans = [{"code": k, **v} for k, v in filtered_plans.items()]
    else:
        # Return all plans
        plans = [{"code": k, **v} for k, v in MEMBERSHIP_PLANS.items()]

    return Response({"success": True, "plans": plans})


@api_view(["GET"])
def get_dance_locations(request):
    """Get available dance class locations"""
    locations = [
        {"code": loc, "name": loc.replace("_", " ").title()} for loc in DANCE_LOCATIONS
    ]
    return Response({"success": True, "locations": locations})


@api_view(["GET"])
def get_blood_groups(request):
    """Get available blood groups"""
    return Response({"success": True, "blood_groups": BLOOD_GROUPS})
