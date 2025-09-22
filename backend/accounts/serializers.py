from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from .models import User


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""

    password = serializers.CharField(
        write_only=True, min_length=6, validators=[validate_password]
    )
    confirm_password = serializers.CharField(write_only=True)
    first_name = serializers.CharField(required=True, max_length=30)
    last_name = serializers.CharField(required=True, max_length=30)

    class Meta:
        model = User
        fields = [
            "email",
            "username",
            "password",
            "confirm_password",
            "first_name",
            "last_name",
        ]
        extra_kwargs = {
            "email": {"required": True},
            "username": {"required": True},
        }

    def validate(self, attrs):
        """Validate password confirmation"""
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError("Passwords don't match")
        return attrs

    def validate_email(self, value):
        """Check if email already exists"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("User with this email already exists")
        return value

    def create(self, validated_data):
        """Create new admin user and send verification email"""
        validated_data.pop("confirm_password")

        # Create user as inactive initially
        user = User.objects.create_user(**validated_data)
        user.is_active = False  # User must verify email first
        user.save()

        # Send verification email
        self._send_verification_email(user)

        return user

    def _send_verification_email(self, user):
        """Send verification email to new admin user"""
        verification_url = f"{settings.FRONTEND_URL}/verify-email?token={user.email_verification_token}"

        subject = 'Verify Your Admin Access - Paul\'s Tropical Fitness'

        html_message = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #065f46, #0f766e, #0891b2); color: white; padding: 30px; text-align: center;">
                <h1 style="margin: 0; font-size: 28px;">🏝️ Paul's Tropical Fitness</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Admin Access Verification</p>
            </div>

            <div style="padding: 30px; background: #f8fafc;">
                <h2 style="color: #065f46; margin-top: 0;">Verify Your Admin Access</h2>

                <p>Hi {user.first_name},</p>

                <p>You've been granted admin access to the Paul's Tropical Fitness management system. Please verify your email address to activate your admin account.</p>

                <div style="text-align: center; margin: 30px 0;">
                    <a href="{verification_url}"
                       style="background: linear-gradient(135deg, #10b981, #14b8a6);
                              color: white;
                              padding: 15px 30px;
                              text-decoration: none;
                              border-radius: 8px;
                              font-weight: bold;
                              display: inline-block;">
                        Verify Admin Access
                    </a>
                </div>

                <p style="color: #6b7280; font-size: 14px;">
                    If you didn't request admin access, please contact the system administrator immediately.
                </p>

                <p style="color: #6b7280; font-size: 14px;">
                    This verification link will remain valid until you verify your email.
                </p>

                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

                <p style="color: #6b7280; font-size: 12px; text-align: center;">
                    © 2025 Paul's Tropical Fitness. All rights reserved.
                </p>
            </div>
        </div>
        """

        plain_message = f"""
        Paul's Tropical Fitness - Admin Access Verification

        Hi {user.first_name},

        You've been granted admin access to the Paul's Tropical Fitness management system. Please verify your email address to activate your admin account.

        Please click the link below to verify your admin access:
        {verification_url}

        If you didn't request admin access, please contact the system administrator immediately.

        © 2025 Paul's Tropical Fitness. All rights reserved.
        """

        try:
            print(f"📧 Attempting to send verification email to: {user.email}")
            result = send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=False,
            )
            print(f"📧 Email send result: {result}")
            print(f"✅ Verification email sent successfully to {user.email}")
        except Exception as e:
            print(f"❌ Error sending verification email: {e}")
            print(f"❌ Error type: {type(e).__name__}")
            import traceback
            traceback.print_exc()


class UserLoginSerializer(serializers.Serializer):
    """Serializer for user login"""

    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True)

    def validate(self, attrs):
        """Authenticate user"""
        email = attrs.get("email")
        password = attrs.get("password")

        if email and password:
            user = authenticate(
                request=self.context.get("request"), username=email, password=password
            )

            if not user:
                raise serializers.ValidationError("Invalid email or password")

            if not user.is_active:
                raise serializers.ValidationError("User account is disabled")

            attrs["user"] = user
            return attrs
        else:
            raise serializers.ValidationError("Must include email and password")


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile"""

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "username",
            "first_name",
            "last_name",
            "is_active",
            "date_joined",
        ]
        read_only_fields = ["id", "email", "date_joined"]


class PasswordChangeSerializer(serializers.Serializer):
    """Serializer for password change"""

    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(
        required=True, min_length=6, validators=[validate_password]
    )
    confirm_password = serializers.CharField(required=True)

    def validate_old_password(self, value):
        """Check if old password is correct"""
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect")
        return value

    def validate(self, attrs):
        """Validate new password confirmation"""
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError("New passwords don't match")
        return attrs

    def save(self):
        """Change user password"""
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.save()
        return user


class AdminUserSerializer(serializers.ModelSerializer):
    """Serializer for admin user management"""
    
    password = serializers.CharField(write_only=True, min_length=6, required=False)
    role = serializers.SerializerMethodField()
    last_login_formatted = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'is_staff', 'is_superuser', 'is_active', 'date_joined',
            'last_login', 'password', 'role', 'last_login_formatted'
        ]
        read_only_fields = ['id', 'date_joined', 'last_login']
        
    def get_role(self, obj):
        """Get user role based on permissions"""
        if obj.is_superuser:
            return 'Super Admin'
        elif obj.is_staff:
            return 'Admin'
        else:
            return 'User'
    
    def get_last_login_formatted(self, obj):
        """Get formatted last login date"""
        if obj.last_login:
            return obj.last_login.strftime('%Y-%m-%d %H:%M:%S')
        return 'Never'
    
    def validate_email(self, value):
        """Check if email already exists (except for current user)"""
        if self.instance:
            # Update case - exclude current user from uniqueness check
            if User.objects.filter(email=value).exclude(id=self.instance.id).exists():
                raise serializers.ValidationError("User with this email already exists")
        else:
            # Create case - check if email exists
            if User.objects.filter(email=value).exists():
                raise serializers.ValidationError("User with this email already exists")
        return value
    
    def create(self, validated_data):
        """Create new admin user"""
        password = validated_data.pop('password', None)
        user = User(**validated_data)
        
        if password:
            user.set_password(password)
        else:
            # Set a temporary password if none provided
            user.set_password('TempPass123!')
            
        user.save()
        return user
    
    def update(self, instance, validated_data):
        """Update admin user"""
        password = validated_data.pop('password', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        if password:
            instance.set_password(password)
            
        instance.save()
        return instance


class ForgotPasswordSerializer(serializers.Serializer):
    """Serializer for forgot password request"""
    
    email = serializers.EmailField(required=True)
    
    def validate_email(self, value):
        """Check if user with email exists"""
        try:
            user = User.objects.get(email=value, is_active=True)
            return value
        except User.DoesNotExist:
            # Don't reveal if email exists or not for security
            # But still validate the format
            return value
    
    def save(self):
        """Send password reset email"""
        email = self.validated_data['email']
        
        try:
            user = User.objects.get(email=email, is_active=True)
            
            # Generate token
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            
            # Create reset URL
            reset_url = f"{settings.FRONTEND_URL}/password-reset?token={token}&uid={uid}&email={email}"
            
            # Email content
            subject = 'Password Reset - Paul\'s Tropical Fitness'
            
            html_message = f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #065f46, #0f766e, #0891b2); color: white; padding: 30px; text-align: center;">
                    <h1 style="margin: 0; font-size: 28px;">🏝️ Paul's Tropical Fitness</h1>
                    <p style="margin: 10px 0 0 0; opacity: 0.9;">Password Reset Request</p>
                </div>
                
                <div style="padding: 30px; background: #f8fafc;">
                    <h2 style="color: #065f46; margin-top: 0;">Reset Your Password</h2>
                    
                    <p>Hi {user.first_name},</p>
                    
                    <p>We received a request to reset your password for your Paul's Tropical Fitness account.</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{reset_url}" 
                           style="background: linear-gradient(135deg, #10b981, #14b8a6); 
                                  color: white; 
                                  padding: 15px 30px; 
                                  text-decoration: none; 
                                  border-radius: 8px; 
                                  font-weight: bold;
                                  display: inline-block;">
                            Reset Password
                        </a>
                    </div>
                    
                    <p style="color: #6b7280; font-size: 14px;">
                        If you didn't request this password reset, you can safely ignore this email. 
                        Your password will remain unchanged.
                    </p>
                    
                    <p style="color: #6b7280; font-size: 14px;">
                        This link will expire in 24 hours for security reasons.
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                    
                    <p style="color: #6b7280; font-size: 12px; text-align: center;">
                        © 2024 Paul's Tropical Fitness. All rights reserved.
                    </p>
                </div>
            </div>
            """
            
            plain_message = f"""
            Paul's Tropical Fitness - Password Reset
            
            Hi {user.first_name},
            
            We received a request to reset your password for your account.
            
            Please click the link below to reset your password:
            {reset_url}
            
            If you didn't request this password reset, you can safely ignore this email.
            This link will expire in 24 hours for security reasons.
            
            © 2024 Paul's Tropical Fitness. All rights reserved.
            """
            
            # Send email
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                html_message=html_message,
                fail_silently=False,
            )
            
            return True
            
        except User.DoesNotExist:
            # Don't reveal if email exists or not
            return True
        except Exception as e:
            # Log the error but don't reveal it
            print(f"Error sending password reset email: {e}")
            return False


class PasswordResetSerializer(serializers.Serializer):
    """Serializer for password reset confirmation"""
    
    token = serializers.CharField(required=True)
    uid = serializers.CharField(required=True)
    password = serializers.CharField(
        required=True, min_length=8, validators=[validate_password]
    )
    confirm_password = serializers.CharField(required=True)
    
    def validate(self, attrs):
        """Validate token and passwords"""
        # Check if passwords match
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError("Passwords don't match")
        
        # Validate token
        try:
            uid = force_str(urlsafe_base64_decode(attrs['uid']))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            raise serializers.ValidationError("Invalid reset link")
        
        if not default_token_generator.check_token(user, attrs['token']):
            raise serializers.ValidationError("Invalid or expired reset link")
        
        attrs['user'] = user
        return attrs
    
    def save(self):
        """Reset user password"""
        user = self.validated_data['user']
        password = self.validated_data['password']

        user.set_password(password)
        user.save()

        return user


class EmailVerificationSerializer(serializers.Serializer):
    """Serializer for admin email verification"""

    token = serializers.UUIDField(required=True)

    def validate_token(self, value):
        """Validate verification token"""
        try:
            user = User.objects.get(email_verification_token=value, is_active=False)
            return value
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid or expired verification token")

    def save(self):
        """Verify admin email and activate account"""
        token = self.validated_data['token']
        user = User.objects.get(email_verification_token=token, is_active=False)

        user.email_verified = True
        user.is_active = True
        user.generate_verification_token()  # Generate new token for security
        user.save()

        return user


class ResendVerificationSerializer(serializers.Serializer):
    """Serializer for resending admin verification email"""

    email = serializers.EmailField(required=True)

    def validate_email(self, value):
        """Check if admin user exists and is not verified"""
        try:
            user = User.objects.get(email=value)
            if user.email_verified and user.is_active:
                raise serializers.ValidationError("Email is already verified")
            return value
        except User.DoesNotExist:
            raise serializers.ValidationError("No account found with this email")

    def save(self):
        """Resend admin verification email"""
        email = self.validated_data['email']
        user = User.objects.get(email=email)

        # Generate new verification token
        user.generate_verification_token()

        # Create verification URL
        verification_url = f"{settings.FRONTEND_URL}/verify-email?token={user.email_verification_token}"

        # Email content
        subject = 'Verify Your Admin Access - Paul\'s Tropical Fitness'

        html_message = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #065f46, #0f766e, #0891b2); color: white; padding: 30px; text-align: center;">
                <h1 style="margin: 0; font-size: 28px;">🏝️ Paul's Tropical Fitness</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Admin Access Verification</p>
            </div>

            <div style="padding: 30px; background: #f8fafc;">
                <h2 style="color: #065f46; margin-top: 0;">Verify Your Admin Access</h2>

                <p>Hi {user.first_name},</p>

                <p>You've been granted admin access to the Paul's Tropical Fitness management system. Please verify your email address to activate your admin account.</p>

                <div style="text-align: center; margin: 30px 0;">
                    <a href="{verification_url}"
                       style="background: linear-gradient(135deg, #10b981, #14b8a6);
                              color: white;
                              padding: 15px 30px;
                              text-decoration: none;
                              border-radius: 8px;
                              font-weight: bold;
                              display: inline-block;">
                        Verify Admin Access
                    </a>
                </div>

                <p style="color: #6b7280; font-size: 14px;">
                    If you didn't request admin access, please contact the system administrator immediately.
                </p>

                <p style="color: #6b7280; font-size: 14px;">
                    This verification link will remain valid until you verify your email.
                </p>

                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

                <p style="color: #6b7280; font-size: 12px; text-align: center;">
                    © 2025 Paul's Tropical Fitness. All rights reserved.
                </p>
            </div>
        </div>
        """

        plain_message = f"""
        Paul's Tropical Fitness - Admin Access Verification

        Hi {user.first_name},

        You've been granted admin access to the Paul's Tropical Fitness management system. Please verify your email address to activate your admin account.

        Please click the link below to verify your admin access:
        {verification_url}

        If you didn't request admin access, please contact the system administrator immediately.

        © 2025 Paul's Tropical Fitness. All rights reserved.
        """

        # Send email
        try:
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                html_message=html_message,
                fail_silently=False,
            )
            return True
        except Exception as e:
            print(f"Error sending verification email: {e}")
            return False
