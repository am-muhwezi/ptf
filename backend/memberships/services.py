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
    def use_session(membership, session_type="regular", notes=""):
        """Use one session from membership"""
        if membership.sessions_used >= membership.total_sessions_allowed:
            return False, "No sessions remaining"

        membership.sessions_used += 1
        membership.save()
        
        # Create session log if needed
        # TODO: Implement session logging
        
        return True, f"Session used successfully. {membership.sessions_remaining} sessions remaining."

    @staticmethod
    def search_memberships(search_query=None, membership_type=None, status_filter=None):
        """
        Build filters for membership search
        Returns Q object for filtering memberships
        """
        from django.db.models import Q
        
        filters = Q()
        
        if search_query:
            # Search in member name, email, or membership ID
            filters &= (
                Q(member__first_name__icontains=search_query) |
                Q(member__last_name__icontains=search_query) |
                Q(member__email__icontains=search_query) |
                Q(id__icontains=search_query)
            )
        
        if membership_type:
            filters &= Q(plan__membership_type=membership_type)
            
        if status_filter:
            filters &= Q(status=status_filter)
            
        return filters

    @staticmethod
    def get_membership_statistics(membership_type=None):
        """Get membership statistics with caching"""
        from django.db.models import Count, Sum
        from django.utils import timezone
        from django.core.cache import cache
        from datetime import timedelta

        # Create cache key based on membership type
        cache_key = f"membership_stats_{membership_type or 'all'}"
        cached_data = cache.get(cache_key)

        if cached_data is not None:
            return cached_data

        # Base queryset
        memberships = Membership.objects.all()

        # Filter by type if specified
        if membership_type:
            memberships = memberships.filter(plan__membership_type=membership_type)

        # Calculate stats
        total_memberships = memberships.count()
        active_memberships = memberships.filter(status='active').count()

        # Expiring soon (within 7 days)
        week_from_now = timezone.now().date() + timedelta(days=7)
        expiring_soon = memberships.filter(
            end_date__lte=week_from_now,
            end_date__gt=timezone.now().date(),
            status='active'
        ).count()

        # Revenue calculation
        total_revenue = memberships.filter(
            status='active'
        ).aggregate(total=Sum('amount_paid'))['total'] or 0
        
        # Sessions used today
        today = timezone.now().date()
        sessions_used_today = 0  # TODO: Calculate from session logs when implemented

        # Prepare result
        result = {
            'total_memberships': total_memberships,
            'active_memberships': active_memberships,
            'expiring_soon': expiring_soon,
            'new_this_month': memberships.filter(
                created_at__month=timezone.now().month,
                created_at__year=timezone.now().year
            ).count(),
            'total_revenue': float(total_revenue),
            'sessions_used_today': sessions_used_today
        }

        # Cache for 5 minutes (300 seconds)
        cache.set(cache_key, result, 300)

        return result


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
