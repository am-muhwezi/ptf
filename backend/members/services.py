"""
Member business logic services

This module contains all business logic related to members,
separated from models and views for better maintainability.
"""

from django.utils import timezone
from django.db.models import Q, Count, Avg
from django.core.exceptions import ValidationError
from typing import Dict, Any, Optional, List, Tuple
from decimal import Decimal

from .models import Member, Location, PhysicalProfile



class MemberService:
    """Service class for member business logic"""

    @staticmethod
    def create_member(
        first_name: str,
        last_name: str,
        email: Optional[str] = None,
        phone: Optional[str] = None,
        **kwargs
    ) -> Member:
        """
        Create a new member with proper validation
        
        Args:
            first_name: Member's first name
            last_name: Member's last name
            email: Member's email (optional)
            phone: Member's phone (optional)
            **kwargs: Additional member fields
            
        Returns:
            Created Member instance
            
        Raises:
            ValidationError: If validation fails
        """
        # Validate required fields
        if not first_name or not last_name:
            raise ValidationError("First name and last name are required")
        
        # Validate email uniqueness if provided
        if email and Member.objects.filter(email=email).exists():
            raise ValidationError(f"Member with email {email} already exists")
        
        # Validate ID/Passport uniqueness if provided
        id_passport = kwargs.get('id_passport')
        if id_passport and Member.objects.filter(id_passport=id_passport).exists():
            raise ValidationError(f"Member with ID/Passport {id_passport} already exists")
        
        member = Member.objects.create(
            first_name=first_name,
            last_name=last_name,
            email=email,
            phone=phone,
            **kwargs
        )
        
        return member

    @staticmethod
    def update_visit_tracking(member: Member) -> None:
        """
        Update member's visit count and last visit date
        
        Args:
            member: Member instance to update
        """
        try:
            member.total_visits += 1
            member.last_visit = timezone.now()
            member.save(update_fields=['total_visits', 'last_visit'])
            
            
        except Exception as e:
            raise

    @staticmethod
    def check_member_eligibility(member: Member, membership_type: str) -> Tuple[bool, str]:
        """
        Check if member is eligible for a specific membership type
        
        Args:
            member: Member instance
            membership_type: Type of membership ('indoor' or 'outdoor')
            
        Returns:
            Tuple of (is_eligible: bool, message: str)
        """
        if member.status != 'active':
            return False, f"Member status is {member.status}"
        
        # Check for medical restrictions if indoor membership
        if membership_type == 'indoor':
            if member.medical_conditions:
                # This could be expanded to check specific conditions
                return True, "Medical conditions noted - requires assessment"
        
        # Check for active memberships of same type
        active_memberships = member.memberships.filter(
            status='active',
            plan__membership_type=membership_type
        ).count()
        
        if active_memberships > 0:
            return False, f"Member already has active {membership_type} membership"
        
        return True, "Member is eligible"

    @staticmethod
    def get_member_statistics(member: Member) -> Dict[str, Any]:
        """
        Get comprehensive statistics for a member
        
        Args:
            member: Member instance
            
        Returns:
            Dictionary containing member statistics
        """
        # Basic stats
        stats = {
            'total_visits': member.total_visits,
            'last_visit': member.last_visit,
            'registration_date': member.registration_date,
            'member_since_days': (timezone.now().date() - member.registration_date.date()).days,
        }
        
        # Membership stats
        memberships = member.memberships.all()
        stats.update({
            'total_memberships': memberships.count(),
            'active_memberships': memberships.filter(status='active').count(),
            'total_spent': sum(m.amount_paid for m in memberships),
        })
        
        # Session stats from all memberships
        from memberships.models import SessionLog
        session_logs = SessionLog.objects.filter(membership__member=member)
        stats.update({
            'total_sessions_used': session_logs.count(),
            'sessions_this_month': session_logs.filter(
                date_used__month=timezone.now().month,
                date_used__year=timezone.now().year
            ).count(),
        })
        
        # Physical profile stats (if indoor member)
        if hasattr(member, 'physical_profile'):
            profile = member.physical_profile
            stats.update({
                'has_physical_profile': True,
                'fitness_level': profile.fitness_level,
                'bmi': profile.bmi,
                'height': profile.height,
                'weight': profile.weight,
            })
        else:
            stats['has_physical_profile'] = False
        
        return stats

    @staticmethod
    def search_members(
        search_query: Optional[str] = None,
        status_filter: Optional[str] = None,
        membership_type: Optional[str] = None
    ) -> Q:
        """
        Build search query for members
        
        Args:
            search_query: Search term for member details
            status_filter: Filter by member status
            membership_type: Filter by membership type
            
        Returns:
            Q object for filtering members
        """
        filters = Q()
        
        if status_filter and status_filter != 'all':
            filters &= Q(status=status_filter)
        
        if membership_type:
            filters &= Q(memberships__plan__membership_type=membership_type)
        
        if search_query:
            # Handle full name search by splitting the query
            search_terms = search_query.strip().split()
            
            if len(search_terms) >= 2:
                # For multi-word searches, try full name combinations
                full_name_filters = Q()
                for i in range(len(search_terms)):
                    for j in range(i + 1, len(search_terms) + 1):
                        partial_name = ' '.join(search_terms[i:j])
                        full_name_filters |= (
                            Q(first_name__icontains=partial_name) |
                            Q(last_name__icontains=partial_name)
                        )
                
                # Also try first name + last name combination
                first_term = search_terms[0]
                last_term = search_terms[-1]
                full_name_filters |= (
                    Q(first_name__icontains=first_term) & Q(last_name__icontains=last_term)
                )
                
                search_filters = full_name_filters
            else:
                # Single word search - search all relevant fields
                search_filters = (
                    Q(first_name__icontains=search_query) |
                    Q(last_name__icontains=search_query) |
                    Q(email__icontains=search_query) |
                    Q(phone__icontains=search_query) |
                    Q(id_passport__icontains=search_query)
                )
            
            # Also include other fields for any search
            search_filters |= (
                Q(email__icontains=search_query) |
                Q(phone__icontains=search_query) |
                Q(id_passport__icontains=search_query)
            )
            
            filters &= search_filters
        
        return filters

    @staticmethod
    def get_member_activity_summary(member: Member, days: int = 30) -> Dict[str, Any]:
        """
        Get member activity summary for specified period
        
        Args:
            member: Member instance
            days: Number of days to look back
            
        Returns:
            Dictionary containing activity summary
        """
        from memberships.models import SessionLog
        
        start_date = timezone.now() - timezone.timedelta(days=days)
        
        session_logs = SessionLog.objects.filter(
            membership__member=member,
            date_used__gte=start_date
        )
        
        return {
            'period_days': days,
            'sessions_in_period': session_logs.count(),
            'unique_session_types': list(
                session_logs.values_list('session_type', flat=True).distinct()
            ),
            'average_sessions_per_week': round(session_logs.count() / max(1, days / 7), 1),
            'most_recent_session': session_logs.first().date_used if session_logs.exists() else None,
        }


class PhysicalProfileService:
    """Service class for physical profile business logic"""

    @staticmethod
    def create_or_update_profile(
        member: Member,
        height: Optional[float] = None,
        weight: Optional[float] = None,
        **kwargs
    ) -> PhysicalProfile:
        """
        Create or update physical profile for a member
        
        Args:
            member: Member instance
            height: Height in cm
            weight: Weight in kg
            **kwargs: Additional profile fields
            
        Returns:
            PhysicalProfile instance
        """
        profile, created = PhysicalProfile.objects.get_or_create(
            member=member,
            defaults={
                'height': height,
                'weight': weight,
                **kwargs
            }
        )
        
        if not created:
            # Update existing profile
            for field, value in kwargs.items():
                if hasattr(profile, field) and value is not None:
                    setattr(profile, field, value)
            
            if height is not None:
                profile.height = height
            if weight is not None:
                profile.weight = weight
            
            profile.save()
        
        return profile

    @staticmethod
    def calculate_fitness_metrics(profile: PhysicalProfile) -> Dict[str, Any]:
        """
        Calculate various fitness metrics from physical profile
        
        Args:
            profile: PhysicalProfile instance
            
        Returns:
            Dictionary containing calculated metrics
        """
        metrics = {}
        
        # BMI calculation
        if profile.height and profile.weight:
            height_m = profile.height / 100
            bmi = profile.weight / (height_m * height_m)
            metrics['bmi'] = round(bmi, 1)
            
            # BMI category
            if bmi < 18.5:
                metrics['bmi_category'] = 'Underweight'
            elif bmi < 25:
                metrics['bmi_category'] = 'Normal'
            elif bmi < 30:
                metrics['bmi_category'] = 'Overweight'
            else:
                metrics['bmi_category'] = 'Obese'
        
        # Body fat percentage assessment
        if profile.body_fat_percentage:
            bf_percent = profile.body_fat_percentage
            metrics['body_fat_percentage'] = bf_percent
            
            # General categories (can be refined by gender/age)
            if bf_percent < 10:
                metrics['body_fat_category'] = 'Essential Fat'
            elif bf_percent < 20:
                metrics['body_fat_category'] = 'Athlete'
            elif bf_percent < 25:
                metrics['body_fat_category'] = 'Fitness'
            else:
                metrics['body_fat_category'] = 'Above Average'
        
        return metrics

    @staticmethod
    def validate_measurements(height: Optional[float], weight: Optional[float]) -> Tuple[bool, List[str]]:
        """
        Validate physical measurements
        
        Args:
            height: Height in cm
            weight: Weight in kg
            
        Returns:
            Tuple of (is_valid: bool, errors: List[str])
        """
        errors = []
        
        if height is not None:
            if height <= 0 or height > 300:  # 3 meters max
                errors.append("Height must be between 1cm and 300cm")
        
        if weight is not None:
            if weight <= 0 or weight > 500:  # 500kg max
                errors.append("Weight must be between 1kg and 500kg")
        
        return len(errors) == 0, errors


class LocationService:
    """Service class for location business logic"""

    @staticmethod
    def get_available_locations() -> List[Location]:
        """
        Get all available locations
        
        Returns:
            List of Location instances
        """
        return list(Location.objects.all().order_by('name'))

    @staticmethod
    def get_location_statistics(location: Location) -> Dict[str, Any]:
        """
        Get statistics for a specific location
        
        Args:
            location: Location instance
            
        Returns:
            Dictionary containing location statistics
        """
        from memberships.models import Membership
        
        memberships = Membership.objects.filter(location=location)
        
        return {
            'total_members': memberships.count(),
            'active_members': memberships.filter(status='active').count(),
            'total_revenue': sum(m.amount_paid for m in memberships.filter(status='active')),
            'average_membership_value': memberships.filter(status='active').aggregate(
                avg=Avg('amount_paid')
            )['avg'] or 0,
        }

    @staticmethod
    def validate_location_code(code: str, exclude_id: Optional[int] = None) -> bool:
        """
        Validate location code uniqueness
        
        Args:
            code: Location code to validate
            exclude_id: Location ID to exclude from check (for updates)
            
        Returns:
            True if code is unique, False otherwise
        """
        query = Location.objects.filter(code=code)
        
        if exclude_id:
            query = query.exclude(id=exclude_id)
        
        return not query.exists()