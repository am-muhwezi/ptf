from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework import status, viewsets
from rest_framework.decorators import api_view, action, permission_classes
from rest_framework.pagination import PageNumberPagination
from rest_framework.exceptions import ValidationError
from rest_framework import permissions
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.authentication import SessionAuthentication
from .models import Member
from .serializers import MemberSerializer
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.conf import settings
from django.utils import timezone
from django.db import IntegrityError
from ptf.permissions import IsStaffOrSuperUser, IsSuperUser, CustomModelPermissions


class MemberPagination(PageNumberPagination):
    """Custom pagination for member searches."""

    page_size = 10  # Reduce page size for better search UX
    page_size_query_param = "limit"
    max_page_size = 50  # Reduce max page size to prevent large queries


@api_view(http_method_names=["GET", "POST"])
@permission_classes([IsStaffOrSuperUser])
def homepage(request: Request):
    """
    Home view for the members app.
    Requires staff or superuser permissions.
    """
    if request.method == "POST":
        data = request.data
        response = {"message": "Data received successfully", "data": data}
        return Response(data=response, status=status.HTTP_201_CREATED)

    response = {"message": "Welcome to the Members App!"}
    return Response(data=response, status=status.HTTP_200_OK)


class MemberViewset(viewsets.ModelViewSet):
    """
    View to list, create, search, and manage members.

    Permissions:
    - Staff: Can view and create members
    - Superuser: Full access (CRUD operations)
    """

    authentication_classes = [JWTAuthentication, SessionAuthentication]

    queryset = (
        Member.objects.prefetch_related("memberships__plan")
        .select_related()
        .order_by("id")
    )
    serializer_class = MemberSerializer
    pagination_class = MemberPagination

    def get_location(self, location_name):
        """Get or create location based on location name"""
        if not location_name:
            return None

        # Try to find existing location
        from .models import Location

        location, created = Location.objects.get_or_create(
            name=location_name.title(),
            defaults={"code": location_name.lower().replace(" ", "_")},
        )
        return location

    def create(self, request, *args, **kwargs):
        """
        Create a new member with detailed error handling
        """
        try:
            serializer = self.get_serializer(data=request.data)

            if not serializer.is_valid():
                # Return detailed field-level errors
                errors = serializer.errors
                error_messages = []

                for field, field_errors in errors.items():
                    if isinstance(field_errors, list):
                        for error in field_errors:
                            if field == "non_field_errors":
                                error_messages.append(str(error))
                            else:
                                field_name = field.replace("_", " ").title()
                                error_messages.append(f"{field_name}: {error}")
                    else:
                        field_name = field.replace("_", " ").title()
                        error_messages.append(f"{field_name}: {field_errors}")

                return Response(
                    {
                        "error": "Validation failed",
                        "message": (
                            "; ".join(error_messages)
                            if error_messages
                            else "Please check the form and correct any errors."
                        ),
                        "field_errors": errors,
                        "details": errors,  # Also include raw errors for debugging
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Try to save the member
            member = serializer.save()

            # Create membership based on form data
            plan_type = request.data.get("plan_type")
            if plan_type:
                from memberships.models import MembershipPlan, Membership
                from datetime import datetime, timedelta
                from decimal import Decimal

                try:
                    # Get membership type from the request data
                    membership_type = request.data.get("membership_type", "indoor")

                    # Find the appropriate membership plan
                    plan = MembershipPlan.objects.get(
                        membership_type=membership_type, plan_type=plan_type
                    )

                    # Calculate membership duration (1 month)
                    start_date = datetime.now().date()
                    end_date = start_date + timedelta(days=30)  # 1 month

                    # Calculate total sessions for the period
                    if plan.plan_type == "daily":
                        # For daily plans, allow unlimited sessions (or set a high number)
                        total_sessions = 30  # 1 session per day for a month
                    else:
                        # For weekly plans, calculate based on sessions per week
                        total_sessions = (
                            plan.sessions_per_week * 4
                        )  # 4 weeks in a month

                    # Create the membership
                    membership = Membership.objects.create(
                        member=member,
                        plan=plan,
                        status="active",
                        payment_status="pending",  # Default to pending
                        total_sessions_allowed=total_sessions,
                        sessions_used=0,
                        start_date=start_date,
                        end_date=end_date,
                        amount_paid=plan.monthly_fee,
                        location=(
                            self.get_location(request.data.get("location"))
                            if membership_type == "outdoor"
                            else None
                        ),
                    )

                except MembershipPlan.DoesNotExist:
                    return Response(
                        {
                            "error": "Membership plan not found",
                            "message": f"No membership plan found for type: {membership_type} and plan: {plan_type}",
                        },
                        status=status.HTTP_404_NOT_FOUND,
                    )
            return Response(
                {
                    "message": f"Member {member.first_name} {member.last_name} registered successfully!",
                    "member": serializer.data,
                },
                status=status.HTTP_201_CREATED,
            )

        except IntegrityError as e:
            error_message = "A member with this information already exists"
            if "email" in str(e).lower():
                error_message = "A member with this email address already exists"
            elif "phone" in str(e).lower():
                error_message = "A member with this phone number already exists"

            return Response(
                {"error": "Duplicate member", "message": error_message},
                status=status.HTTP_400_BAD_REQUEST,
            )

        except ValidationError as e:
            return Response(
                {"error": "Validation error", "message": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        except Exception as e:
            return Response(
                {
                    "error": "Internal server error",
                    "message": "An unexpected error occurred while creating the member. Please try again.",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def destroy(self, request, *args, **kwargs):
        """
        Delete a member - Superuser only (handled by CustomModelPermissions)
        """
        try:
            member = self.get_object()
            member_name = f"{member.first_name} {member.last_name}"
            member.delete()

            return Response(
                {"message": f"Member {member_name} has been deleted successfully."},
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            return Response(
                {
                    "error": "Delete failed",
                    "message": "Failed to delete member. Please try again.",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def get_queryset(self):
        """
        Overrides the default queryset to handle search queries directly on the list view.
        Optimized with proper indexing and query efficiency.
        """
        queryset = super().get_queryset()
        query = self.request.query_params.get("q")
        
        if query:
            # Only search if query is at least 2 characters to reduce database load
            if len(query.strip()) < 2:
                return queryset.none()
            
            query = query.strip()
            
            # Start with the most specific searches first for better performance
            q_objects = Q()
            
            # Exact ID match (highest priority)
            if query.isdigit():
                q_objects |= Q(id=query)
            
            # Email exact match (high priority)
            if '@' in query:
                q_objects |= Q(email__iexact=query)
            
            # Name searches (use istartswith for better index usage)
            q_objects |= Q(first_name__istartswith=query)
            q_objects |= Q(last_name__istartswith=query)
            q_objects |= Q(email__istartswith=query)
            
            # Fallback to contains search for partial matches
            q_objects |= Q(first_name__icontains=query)
            q_objects |= Q(last_name__icontains=query)

            return queryset.filter(q_objects).distinct()
        return queryset
