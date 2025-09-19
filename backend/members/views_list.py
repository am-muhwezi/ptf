from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status, permissions
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.authentication import SessionAuthentication
from django.db.models import Q, Prefetch
from .models import Member
from memberships.models import Membership
from ptf.pagination import PaginationHelper, SearchPaginationHelper
from .services import get_members_summary
from django.core.cache import cache


class MembersSummaryView(APIView):
    """
    Members summary view with authentication (following dashboard pattern)
    """

    authentication_classes = [JWTAuthentication, SessionAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            summary = get_members_summary()
            return Response(summary, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": "Could not retrieve members summary", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


def serialize_member_data_optimized(member):
    """
    Optimized serialize member data with membership info for consistent API responses.
    Uses prefetched data to avoid N+1 queries.
    """
    # Use prefetched active memberships if available - more efficient
    active_membership = None
    if hasattr(member, 'active_memberships_list') and member.active_memberships_list:
        active_membership = member.active_memberships_list[0]
    elif hasattr(member, '_prefetched_objects_cache') and 'memberships' in member._prefetched_objects_cache:
        # Use prefetched memberships to avoid additional query
        for membership in member._prefetched_objects_cache['memberships']:
            if membership.status == "active":
                active_membership = membership
                break
    else:
        # Only fallback to query if no prefetch available
        active_membership = member.memberships.filter(status="active").first()

    # Base member information - matching the model fields exactly
    member_info = {
        "id": member.id,
        "member_id": f"PTF{member.id:04d}",
        "full_name": member.full_name,  # Use the model property
        "email": member.email,
        "phone": member.phone,
        "address": member.address,
        "date_of_birth": (
            member.date_of_birth.isoformat() if member.date_of_birth else None
        ),
        "id_passport": member.id_passport,
        "blood_group": member.blood_group,
        "emergency_contact": member.emergency_contact,
        "emergency_phone": member.emergency_phone,
        "medical_conditions": member.medical_conditions,
        "status": member.status,
        "registration_date": member.registration_date.isoformat(),
        "last_visit": (
            member.last_visit.isoformat() if member.last_visit else None
        ),
        "total_visits": member.total_visits,
    }

    # Add membership information in nested structure
    if active_membership:
        member_info["membership"] = {
            "type": active_membership.plan.membership_type,
            "plan_name": active_membership.plan.plan_name,
            "plan_type": (
                active_membership.plan.plan_type
                if hasattr(active_membership.plan, "plan_type")
                else "monthly"
            ),
            "amount": (
                float(active_membership.plan.weekly_fee) if active_membership.plan.weekly_fee > 0
                else float(active_membership.plan.monthly_fee) if active_membership.plan.monthly_fee > 0
                else float(active_membership.plan.per_session_fee)
            ),
            "payment_status": active_membership.payment_status,
            "start_date": (
                active_membership.start_date.isoformat()
                if active_membership.start_date
                else None
            ),
            "end_date": (
                active_membership.end_date.isoformat()
                if active_membership.end_date
                else None
            ),
            "sessions_remaining": active_membership.total_sessions_allowed
            - active_membership.sessions_used,
        }
        # Add flat fields for backward compatibility
        member_info.update(
            {
                "membership_type": active_membership.plan.membership_type,
                "plan_type": active_membership.plan.plan_name,
                "plan_name": active_membership.plan.plan_name,
                "amount": (
                float(active_membership.plan.weekly_fee) if active_membership.plan.weekly_fee > 0
                else float(active_membership.plan.monthly_fee) if active_membership.plan.monthly_fee > 0
                else float(active_membership.plan.per_session_fee)
            ),
                "payment_status": active_membership.payment_status,
                "sessions_remaining": active_membership.total_sessions_allowed
                - active_membership.sessions_used,
            }
        )
    else:
        member_info["membership"] = None
        # Add flat fields with defaults for backward compatibility
        member_info.update(
            {
                "membership_type": "unknown",
                "plan_type": None,
                "plan_name": None,
                "amount": 0.0,
                "payment_status": "pending",
                "sessions_remaining": 0,
            }
        )

    # Add physical profile for indoor members - using prefetched data efficiently
    try:
        # Check for physical profile without triggering additional queries
        profile = getattr(member, "physical_profile", None)
        if profile:
            member_info["physical_profile"] = {
                "height": profile.height,
                "weight": profile.weight,
                "bmi": profile.bmi,
                "fitness_level": profile.fitness_level,
                "short_term_goals": profile.short_term_goals,
                "long_term_goals": profile.long_term_goals,
            }
            # Add flat fields for backward compatibility
            member_info.update({
                "height": profile.height,
                "weight": profile.weight,
                "bmi": profile.bmi,
                "fitness_level": profile.fitness_level,
                "short_term_goals": profile.short_term_goals,
                "long_term_goals": profile.long_term_goals,
            })
        else:
            member_info["physical_profile"] = None
            # Add default values for backward compatibility
            member_info.update({
                "height": None,
                "weight": None,
                "bmi": None,
                "fitness_level": None,
                "short_term_goals": None,
                "long_term_goals": None,
            })
    except Exception:
        # If physical_profile access fails, set defaults
        member_info["physical_profile"] = None
        member_info.update({
            "height": None,
            "weight": None,
            "bmi": None,
            "fitness_level": None,
            "short_term_goals": None,
            "long_term_goals": None,
        })

    return member_info


def serialize_member_data(member):
    """
    Original serialize member data - kept for backward compatibility.
    For performance-critical endpoints, use serialize_member_data_optimized.
    """
    active_membership = member.memberships.filter(status="active").first()

    # Base member information - matching the model fields exactly
    member_info = {
        "id": member.id,
        "member_id": f"PTF{member.id:04d}",
        "full_name": member.full_name,  # Use the model property
        "email": member.email,
        "phone": member.phone,
        "address": member.address,
        "date_of_birth": (
            member.date_of_birth.isoformat() if member.date_of_birth else None
        ),
        "id_passport": member.id_passport,
        "blood_group": member.blood_group,
        "emergency_contact": member.emergency_contact,
        "emergency_phone": member.emergency_phone,
        "medical_conditions": member.medical_conditions,
        "status": member.status,
        "registration_date": member.registration_date.isoformat(),
        "last_visit": (
            member.last_visit.isoformat() if member.last_visit else None
        ),
        "total_visits": member.total_visits,
    }

    # Add membership information in nested structure
    if active_membership:
        member_info["membership"] = {
            "type": active_membership.plan.membership_type,
            "plan_name": active_membership.plan.plan_name,
            "plan_type": (
                active_membership.plan.plan_type
                if hasattr(active_membership.plan, "plan_type")
                else "monthly"
            ),
            "amount": (
                float(active_membership.plan.weekly_fee) if active_membership.plan.weekly_fee > 0
                else float(active_membership.plan.monthly_fee) if active_membership.plan.monthly_fee > 0  
                else float(active_membership.plan.per_session_fee)
            ),
            "payment_status": active_membership.payment_status,
            "start_date": (
                active_membership.start_date.isoformat()
                if active_membership.start_date
                else None
            ),
            "end_date": (
                active_membership.end_date.isoformat()
                if active_membership.end_date
                else None
            ),
            "sessions_remaining": active_membership.total_sessions_allowed
            - active_membership.sessions_used,
        }
        # Add flat fields for backward compatibility
        member_info.update(
            {
                "membership_type": active_membership.plan.membership_type,
                "plan_type": active_membership.plan.plan_name,
                "plan_name": active_membership.plan.plan_name,
                "amount": (
                float(active_membership.plan.weekly_fee) if active_membership.plan.weekly_fee > 0
                else float(active_membership.plan.monthly_fee) if active_membership.plan.monthly_fee > 0  
                else float(active_membership.plan.per_session_fee)
            ),
                "payment_status": active_membership.payment_status,
                "sessions_remaining": active_membership.total_sessions_allowed
                - active_membership.sessions_used,
            }
        )
    else:
        member_info["membership"] = None
        # Add flat fields with defaults for backward compatibility
        member_info.update(
            {
                "membership_type": "unknown",
                "plan_type": None,
                "plan_name": None,
                "amount": 0.0,
                "payment_status": "pending",
                "sessions_remaining": 0,
            }
        )

    # Add physical profile for indoor members
    if hasattr(member, "physical_profile"):
        profile = member.physical_profile
        member_info["physical_profile"] = {
            "height": profile.height,
            "weight": profile.weight,
            "bmi": profile.bmi,
            "fitness_level": profile.fitness_level,
            "short_term_goals": profile.short_term_goals,
            "long_term_goals": profile.long_term_goals,
        }
        # Add flat fields for backward compatibility
        member_info.update(
            {
                "height": profile.height,
                "weight": profile.weight,
                "bmi": profile.bmi,
                "fitness_level": profile.fitness_level,
                "short_term_goals": profile.short_term_goals,
                "long_term_goals": profile.long_term_goals,
            }
        )
    else:
        member_info["physical_profile"] = None

    return member_info


@api_view(["GET"])
def list_all_members(request):
    """
    Hybrid endpoint - returns summary stats or paginated list based on 'stats' parameter
    Following dashboard pattern for stats, keeping list functionality for detailed data
    """
    try:
        # Check if requesting stats only (following dashboard pattern)
        stats_only = request.GET.get('stats', 'false').lower() == 'true'

        if stats_only:
            # Return dashboard-style stats only (like dashboard/views.py pattern)
            summary = get_members_summary()
            return Response(summary, status=200)

        # Otherwise, return paginated member list (existing functionality)
        # Get queryset with highly optimized queries to prevent N+1 problems
        queryset = Member.objects.select_related('physical_profile').prefetch_related(
            # Prefetch only active memberships with their plans and locations - most efficient
            Prefetch(
                'memberships',
                queryset=Membership.objects.filter(status='active').select_related('plan', 'location'),
                to_attr='active_memberships_list'
            )
        ).distinct()

        # Define searchable fields - optimized for performance
        search_fields = ['first_name', 'other_names', 'last_name', 'email', 'phone']

        # Use pagination helper with search functionality
        response = SearchPaginationHelper.search_and_paginate(
            request=request,
            queryset=queryset,
            search_fields=search_fields,
            data_serializer_func=serialize_member_data_optimized,
            success_message=None,  # Will auto-generate
            default_page_size=20
        )

        # Add summary stats to the paginated response for dashboard-style UI
        summary = get_members_summary()
        response.data['summary'] = summary

        return response

    except Exception as e:
        return Response({"error": str(e)}, status=500)


def serialize_indoor_member_data(member):
    """Serialize indoor member data for API responses."""
    membership = member.memberships.filter(status="active").first()

    member_info = {
        "id": member.id,
        "name": member.full_name,
        "phone": member.phone,
        "email": member.email,
        "plan_name": membership.plan.plan_name if membership else None,
        "payment_status": membership.payment_status if membership else None,
        "sessions_remaining": (
            (membership.total_sessions_allowed - membership.sessions_used)
            if membership
            else 0
        ),
        "has_physical_profile": hasattr(member, "physical_profile"),
    }

    # Add physical profile info if exists
    if hasattr(member, "physical_profile"):
        profile = member.physical_profile
        member_info.update(
            {
                "height": profile.height,
                "weight": profile.weight,
                "fitness_level": profile.fitness_level,
            }
        )

    return member_info


@api_view(["GET"])
def list_indoor_members(request):
    """List only indoor members with pagination and search"""
    try:
        queryset = (
            Member.objects.filter(
                memberships__plan__membership_type="indoor",
                memberships__status="active",
            )
            .distinct()
            .select_related()
            .prefetch_related("memberships__plan", "physical_profile")
        )

        search_fields = ['email', 'phone']
        
        response = SearchPaginationHelper.search_and_paginate(
            request=request,
            queryset=queryset,
            search_fields=search_fields,
            data_serializer_func=serialize_indoor_member_data,
            success_message="Retrieved indoor members successfully",
            default_page_size=20
        )
        
        # Add backward compatibility field
        response.data['indoor_members'] = response.data['data']
        
        return response

    except Exception as e:
        return Response({"error": str(e)}, status=500)


def serialize_outdoor_member_data(member):
    """Serialize outdoor member data for API responses."""
    membership = member.memberships.filter(status="active").first()

    member_info = {
        "id": member.id,
        "name": member.full_name,
        "phone": member.phone,
        "email": member.email,
        "plan_name": membership.plan.plan_name if membership else None,
        "payment_status": membership.payment_status if membership else None,
        "sessions_remaining": (
            (membership.total_sessions_allowed - membership.sessions_used)
            if membership
            else 0
        ),
        "location": (
            membership.location.name
            if membership and membership.location
            else None
        ),
    }

    return member_info


@api_view(["GET"])
def list_outdoor_members(request):
    """List only outdoor members with pagination and search"""
    try:
        queryset = (
            Member.objects.filter(
                memberships__plan__membership_type="outdoor",
                memberships__status="active",
            )
            .distinct()
            .select_related()
            .prefetch_related("memberships__plan")
        )

        search_fields = ['email', 'phone']
        
        response = SearchPaginationHelper.search_and_paginate(
            request=request,
            queryset=queryset,
            search_fields=search_fields,
            data_serializer_func=serialize_outdoor_member_data,
            success_message="Retrieved outdoor members successfully",
            default_page_size=20
        )
        
        # Add backward compatibility field
        response.data['outdoor_members'] = response.data['data']
        
        return response

    except Exception as e:
        return Response({"error": str(e)}, status=500)
