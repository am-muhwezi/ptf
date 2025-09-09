from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Q
from .models import Member
from memberships.models import Membership


@api_view(["GET"])
def list_all_members(request):
    """
    DEV NOTE: This shows ALL members with their membership info
    """
    try:
        members = Member.objects.select_related().prefetch_related("memberships__plan")

        members_data = []
        for member in members:
            active_membership = member.memberships.filter(status="active").first()

            # Base member information - matching the model fields exactly
            member_info = {
                "id": member.id,
                "member_id": f"PTF{member.id:04d}",
                "first_name": member.first_name,
                "last_name": member.last_name,
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

            members_data.append(member_info)

        return Response(
            {
                "success": True,
                "data": members_data,
                "count": len(members_data),
                "message": f"Retrieved {len(members_data)} members successfully",
            }
        )

    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(["GET"])
def list_indoor_members(request):
    """List only indoor members"""
    try:
        indoor_members = (
            Member.objects.filter(
                memberships__plan__membership_type="indoor",
                memberships__status="active",
            )
            .distinct()
            .select_related()
            .prefetch_related("memberships__plan", "physical_profile")
        )

        members_data = []
        for member in indoor_members:
            membership = member.memberships.filter(status="active").first()

            member_info = {
                "id": member.id,
                "name": f"{member.first_name} {member.last_name}",
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

            members_data.append(member_info)

        return Response(
            {
                "success": True,
                "indoor_members": members_data,
                "count": len(members_data),
            }
        )

    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(["GET"])
def list_outdoor_members(request):
    """List only outdoor members"""
    try:
        outdoor_members = (
            Member.objects.filter(
                memberships__plan__membership_type="outdoor",
                memberships__status="active",
            )
            .distinct()
            .select_related()
            .prefetch_related("memberships__plan")
        )

        members_data = []
        for member in outdoor_members:
            membership = member.memberships.filter(status="active").first()

            member_info = {
                "id": member.id,
                "name": f"{member.first_name} {member.last_name}",
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

            members_data.append(member_info)

        return Response(
            {
                "success": True,
                "outdoor_members": members_data,
                "count": len(members_data),
            }
        )

    except Exception as e:
        return Response({"error": str(e)}, status=500)
