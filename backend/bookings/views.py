from .models import Booking
from rest_framework import status, viewsets
from rest_framework.decorators import api_view, action, permission_classes
from rest_framework.response import Response
from rest_framework import serializers
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.authentication import SessionAuthentication
from django.shortcuts import get_object_or_404
from rest_framework.request import Request
from .serializers import BookingSerializer
from ptf.permissions import IsStaffOrSuperUser, CustomModelPermissions


@api_view(http_method_names=["GET", "POST"])
@permission_classes([IsStaffOrSuperUser])
def homepage(request: Request):
    """
    Home view for the bookings app - Staff and Superuser only.
    """
    if request.method == "POST":
        data = request.data
        response = {"message": "Data received successfully", "data": data}
        return Response(data=response, status=status.HTTP_201_CREATED)
    response = {"message": "Welcome to the Bookings App!"}
    return Response(data=response, status=status.HTTP_200_OK)


class BookingViewSet(viewsets.ModelViewSet):
    """
    View to list and create bookings.
    
    Permissions:
    - Staff: Can view and create bookings
    - Superuser: Full CRUD access to bookings
    """

    authentication_classes = [JWTAuthentication, SessionAuthentication]
    permission_classes = [CustomModelPermissions]
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer

    @action(detail=True, methods=["post"])
    def confirm(self, request, pk=None):
        """
        Custom action to confirm a booking.
        """
        booking = self.get_object()
        if booking.status != "pending":
            return Response(
                {"detail": "Only pending can be confirmed."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        booking.status = "confirmed"
        booking.save()

        serializer = self.get_serializer(booking)
        return Response(
            {
                "detail": "Booking confirmed successfully.",
                "booking": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        """
        Custom action to cancel a booking.
        """
        booking = self.get_object()

        if booking.status in ["cancelled", "completed"]:
            return Response(
                {"error": f"cannot cancel {booking.status} booking"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        booking.status = "cancelled"
        booking.save()
        serializer = self.get_serializer(booking)
        return Response(
            {
                "detail": "Booking cancelled successfully.",
                "booking": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        """
        Custom action to complete a booking.
        """
        booking = self.get_object()

        if booking.status != "confirmed":
            return Response(
                {"error": "Only confirmed bookings can be completed."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        booking.status = "completed"
        booking.save()
        serializer = self.get_serializer(booking)
        return Response(
            {
                "detail": "Booking completed successfully.",
                "booking": serializer.data,
            },
            status=status.HTTP_200_OK,
        )
