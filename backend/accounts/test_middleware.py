from django.test import TestCase, RequestFactory
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from unittest.mock import patch

from accounts.middleware import ActivityTrackingMiddleware

User = get_user_model()


class ActivityTrackingMiddlewareTest(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.middleware = ActivityTrackingMiddleware(lambda request: None)

    def test_updates_last_activity_for_authenticated_user(self):
        """Test that middleware updates last_activity for authenticated users"""
        request = self.factory.get('/')
        request.user = self.user

        # Ensure last_activity is initially None
        self.assertIsNone(self.user.last_activity)

        # Process request
        self.middleware(request)

        # Refresh user from database
        self.user.refresh_from_db()

        # Check that last_activity was updated
        self.assertIsNotNone(self.user.last_activity)
        self.assertAlmostEqual(
            self.user.last_activity,
            timezone.now(),
            delta=timedelta(seconds=5)
        )

    def test_does_not_update_if_recently_updated(self):
        """Test that middleware doesn't update if threshold hasn't passed"""
        # Set last_activity to 1 minute ago (less than 3-minute threshold)
        recent_time = timezone.now() - timedelta(minutes=1)
        self.user.last_activity = recent_time
        self.user.save()

        request = self.factory.get('/')
        request.user = self.user

        # Process request
        self.middleware(request)

        # Refresh user from database
        self.user.refresh_from_db()

        # Check that last_activity was NOT updated
        self.assertEqual(self.user.last_activity, recent_time)

    def test_updates_if_threshold_exceeded(self):
        """Test that middleware updates if threshold time has passed"""
        # Set last_activity to 5 minutes ago (exceeds 3-minute threshold)
        old_time = timezone.now() - timedelta(minutes=5)
        self.user.last_activity = old_time
        self.user.save()

        request = self.factory.get('/')
        request.user = self.user

        # Process request
        self.middleware(request)

        # Refresh user from database
        self.user.refresh_from_db()

        # Check that last_activity was updated
        self.assertNotEqual(self.user.last_activity, old_time)
        self.assertAlmostEqual(
            self.user.last_activity,
            timezone.now(),
            delta=timedelta(seconds=5)
        )

    def test_ignores_unauthenticated_users(self):
        """Test that middleware ignores unauthenticated users"""
        from django.contrib.auth.models import AnonymousUser

        request = self.factory.get('/')
        request.user = AnonymousUser()

        # This should not raise any errors
        self.middleware(request)