"""
Membership business logic services

This module contains all business logic related to memberships,
separated from models and views for better maintainability.
"""

import logging
from django.utils import timezone
from django.db.models import Q, Sum, Count
from decimal import Decimal
from typing import Dict, Any, Optional, List, Tuple

from .models import Membership, MembershipPlan, SessionLog
from members.models import Member, Location

logger = logging.getLogger(__name__)


class MembershipService:
    """Service class for membership business logic"""

    @staticmethod
    def create_membership(
        member: Member,
        plan: MembershipPlan,
        start_date,
        end_date,
        location: Optional[Location] = None,
        amount_paid: Optional[Decimal] = None
    ) -> Membership:
        """
        Create a new membership with proper validation and setup
        
        Args:
            member: Member instance
            plan: MembershipPlan instance
            start_date: Membership start date
            end_date: Membership end date
            location: Location for outdoor memberships
            amount_paid: Amount paid for the membership
            
        Returns:
            Created Membership instance
            
        Raises:
            ValueError: If validation fails
        """
        # Validate outdoor memberships require location
        if plan.membership_type == 'outdoor' and not location:
            raise ValueError("Outdoor memberships require a location")
            
        # Calculate total sessions allowed based on plan
        total_sessions = MembershipService.calculate_total_sessions(plan, start_date, end_date)
        
        # Use plan's appropriate fee if amount not specified
        if amount_paid is None:
            if plan.plan_type == 'daily':
                amount_paid = plan.per_session_fee
            elif plan.plan_type in ['weekly', '1_session_week', '2_sessions_week', '3_sessions_week', '4_sessions_week', '5_sessions_week']:
                amount_paid = plan.weekly_fee
            else:
                amount_paid = plan.monthly_fee
        
        membership = Membership.objects.create(
            member=member,
            plan=plan,
            location=location,
            start_date=start_date,
            end_date=end_date,
            total_sessions_allowed=total_sessions,
            amount_paid=amount_paid,
            payment_status='pending'
        )
        
        logger.info(f"Created membership {membership.id} for member {member.id}")
        return membership

    @staticmethod
    def calculate_total_sessions(plan: MembershipPlan, start_date, end_date) -> int:
        """
        Calculate total sessions allowed based on plan and duration
        
        Args:
            plan: MembershipPlan instance
            start_date: Membership start date
            end_date: Membership end date
            
        Returns:
            Total sessions allowed
        """
        if plan.plan_type == 'daily':
            return 1  # Single drop-in session
        
        # Calculate weeks between dates
        duration_days = (end_date - start_date).days
        duration_weeks = max(1, duration_days // 7)
        
        return plan.sessions_per_week * duration_weeks

    @staticmethod
    def use_session(membership: Membership, session_type: str = 'regular', notes: str = '') -> Tuple[bool, str]:
        """
        Use a session from a membership (check-in)
        
        Args:
            membership: Membership instance
            session_type: Type of session being used
            notes: Optional notes for the session
            
        Returns:
            Tuple of (success: bool, message: str)
        """
        # Validate membership status
        if membership.status != 'active':
            return False, f'Cannot use session. Membership status is {membership.status}.'
        
        # Check if membership is expired
        if membership.is_expired:
            return False, 'Membership has expired.'
        
        # Check if sessions are available
        if membership.sessions_remaining <= 0:
            return False, 'No sessions remaining in this membership.'
        
        try:
            # Use the session (atomic operation)
            membership.sessions_used += 1
            membership.save()
            
            # Create session log
            session_log = SessionLog.objects.create(
                membership=membership,
                session_type=session_type,
                notes=notes
            )
            
            # Update member's visit tracking
            membership.member.total_visits += 1
            membership.member.last_visit = timezone.now()
            membership.member.save()
            
            logger.info(f"Session used for membership {membership.id}, {membership.sessions_remaining} sessions remaining")
            
            return True, f'Session used successfully. {membership.sessions_remaining} sessions remaining.'
            
        except Exception as e:
            logger.error(f"Error using session for membership {membership.id}: {e}")
            return False, 'Failed to use session. Please try again.'

    @staticmethod
    def suspend_membership(membership: Membership, reason: str = '') -> Tuple[bool, str]:
        """
        Suspend a membership
        
        Args:
            membership: Membership instance to suspend
            reason: Optional reason for suspension
            
        Returns:
            Tuple of (success: bool, message: str)
        """
        if membership.status == 'suspended':
            return False, 'Membership is already suspended.'
        
        try:
            membership.status = 'suspended'
            membership.save()
            
            logger.info(f"Membership {membership.id} suspended. Reason: {reason}")
            return True, f'Membership for {membership.member.full_name} has been suspended.'
            
        except Exception as e:
            logger.error(f"Error suspending membership {membership.id}: {e}")
            return False, 'Failed to suspend membership.'

    @staticmethod
    def reactivate_membership(membership: Membership) -> Tuple[bool, str]:
        """
        Reactivate a suspended membership
        
        Args:
            membership: Membership instance to reactivate
            
        Returns:
            Tuple of (success: bool, message: str)
        """
        if membership.status != 'suspended':
            return False, f'Cannot reactivate membership with status: {membership.status}'
        
        # Check if membership would be expired
        if membership.end_date < timezone.now().date():
            return False, 'Cannot reactivate expired membership. Please renew instead.'
        
        try:
            membership.status = 'active'
            membership.save()
            
            logger.info(f"Membership {membership.id} reactivated")
            return True, f'Membership for {membership.member.full_name} has been reactivated.'
            
        except Exception as e:
            logger.error(f"Error reactivating membership {membership.id}: {e}")
            return False, 'Failed to reactivate membership.'

    @staticmethod
    def get_membership_statistics(membership_type: Optional[str] = None) -> Dict[str, Any]:
        """
        Calculate membership statistics
        
        Args:
            membership_type: Filter by membership type ('indoor' or 'outdoor')
            
        Returns:
            Dictionary containing statistics
        """
        queryset = Membership.objects.all()
        
        if membership_type:
            queryset = queryset.filter(plan__membership_type=membership_type)
        
        today = timezone.now().date()
        current_month = timezone.now().month
        current_year = timezone.now().year
        
        # Basic counts
        total_memberships = queryset.count()
        active_memberships = queryset.filter(status='active').count()
        new_this_month = queryset.filter(
            created_at__month=current_month,
            created_at__year=current_year
        ).count()
        
        # Expiring soon (within 7 days or <=3 sessions)
        expiring_soon = 0
        for membership in queryset.filter(status='active'):
            if membership.is_expiring_soon:
                expiring_soon += 1
        
        # Revenue calculation
        total_revenue = queryset.filter(status='active').aggregate(
            total=Sum('amount_paid')
        )['total'] or Decimal('0')
        
        # Sessions used today
        sessions_used_today = SessionLog.objects.filter(
            date_used__date=today
        )
        
        if membership_type:
            sessions_used_today = sessions_used_today.filter(
                membership__plan__membership_type=membership_type
            )
        
        sessions_used_today_count = sessions_used_today.count()
        
        return {
            'total_memberships': total_memberships,
            'active_memberships': active_memberships,
            'expiring_soon': expiring_soon,
            'new_this_month': new_this_month,
            'total_revenue': float(total_revenue),
            'sessions_used_today': sessions_used_today_count
        }

    @staticmethod
    def search_memberships(
        search_query: Optional[str] = None,
        membership_type: Optional[str] = None,
        status_filter: Optional[str] = None
    ) -> Q:
        """
        Build search query for memberships
        
        Args:
            search_query: Search term for member details
            membership_type: Filter by membership type
            status_filter: Filter by membership status
            
        Returns:
            Q object for filtering memberships
        """
        filters = Q()
        
        if membership_type:
            filters &= Q(plan__membership_type=membership_type)
        
        if status_filter and status_filter != 'all':
            filters &= Q(status=status_filter)
        
        if search_query:
            search_filters = (
                Q(member__first_name__icontains=search_query) |
                Q(member__last_name__icontains=search_query) |
                Q(member__email__icontains=search_query) |
                Q(member__phone__icontains=search_query) |
                Q(location__name__icontains=search_query) |
                Q(plan__plan_name__icontains=search_query)
            )
            filters &= search_filters
        
        return filters

    @staticmethod
    def get_expiring_memberships(days_ahead: int = 7) -> List[Membership]:
        """
        Get memberships expiring within specified days
        
        Args:
            days_ahead: Number of days to look ahead
            
        Returns:
            List of expiring memberships
        """
        future_date = timezone.now().date() + timezone.timedelta(days=days_ahead)
        
        expiring_memberships = []
        active_memberships = Membership.objects.filter(
            status='active',
            end_date__lte=future_date
        )
        
        for membership in active_memberships:
            if membership.is_expiring_soon:
                expiring_memberships.append(membership)
        
        return expiring_memberships


class MembershipPlanService:
    """Service class for membership plan business logic"""

    @staticmethod
    def get_available_plans(membership_type: Optional[str] = None) -> List[MembershipPlan]:
        """
        Get available membership plans
        
        Args:
            membership_type: Filter by membership type
            
        Returns:
            List of available plans
        """
        queryset = MembershipPlan.objects.filter(is_active=True)
        
        if membership_type:
            queryset = queryset.filter(membership_type=membership_type)
        
        return list(queryset.order_by('membership_type', 'sessions_per_week'))

    @staticmethod
    def validate_plan_pricing(plan: MembershipPlan) -> Tuple[bool, List[str]]:
        """
        Validate plan pricing configuration
        
        Args:
            plan: MembershipPlan instance
            
        Returns:
            Tuple of (is_valid: bool, errors: List[str])
        """
        errors = []
        
        # Check that at least one fee is set
        if (plan.weekly_fee <= 0 and 
            plan.monthly_fee <= 0 and 
            plan.per_session_fee <= 0):
            errors.append("At least one fee must be greater than zero")
        
        # Validate plan type and fee alignment
        if plan.plan_type == 'daily' and plan.per_session_fee <= 0:
            errors.append("Daily plans must have a per-session fee")
        
        if plan.plan_type in ['weekly', '1_session_week', '2_sessions_week', 
                             '3_sessions_week', '4_sessions_week', '5_sessions_week'] and plan.weekly_fee <= 0:
            errors.append("Weekly-based plans must have a weekly fee")
        
        if plan.plan_type in ['monthly', 'quarterly', 'annual'] and plan.monthly_fee <= 0:
            errors.append("Monthly-based plans must have a monthly fee")
        
        return len(errors) == 0, errors