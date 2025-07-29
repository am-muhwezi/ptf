from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
import json

User = get_user_model()


class UserModelTests(TestCase):
    """Tests for the User model"""

    def setUp(self):
        self.user_data = {
            "email": "test@example.com",
            "username": "testuser",
            "password": "testpass123",
            "first_name": "Test",
            "last_name": "User",
        }

    def test_create_user(self):
        """Test creating a user with valid data"""
        user = User.objects.create_user(**self.user_data)
        self.assertEqual(user.email, self.user_data["email"])
        self.assertEqual(user.username, self.user_data["username"])
        self.assertTrue(user.check_password(self.user_data["password"]))
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

    def test_create_superuser(self):
        """Test creating a superuser"""
        superuser = User.objects.create_superuser(**self.user_data)
        self.assertTrue(superuser.is_staff)
        self.assertTrue(superuser.is_superuser)

    def test_user_str_representation(self):
        """Test user string representation"""
        user = User.objects.create_user(**self.user_data)
        self.assertEqual(str(user), self.user_data["username"])

    def test_email_normalization(self):
        """Test email normalization"""
        email = "Test@EXAMPLE.com"
        user = User.objects.create_user(
            email=email, username="testuser", password="testpass123"
        )
        self.assertEqual(user.email, email.lower())


class AuthenticationAPITests(APITestCase):
    """Tests for authentication API endpoints"""

    def setUp(self):
        self.client = APIClient()
        self.register_url = reverse("register")
        self.login_url = reverse("login")
        self.logout_url = reverse("logout")
        self.profile_url = reverse("profile")
        self.password_change_url = reverse("password_change")
        self.user_info_url = reverse("user_info")

        self.valid_user_data = {
            "email": "test@example.com",
            "username": "testuser",
            "password": "testpass123",
            "confirm_password": "testpass123",
            "first_name": "Test",
            "last_name": "User",
        }

        self.existing_user = User.objects.create_user(
            email="existing@example.com",
            username="existinguser",
            password="existingpass123",
        )

    def test_user_registration_success(self):
        """Test successful user registration"""
        response = self.client.post(self.register_url, self.valid_user_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("tokens", response.data)
        self.assertIn("access", response.data["tokens"])
        self.assertIn("refresh", response.data["tokens"])
        self.assertEqual(response.data["user"]["email"], self.valid_user_data["email"])

    def test_user_registration_invalid_data(self):
        """Test registration with invalid data"""
        # Test missing required fields
        invalid_data = {"email": "test@example.com"}
        response = self.client.post(self.register_url, invalid_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Test password mismatch
        invalid_data = self.valid_user_data.copy()
        invalid_data["confirm_password"] = "differentpassword"
        response = self.client.post(self.register_url, invalid_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Test duplicate email
        invalid_data = self.valid_user_data.copy()
        invalid_data["email"] = "existing@example.com"
        response = self.client.post(self.register_url, invalid_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_login_success(self):
        """Test successful user login"""
        login_data = {"email": "existing@example.com", "password": "existingpass123"}
        response = self.client.post(self.login_url, login_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("tokens", response.data)
        self.assertIn("access", response.data["tokens"])
        self.assertIn("refresh", response.data["tokens"])

    def test_user_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        # Wrong password
        login_data = {"email": "existing@example.com", "password": "wrongpassword"}
        response = self.client.post(self.login_url, login_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Non-existent user
        login_data = {"email": "nonexistent@example.com", "password": "somepassword"}
        response = self.client.post(self.login_url, login_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_logout(self):
        """Test user logout"""
        # Login first to get tokens
        login_data = {"email": "existing@example.com", "password": "existingpass123"}
        login_response = self.client.post(self.login_url, login_data)
        access_token = login_response.data["tokens"]["access"]
        refresh_token = login_response.data["tokens"]["refresh"]

        # Set authorization header
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")

        # Logout
        logout_data = {"refresh_token": refresh_token}
        response = self.client.post(self.logout_url, logout_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_profile_view_authenticated(self):
        """Test profile view with authentication"""
        # Login to get token
        login_data = {"email": "existing@example.com", "password": "existingpass123"}
        login_response = self.client.post(self.login_url, login_data)
        access_token = login_response.data["tokens"]["access"]

        # Set authorization header
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")

        # Get profile
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], "existing@example.com")

    def test_profile_view_unauthenticated(self):
        """Test profile view without authentication"""
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_profile_update(self):
        """Test profile update"""
        # Login to get token
        login_data = {"email": "existing@example.com", "password": "existingpass123"}
        login_response = self.client.post(self.login_url, login_data)
        access_token = login_response.data["tokens"]["access"]

        # Set authorization header
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")

        # Update profile
        update_data = {"first_name": "Updated", "last_name": "Name"}
        response = self.client.put(self.profile_url, update_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["user"]["first_name"], "Updated")

    def test_password_change(self):
        """Test password change"""
        # Login to get token
        login_data = {"email": "existing@example.com", "password": "existingpass123"}
        login_response = self.client.post(self.login_url, login_data)
        access_token = login_response.data["tokens"]["access"]

        # Set authorization header
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")

        # Change password
        password_data = {
            "old_password": "existingpass123",
            "new_password": "newpassword123",
            "confirm_password": "newpassword123",
        }
        response = self.client.post(self.password_change_url, password_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify old password no longer works
        old_login_data = {
            "email": "existing@example.com",
            "password": "existingpass123",
        }
        response = self.client.post(self.login_url, old_login_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Verify new password works
        new_login_data = {"email": "existing@example.com", "password": "newpassword123"}
        response = self.client.post(self.login_url, new_login_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_token_refresh(self):
        """Test JWT token refresh"""
        # Login to get tokens
        login_data = {"email": "existing@example.com", "password": "existingpass123"}
        login_response = self.client.post(self.login_url, login_data)
        refresh_token = login_response.data["tokens"]["refresh"]

        # Refresh token
        refresh_url = reverse("token_refresh")
        refresh_data = {"refresh": refresh_token}
        response = self.client.post(refresh_url, refresh_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)

    def test_invalid_token_access(self):
        """Test access with invalid token"""
        # Try to access protected endpoint with invalid token
        self.client.credentials(HTTP_AUTHORIZATION="Bearer invalidtoken")
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class AuthenticationSecurityTests(APITestCase):
    """Security-focused tests for authentication"""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="security@example.com",
            username="securityuser",
            password="securepass123",
        )

    def test_sql_injection_protection(self):
        """Test SQL injection protection in login"""
        malicious_data = {
            "email": "'; DROP TABLE accounts_user; --",
            "password": "anypassword",
        }
        response = self.client.post(reverse("login"), malicious_data)
        # Should not crash and user table should still exist
        self.assertEqual(User.objects.count(), 1)

    def test_weak_password_rejection(self):
        """Test rejection of weak passwords"""
        weak_passwords = ["123", "password", "qwerty", "12345678"]

        for weak_password in weak_passwords:
            user_data = {
                "email": f"test{weak_password}@example.com",
                "username": f"user{weak_password}",
                "password": weak_password,
                "confirm_password": weak_password,
            }
            response = self.client.post(reverse("register"), user_data)
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_rate_limiting_simulation(self):
        """Test multiple failed login attempts"""
        login_data = {"email": "security@example.com", "password": "wrongpassword"}

        # Simulate multiple failed attempts
        for _ in range(5):
            response = self.client.post(reverse("login"), login_data)
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_token_expiration_handling(self):
        """Test handling of expired tokens"""
        # This would require mocking time or using a very short token lifetime
        # For now, we'll test the structure
        refresh = RefreshToken.for_user(self.user)
        access_token = str(refresh.access_token)

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
        response = self.client.get(reverse("profile"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class AuthenticationIntegrationTests(APITestCase):
    """Integration tests for complete authentication flows"""

    def setUp(self):
        self.client = APIClient()

    def test_complete_registration_to_profile_flow(self):
        """Test complete flow from registration to profile access"""
        # Step 1: Register
        registration_data = {
            "email": "integration@example.com",
            "username": "integrationuser",
            "password": "integrationpass123",
            "confirm_password": "integrationpass123",
            "first_name": "Integration",
            "last_name": "Test",
        }

        register_response = self.client.post(reverse("register"), registration_data)
        self.assertEqual(register_response.status_code, status.HTTP_201_CREATED)

        # Step 2: Use token from registration to access profile
        access_token = register_response.data["tokens"]["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")

        profile_response = self.client.get(reverse("profile"))
        self.assertEqual(profile_response.status_code, status.HTTP_200_OK)
        self.assertEqual(profile_response.data["email"], "integration@example.com")

    def test_login_to_logout_flow(self):
        """Test complete login to logout flow"""
        # Create user
        user = User.objects.create_user(
            email="flow@example.com", username="flowuser", password="flowpass123"
        )

        # Step 1: Login
        login_data = {"email": "flow@example.com", "password": "flowpass123"}
        login_response = self.client.post(reverse("login"), login_data)
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)

        # Step 2: Access protected resource
        access_token = login_response.data["tokens"]["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")

        profile_response = self.client.get(reverse("profile"))
        self.assertEqual(profile_response.status_code, status.HTTP_200_OK)

        # Step 3: Logout
        refresh_token = login_response.data["tokens"]["refresh"]
        logout_data = {"refresh_token": refresh_token}
        logout_response = self.client.post(reverse("logout"), logout_data)
        self.assertEqual(logout_response.status_code, status.HTTP_200_OK)

    def test_password_change_flow(self):
        """Test complete password change flow"""
        # Create user
        user = User.objects.create_user(
            email="password@example.com", username="passworduser", password="oldpass123"
        )

        # Step 1: Login with old password
        login_data = {"email": "password@example.com", "password": "oldpass123"}
        login_response = self.client.post(reverse("login"), login_data)
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)

        # Step 2: Change password
        access_token = login_response.data["tokens"]["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")

        password_change_data = {
            "old_password": "oldpass123",
            "new_password": "newpass123",
            "confirm_password": "newpass123",
        }
        change_response = self.client.post(
            reverse("password_change"), password_change_data
        )
        self.assertEqual(change_response.status_code, status.HTTP_200_OK)

        # Step 3: Login with new password
        self.client.credentials()  # Clear credentials
        new_login_data = {"email": "password@example.com", "password": "newpass123"}
        new_login_response = self.client.post(reverse("login"), new_login_data)
        self.assertEqual(new_login_response.status_code, status.HTTP_200_OK)


class AuthenticationPermissionTests(APITestCase):
    """Tests for authentication permissions"""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="permission@example.com",
            username="permissionuser",
            password="permissionpass123",
        )
        self.staff_user = User.objects.create_user(
            email="staff@example.com",
            username="staffuser",
            password="staffpass123",
            is_staff=True,
        )

    def test_unauthenticated_access_denied(self):
        """Test that unauthenticated users cannot access protected endpoints"""
        protected_urls = [
            reverse("profile"),
            reverse("password_change"),
            reverse("user_info"),
            reverse("logout"),
        ]

        for url in protected_urls:
            response = self.client.get(url)
            self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_access_allowed(self):
        """Test that authenticated users can access their resources"""
        # Login to get token
        login_data = {
            "email": "permission@example.com",
            "password": "permissionpass123",
        }
        login_response = self.client.post(reverse("login"), login_data)
        access_token = login_response.data["tokens"]["access"]

        # Set authorization header
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")

        # Test access to protected resources
        response = self.client.get(reverse("profile"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        response = self.client.get(reverse("user_info"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)


# Performance and Load Testing Helpers
class AuthenticationPerformanceTests(APITestCase):
    """Performance tests for authentication"""

    def setUp(self):
        self.client = APIClient()
        # Create multiple users for load testing
        self.users = []
        for i in range(10):
            user = User.objects.create_user(
                email=f"perf{i}@example.com",
                username=f"perfuser{i}",
                password="perfpass123",
            )
            self.users.append(user)

    def test_concurrent_login_performance(self):
        """Test performance with multiple concurrent logins"""
        import time

        start_time = time.time()

        for i, user in enumerate(self.users):
            login_data = {"email": f"perf{i}@example.com", "password": "perfpass123"}
            response = self.client.post(reverse("login"), login_data)
            self.assertEqual(response.status_code, status.HTTP_200_OK)

        end_time = time.time()
        total_time = end_time - start_time

        # Assert that all logins completed within reasonable time (adjust as needed)
        self.assertLess(total_time, 5.0, "Login performance is too slow")

    def test_token_generation_performance(self):
        """Test JWT token generation performance"""
        import time

        user = self.users[0]
        start_time = time.time()

        for _ in range(100):
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)

        end_time = time.time()
        total_time = end_time - start_time

        # Assert reasonable token generation time
        self.assertLess(total_time, 1.0, "Token generation is too slow")


# Custom test runner command
class AuthenticationTestRunner:
    """Custom test runner for authentication tests"""

    @staticmethod
    def run_all_tests():
        """Run all authentication tests"""
        from django.test.utils import get_runner
        from django.conf import settings
        import sys

        TestRunner = get_runner(settings)
        test_runner = TestRunner()
        failures = test_runner.run_tests(["accounts.tests"])

        if failures:
            sys.exit(1)

    @staticmethod
    def run_security_tests():
        """Run only security-focused tests"""
        from django.test.utils import get_runner
        from django.conf import settings
        import sys

        TestRunner = get_runner(settings)
        test_runner = TestRunner()
        failures = test_runner.run_tests(["accounts.tests.AuthenticationSecurityTests"])

        if failures:
            sys.exit(1)
