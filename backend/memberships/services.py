from django.db import transaction
from .models import MembershipPlan, Membership
from members.models import PhysicalProfile


class MembershipService:

    # HARDCODED PLANS for hot fix (will move to database later)
    QUICK_PLANS = {
        "indoor_daily": {
            "name": "Indoor Daily",
            "type": "indoor",
            "price": 1500,
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
        "outdoor_weekly": {
            "name": "Outdoor Weekly",
            "type": "outdoor",
            "price": 3000,
            "sessions": 4,
            "days": 30,
        },
    }

    @staticmethod
    def create_membership(member, plan_code):
        """
        DEV NOTE: This handles ALL membership logic
        - Validates plan exists
        - Creates membership record
        - Sets up sessions/dates
        - Creates physical profiles for indoor members
        """
        plan_data = MembershipService.QUICK_PLANS.get(plan_code)
        if not plan_data:
            raise ValueError(f"Invalid plan: {plan_code}")

        # Get or create plan in database
        plan_obj = MembershipService._get_or_create_plan(plan_code, plan_data)

        # Create membership
        membership = MembershipService._create_membership_record(
            member, plan_obj, plan_data
        )

        # Indoor members get physical profiles
        if plan_data["type"] == "indoor":
            PhysicalProfile.objects.create(member=member)

        return membership

    @staticmethod
    def _create_membership_record(member, plan_obj, plan_data):
        """Create the actual membership database record"""
        from django.utils import timezone
        from datetime import timedelta

        return Membership.objects.create(
            member=member,
            plan=plan_obj,
            start_date=timezone.now().date(),
            end_date=timezone.now().date() + timedelta(days=plan_data["days"]),
            total_sessions_allowed=plan_data["sessions"],
            sessions_used=0,
            amount_paid=plan_data["price"],
            status="active",
            payment_status="pending",  # Payments app will update this
        )

    @staticmethod
    def _get_or_create_plan(plan_code, plan_data):
        """Ensure plan exists in database"""
        plan_obj, created = MembershipPlan.objects.get_or_create(
            plan_code=plan_code,
            defaults={
                "plan_name": plan_data["name"],
                "membership_type": plan_data["type"],
                "plan_type": plan_code.split("_")[1],
                "monthly_fee": plan_data["price"],
                "is_active": True,
            },
        )
        return plan_obj

    @staticmethod
    def get_available_plans():
        """Return available plans for frontend"""
        return [{"code": k, **v} for k, v in MembershipService.QUICK_PLANS.items()]

    @staticmethod
    def use_session(membership):
        """Use one session from membership"""
        if membership.sessions_used >= membership.total_sessions_allowed:
            raise ValueError("No sessions remaining")

        membership.sessions_used += 1
        membership.save()
        return membership.total_sessions_allowed - membership.sessions_used  # remaining


class MembershipPlanService:
    """Service for managing membership plans"""

    @staticmethod
    def get_all_plans():
        """Get all active membership plans"""
        return MembershipPlan.objects.filter(is_active=True)

    @staticmethod
    def get_plan_by_code(plan_code):
        """Get plan by its code"""
        return MembershipPlan.objects.filter(plan_code=plan_code, is_active=True).first()

    @staticmethod
    def get_available_plans():
        """Return available plans for frontend"""
        return MembershipService.get_available_plans()
