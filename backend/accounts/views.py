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
from .serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    UserProfileSerializer,
    PasswordChangeSerializer,
    ForgotPasswordSerializer,
    PasswordResetSerializer,
    EmailVerificationSerializer,
    ResendVerificationSerializer,
)
from .models import User

# Set up logger for better debugging
logger = logging.getLogger(__name__)


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        try:
            with transaction.atomic():
                serializer = UserRegistrationSerializer(data=request.data)

                if serializer.is_valid():
                    user = serializer.save()
                    # Set all new users as staff by default
                    user.is_staff = True
                    user.save()
                    time.sleep(0.1)

                    response_data = {
                        "message": f"Admin account created for {user.first_name} {user.last_name}. Please check your email to verify your account before logging in.",
                        "email_sent": True,
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
                            "is_active": user.is_active,
                            "email_verified": user.email_verified,
                        },
                    }
                    return Response(response_data, status=status.HTTP_201_CREATED)
                else:
                    # Handle specific validation errors with clear messages
                    errors = serializer.errors
                    
                    # Check for specific error types
                    if 'email' in errors:
                        if any('already exists' in str(error) for error in errors['email']):
                            return Response({
                                "error": "EMAIL_ALREADY_EXISTS",
                                "message": "A user with this email address already exists",
                                "field": "email",
                                "value": request.data.get('email')
                            }, status=status.HTTP_400_BAD_REQUEST)
                    
                    if 'username' in errors:
                        if any('already exists' in str(error) for error in errors['username']):
                            return Response({
                                "error": "USERNAME_ALREADY_EXISTS", 
                                "message": "This username is already taken",
                                "field": "username",
                                "value": request.data.get('username')
                            }, status=status.HTTP_400_BAD_REQUEST)
                    
                    # Check for missing required fields
                    missing_fields = []
                    for field in ['email', 'username', 'password', 'first_name', 'last_name']:
                        if field in errors and any('required' in str(error) for error in errors[field]):
                            missing_fields.append(field)
                    
                    if missing_fields:
                        return Response({
                            "error": "MISSING_REQUIRED_FIELDS",
                            "message": f"Missing required fields: {', '.join(missing_fields)}",
                            "missing_fields": missing_fields,
                            "provided_fields": list(request.data.keys())
                        }, status=status.HTTP_400_BAD_REQUEST)
                    
                    # Password validation errors
                    if 'password' in errors:
                        return Response({
                            "error": "INVALID_PASSWORD",
                            "message": "Password does not meet requirements",
                            "password_errors": errors['password']
                        }, status=status.HTTP_400_BAD_REQUEST)
                    
                    # Password mismatch
                    if 'non_field_errors' in errors:
                        if any("don't match" in str(error) for error in errors['non_field_errors']):
                            return Response({
                                "error": "PASSWORD_MISMATCH",
                                "message": "Password and confirm_password do not match"
                            }, status=status.HTTP_400_BAD_REQUEST)
                    
                    # Generic validation error fallback
                    return Response({
                        "error": "VALIDATION_FAILED",
                        "message": "Request validation failed",
                        "details": errors
                    }, status=status.HTTP_400_BAD_REQUEST)
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

                # Update last_login timestamp
                from django.utils import timezone
                user.last_login = timezone.now()
                user.save(update_fields=['last_login'])

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
                        "email": request.data.get('email')
                    },
                    status=status.HTTP_200_OK
                )
            else:
                return Response(
                    {
                        "error": "Invalid email format",
                        "details": serializer.errors
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            return Response(
                {
                    "error": "Failed to process password reset request",
                    "message": "Please try again later"
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
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
                            "last_name": user.last_name
                        }
                    },
                    status=status.HTTP_200_OK
                )
            else:
                return Response(
                    {
                        "error": "Password reset failed",
                        "details": serializer.errors
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            return Response(
                {
                    "error": "Failed to reset password",
                    "message": "Please try again or request a new reset link"
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class EmailVerificationView(APIView):
    """View for handling email verification"""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        """Handle GET request from email link"""
        try:
            token = request.query_params.get('token')
            if not token:
                return Response(
                    {
                        "error": "Missing verification token",
                        "message": "Invalid verification link"
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Use the same serializer logic
            serializer = EmailVerificationSerializer(data={'token': token})

            if serializer.is_valid():
                user = serializer.save()

                # Check if user was already verified
                if user.email_verified and user.is_active:
                    message = f"Email already verified for {user.email}. Admin account is active."
                else:
                    message = f"Email verified successfully for {user.email}. Admin account is now active."

                return Response(
                    {
                        "success": True,
                        "message": message,
                        "user": {
                            "id": user.id,
                            "email": user.email,
                            "first_name": user.first_name,
                            "last_name": user.last_name,
                            "is_active": user.is_active,
                            "email_verified": user.email_verified,
                        }
                    },
                    status=status.HTTP_200_OK
                )
            else:
                return Response(
                    {
                        "success": False,
                        "error": "Email verification failed",
                        "details": serializer.errors
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        except Exception as e:
            return Response(
                {
                    "success": False,
                    "error": "Failed to verify email",
                    "message": "Please try again or request a new verification link"
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def post(self, request):
        """Handle POST request for programmatic verification"""
        try:
            serializer = EmailVerificationSerializer(data=request.data)

            if serializer.is_valid():
                user = serializer.save()

                # Check if user was already verified
                if user.email_verified and user.is_active:
                    message = f"Email already verified for {user.email}. Admin account is active."
                else:
                    message = f"Email verified successfully for {user.email}. Admin account is now active."

                return Response(
                    {
                        "success": True,
                        "message": message,
                        "user": {
                            "id": user.id,
                            "email": user.email,
                            "first_name": user.first_name,
                            "last_name": user.last_name,
                            "is_active": user.is_active,
                            "email_verified": user.email_verified,
                        }
                    },
                    status=status.HTTP_200_OK
                )
            else:
                return Response(
                    {
                        "success": False,
                        "error": "Email verification failed",
                        "details": serializer.errors
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        except Exception as e:
            return Response(
                {
                    "success": False,
                    "error": "Failed to verify email",
                    "message": "Please try again or request a new verification link"
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ResendVerificationView(APIView):
    """View for resending verification email"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        try:
            serializer = ResendVerificationSerializer(data=request.data)

            if serializer.is_valid():
                email_sent = serializer.save()

                return Response(
                    {
                        "message": "If an unverified admin account exists with this email, a new verification link has been sent.",
                        "email": request.data.get('email'),
                        "email_sent": email_sent
                    },
                    status=status.HTTP_200_OK
                )
            else:
                return Response(
                    {
                        "error": "Invalid email or account already verified",
                        "details": serializer.errors
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        except Exception as e:
            return Response(
                {
                    "error": "Failed to resend verification email",
                    "message": "Please try again later"
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
