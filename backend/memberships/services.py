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
        """Use one session from membership with validation"""
        # Check payment status first
        if membership.payment_status == 'pending':
            return False, "Cannot check-in: Payment is still pending. Please complete payment first."

        if membership.payment_status == 'overdue':
            return False, "Cannot check-in: Payment is overdue. Please update payment to continue."

        # Check membership status
        if membership.status != 'active':
            return False, f"Cannot check-in: Membership is {membership.status}."

        # Check sessions remaining
        if membership.sessions_used >= membership.total_sessions_allowed:
            return False, "No sessions remaining on this membership."

        # Check if membership is expired
        if membership.is_expired:
            return False, "Membership has expired. Please renew to continue."

        # All validations passed - proceed with session usage
        with transaction.atomic():
            membership.sessions_used += 1
            membership.save()

            # Create session log entry
            from .models import SessionLog
            SessionLog.objects.create(
                membership=membership,
                session_type=session_type,
                notes=notes
            )

            # Create attendance log entry for the attendance page
            from attendance.models import AttendanceLog, Attendance
            from django.utils import timezone

            # Get member's registration location
            member_location = None
            if membership.location:
                member_location = membership.location.name

            attendance_log = AttendanceLog.objects.create(
                member=membership.member,
                visit_type=membership.plan.membership_type,  # 'indoor' or 'outdoor'
                check_in_time=timezone.now(),
                status='checked_in',
                activities=[member_location] if member_location else [],
                notes=notes
            )

            # Update daily attendance record
            daily_attendance = Attendance.get_or_create_today(membership.member)
            daily_attendance.update_visit_count(membership.plan.membership_type)
            daily_attendance.set_active_status(True)

            # Update member's last visit
            membership.member.last_visit = timezone.now()
            membership.member.total_visits += 1
            membership.member.save()

        # Clear related cache entries
        MembershipService.clear_stats_cache(membership.plan.membership_type)

        return True, f"Check-in successful! {membership.sessions_remaining} sessions remaining."

    @staticmethod
    def search_memberships(search_query=None, membership_type=None, status_filter=None, location_filter=None):
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

        if location_filter:
            # Filter by location code for outdoor memberships
            filters &= Q(location__code=location_filter)

        return filters

    @staticmethod
    def get_membership_statistics(membership_type=None, location_filter=None):
        """Get membership statistics with caching and location filtering"""
        from django.db.models import Count, Sum, Q
        from django.utils import timezone
        from django.core.cache import cache
        from datetime import timedelta

        # Create cache key based on membership type and location
        cache_key = f"membership_stats_{membership_type or 'all'}_{location_filter or 'all'}"
        cached_data = cache.get(cache_key)

        if cached_data is not None:
            return cached_data

        # Base queryset with optimized select_related
        memberships = Membership.objects.select_related('plan', 'location')

        # Filter by type if specified
        if membership_type:
            memberships = memberships.filter(plan__membership_type=membership_type)

        # Filter by location if specified
        if location_filter:
            memberships = memberships.filter(location__code=location_filter)

        # Use aggregate queries for better performance
        today = timezone.now().date()
        week_from_now = today + timedelta(days=7)
        current_month = timezone.now().month
        current_year = timezone.now().year

        stats_data = memberships.aggregate(
            total_memberships=Count('id'),
            active_memberships=Count('id', filter=Q(status='active')),
            expiring_soon=Count('id', filter=Q(
                end_date__lte=week_from_now,
                end_date__gt=today,
                status='active'
            )),
            new_this_month=Count('id', filter=Q(
                created_at__month=current_month,
                created_at__year=current_year
            )),
            total_revenue=Sum('amount_paid', filter=Q(status='active'))
        )

        # Get today's session usage from SessionLog
        from .models import SessionLog
        sessions_used_today = SessionLog.objects.filter(
            date_used__date=today
        ).count()

        # Prepare result
        result = {
            'total_memberships': stats_data['total_memberships'] or 0,
            'active_memberships': stats_data['active_memberships'] or 0,
            'expiring_soon': stats_data['expiring_soon'] or 0,
            'new_this_month': stats_data['new_this_month'] or 0,
            'total_revenue': float(stats_data['total_revenue'] or 0),
            'sessions_used_today': sessions_used_today
        }

        # Cache for 5 minutes (300 seconds)
        cache.set(cache_key, result, 300)

        return result

    @staticmethod
    def clear_stats_cache(membership_type=None):
        """Clear membership statistics cache"""
        from django.core.cache import cache

        # Clear specific cache entries
        cache_keys = [
            f"membership_stats_{membership_type or 'all'}_all",
            f"membership_stats_all_all"
        ]

        # Clear all location-specific caches for this membership type
        if membership_type:
            # Get all location codes from database
            from members.models import Location
            location_codes = Location.objects.values_list('code', flat=True)
            for location_code in location_codes:
                cache_keys.append(f"membership_stats_{membership_type}_{location_code}")

        for key in cache_keys:
            cache.delete(key)

    @staticmethod
    def suspend_membership(membership, reason=""):
        """Suspend a membership"""
        if membership.status == 'suspended':
            return False, "Membership is already suspended"

        membership.status = 'suspended'
        membership.save()

        # Clear cache
        MembershipService.clear_stats_cache(membership.plan.membership_type)

        return True, f"Membership suspended successfully. Reason: {reason}"

    @staticmethod
    def reactivate_membership(membership):
        """Reactivate a suspended membership"""
        if membership.status != 'suspended':
            return False, "Only suspended memberships can be reactivated"

        if membership.is_expired:
            return False, "Cannot reactivate expired membership"

        membership.status = 'active'
        membership.save()

        # Clear cache
        MembershipService.clear_stats_cache(membership.plan.membership_type)

        return True, "Membership reactivated successfully"


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
