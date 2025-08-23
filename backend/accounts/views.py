from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.decorators import api_view, permission_classes
from django.contrib.auth import logout
from django.db import transaction, IntegrityError
from django.core.exceptions import ValidationError
import time
import logging
import uuid
from ptf.permissions import IsSuperUser
from .serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    UserProfileSerializer,
    PasswordChangeSerializer,
    ForgotPasswordSerializer,
    PasswordResetSerializer,
)
from .models import User

# Set up logger for better debugging
logger = logging.getLogger(__name__)


class RegisterView(APIView):

    def post(self, request):
        try:
            with transaction.atomic():
                serializer = UserRegistrationSerializer(data=request.data)

                if serializer.is_valid():
                    user = serializer.save()
                    time.sleep(0.1)
                    refresh = RefreshToken.for_user(user)

                    response_data = {
                        "message": f"{user.first_name} {user.last_name} registered successfully",
                        "access": str(refresh.access_token),
                        "refresh": str(refresh),
                        "user": {
                            "id": user.id,
                            "email": user.email,
                            "first_name": user.first_name,
                            "last_name": user.last_name,
                            "firstName": user.first_name,
                            "lastName": user.last_name,
                            "username": user.username,
                        },
                    }
                    return Response(response_data, status=status.HTTP_201_CREATED)
                else:
                    # Handle specific validation errors with clear messages
                    errors = serializer.errors

                    # Check for specific error types
                    if "email" in errors:
                        if any(
                            "already exists" in str(error) for error in errors["email"]
                        ):
                            return Response(
                                {
                                    "error": "EMAIL_ALREADY_EXISTS",
                                    "message": "A user with this email address already exists",
                                    "field": "email",
                                    "value": request.data.get("email"),
                                },
                                status=status.HTTP_400_BAD_REQUEST,
                            )

                    if "username" in errors:
                        if any(
                            "already exists" in str(error)
                            for error in errors["username"]
                        ):
                            return Response(
                                {
                                    "error": "USERNAME_ALREADY_EXISTS",
                                    "message": "This username is already taken",
                                    "field": "username",
                                    "value": request.data.get("username"),
                                },
                                status=status.HTTP_400_BAD_REQUEST,
                            )

                    # Check for missing required fields
                    missing_fields = []
                    for field in [
                        "email",
                        "username",
                        "password",
                        "first_name",
                        "last_name",
                    ]:
                        if field in errors and any(
                            "required" in str(error) for error in errors[field]
                        ):
                            missing_fields.append(field)

                    if missing_fields:
                        return Response(
                            {
                                "error": "MISSING_REQUIRED_FIELDS",
                                "message": f"Missing required fields: {', '.join(missing_fields)}",
                                "missing_fields": missing_fields,
                                "provided_fields": list(request.data.keys()),
                            },
                            status=status.HTTP_400_BAD_REQUEST,
                        )

                    # Password validation errors
                    if "password" in errors:
                        return Response(
                            {
                                "error": "INVALID_PASSWORD",
                                "message": "Password does not meet requirements",
                                "password_errors": errors["password"],
                            },
                            status=status.HTTP_400_BAD_REQUEST,
                        )

                    # Password mismatch
                    if "non_field_errors" in errors:
                        if any(
                            "don't match" in str(error)
                            for error in errors["non_field_errors"]
                        ):
                            return Response(
                                {
                                    "error": "PASSWORD_MISMATCH",
                                    "message": "Password and confirm_password do not match",
                                },
                                status=status.HTTP_400_BAD_REQUEST,
                            )

                    # Generic validation error fallback
                    return Response(
                        {
                            "error": "VALIDATION_FAILED",
                            "message": "Request validation failed",
                            "details": errors,
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )
        except Exception as e:
            return Response(
                {
                    "error": "Registration failed due to server error",
                    "message": "Please try again later",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        try:
            serializer = UserLoginSerializer(
                data=request.data, context={"request": request}
            )

            if serializer.is_valid():
                user = serializer.validated_data["user"]
                refresh = RefreshToken.for_user(user)

                response_data = {
                    "message": f"{user.first_name} {user.last_name} logged in successfully",
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                    "user": {
                        "id": user.id,
                        "email": user.email,
                        "first_name": user.first_name,
                        "last_name": user.last_name,
                        "firstName": user.first_name,
                        "lastName": user.last_name,
                        "username": user.username,
                        "is_staff": user.is_staff,
                        "is_superuser": user.is_superuser,
                    },
                }
                return Response(response_data, status=status.HTTP_200_OK)
            else:
                return Response(
                    {
                        "error": "Login failed",
                        "message": "Invalid email or password",
                        "details": serializer.errors,
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except Exception as e:
            return Response(
                {
                    "error": "Login failed due to server error",
                    "message": "Please try again later",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def user_info(request):
    try:
        user = request.user
        return Response(
            {
                "id": user.id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "firstName": user.first_name,
                "lastName": user.last_name,
                "username": user.username,
                "is_staff": user.is_staff,
                "is_superuser": user.is_superuser,
                "is_active": user.is_active,
                "date_joined": user.date_joined,
            },
            status=status.HTTP_200_OK,
        )
    except Exception as e:
        return Response(
            {
                "error": "Failed to retrieve user information",
                "message": "Please try again later",
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh_token")
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()

            logout(request)
            return Response({"message": "Logout successful"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST
            )


class ProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request):
        serializer = UserProfileSerializer(
            request.user, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Profile updated successfully", "user": serializer.data},
                status=status.HTTP_200_OK,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordChangeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PasswordChangeSerializer(
            data=request.data, context={"request": request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Password changed successfully"}, status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ForgotPasswordView(APIView):
    """View for handling forgot password requests"""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        try:
            serializer = ForgotPasswordSerializer(data=request.data)

            if serializer.is_valid():
                email_sent = serializer.save()

                # Always return success for security reasons
                # Don't reveal if email exists or not
                return Response(
                    {
                        "message": "If an account with this email exists, password reset instructions have been sent.",
                        "email": request.data.get("email"),
                    },
                    status=status.HTTP_200_OK,
                )
            else:
                return Response(
                    {"error": "Invalid email format", "details": serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        except Exception as e:
            return Response(
                {
                    "error": "Failed to process password reset request",
                    "message": "Please try again later",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class PasswordResetView(APIView):
    """View for handling password reset confirmation"""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        try:
            serializer = PasswordResetSerializer(data=request.data)

            if serializer.is_valid():
                user = serializer.save()

                return Response(
                    {
                        "message": f"Password reset successful for {user.email}",
                        "user": {
                            "id": user.id,
                            "email": user.email,
                            "first_name": user.first_name,
                            "last_name": user.last_name,
                        },
                    },
                    status=status.HTTP_200_OK,
                )
            else:
                return Response(
                    {"error": "Password reset failed", "details": serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        except Exception as e:
            return Response(
                {
                    "error": "Failed to reset password",
                    "message": "Please try again or request a new reset link",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


@api_view(["GET", "POST", "PUT", "DELETE"])
@permission_classes([IsSuperUser])
def user_management(request, user_id=None):
    """
    User management endpoints - Superuser only
    GET: List all users or get specific user
    POST: Create new user (same as register but for internal use)
    PUT: Update user roles (staff/superuser status)
    DELETE: Deactivate user (soft delete)
    """
    try:
        if request.method == "GET":
            if user_id:
                # Get specific user
                from django.shortcuts import get_object_or_404

                user = get_object_or_404(User, id=user_id)
                return Response(
                    {
                        "id": user.id,
                        "email": user.email,
                        "first_name": user.first_name,
                        "last_name": user.last_name,
                        "username": user.username,
                        "is_staff": user.is_staff,
                        "is_superuser": user.is_superuser,
                        "is_active": user.is_active,
                        "date_joined": user.date_joined,
                    },
                    status=status.HTTP_200_OK,
                )
            else:
                # List all users
                users = User.objects.all().order_by("-date_joined")
                users_data = [
                    {
                        "id": user.id,
                        "email": user.email,
                        "first_name": user.first_name,
                        "last_name": user.last_name,
                        "username": user.username,
                        "is_staff": user.is_staff,
                        "is_superuser": user.is_superuser,
                        "is_active": user.is_active,
                        "date_joined": user.date_joined,
                    }
                    for user in users
                ]
                return Response(
                    {"users": users_data, "count": len(users_data)},
                    status=status.HTTP_200_OK,
                )

        elif request.method == "PUT" and user_id:
            # Update user roles
            from django.shortcuts import get_object_or_404

            user = get_object_or_404(User, id=user_id)

            # Prevent superuser from removing their own superuser status
            if user.id == request.user.id and not request.data.get(
                "is_superuser", True
            ):
                return Response(
                    {"error": "Cannot remove superuser status from yourself"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Update role fields
            if "is_staff" in request.data:
                user.is_staff = request.data["is_staff"]
            if "is_superuser" in request.data:
                user.is_superuser = request.data["is_superuser"]
            if "is_active" in request.data:
                user.is_active = request.data["is_active"]

            user.save()

            return Response(
                {
                    "message": f"User {user.email} roles updated successfully",
                    "user": {
                        "id": user.id,
                        "email": user.email,
                        "is_staff": user.is_staff,
                        "is_superuser": user.is_superuser,
                        "is_active": user.is_active,
                    },
                },
                status=status.HTTP_200_OK,
            )

        elif request.method == "DELETE" and user_id:
            # Deactivate user (soft delete)
            from django.shortcuts import get_object_or_404

            user = get_object_or_404(User, id=user_id)

            # Prevent superuser from deactivating themselves
            if user.id == request.user.id:
                return Response(
                    {"error": "Cannot deactivate yourself"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            user.is_active = False
            user.save()

            return Response(
                {"message": f"User {user.email} has been deactivated"},
                status=status.HTTP_200_OK,
            )

        else:
            return Response(
                {"error": "Method not allowed for this endpoint"},
                status=status.HTTP_405_METHOD_NOT_ALLOWED,
            )

    except Exception as e:
        return Response(
            {"error": "User management operation failed", "message": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
