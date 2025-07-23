from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework import status, viewsets
from rest_framework.decorators import api_view, action
from rest_framework.pagination import PageNumberPagination
from .models import Member
from .serializers import MemberSerializer
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.conf import settings
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)


class MemberPagination(PageNumberPagination):
    """Custom pagination for member searches."""

    page_size = 10
    page_size_query_param = "limit"
    max_page_size = 50


@api_view(http_method_names=["GET", "POST"])
def homepage(request: Request):
    """
    Home view for the members app.
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
    """

    queryset = Member.objects.all().order_by("id")
    serializer_class = MemberSerializer
    pagination_class = MemberPagination

    def get_queryset(self):
        """
        Overrides the default queryset to handle search queries directly on the list view.
        This allows `GET /members/?q=...` to work for searching.
        """
        queryset = super().get_queryset()
        query = self.request.query_params.get("q")
        if query:
            return queryset.filter(
                Q(first_name__icontains=query)
                | Q(last_name__icontains=query)
                | Q(email__icontains=query)
                | Q(id__icontains=query)
            ).distinct()
        return queryset

    @action(detail=True, methods=["post"])
    def checkin(self, request: Request, pk: int = None):
        """
        Check-in a member by ID.
        """
        member = get_object_or_404(Member, pk=pk)
        logger.info(f"Check-in attempt for member ID: {pk}")

        if not member.active:
            logger.warning(f"Check-in denied for inactive member: {member.id}")
            return Response(
                {
                    "error": f"Cannot check in {member.first_name}. Status is '{member.status}'."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if getattr(member, "checked_in", False):
            logger.info(f"Member {member.id} already checked in.")
            return Response(
                {"message": f"{member.first_name} is already checked in."},
                status=status.HTTP_200_OK,
            )

        member.checked_in = True
        if hasattr(member, "last_checkin_time"):
            member.last_checkin_time = timezone.now()
        member.save()

        logger.info("Successfully checked in member: %s", member.id)
        return Response(    
            {
                "message": f"{member.first_name} {member.last_name} checked in successfully.",
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"])
    def checkout(self, request: Request, pk: int = None):
        """
        Check-out a member by ID.
        """
        member = get_object_or_404(Member, pk=pk)
        logger.info(f"Check-out attempt for member ID: {pk}")

        if not getattr(member, "checked_in", False):
            return Response(
                {"message": f"{member.first_name} is not currently checked in."},
                status=status.HTTP_200_OK,
            )

        member.checked_in = False
        if hasattr(member, "last_checkout_time"):
            member.last_checkout_time = timezone.now()
        member.save()

        logger.info(f"Successfully checked out member: {member.id}")
        serializer = self.get_serializer(member)
        return Response(
            {
                "message": f"{member.first_name} checked out successfully.",
                "member": serializer.data,
            },
            status=status.HTTP_200_OK,
        )
