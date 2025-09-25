from django.utils import timezone
from django.conf import settings
from datetime import timedelta


class ActivityTrackingMiddleware:
    """
    Middleware that updates user's last_activity field with rate limiting.
    Only updates if at least ACTIVITY_UPDATE_THRESHOLD minutes have passed
    since the last update to minimize database writes.
    """

    def __init__(self, get_response):
        self.get_response = get_response
        # Get threshold from settings or default to 3 minutes
        self.threshold_minutes = getattr(settings, 'ACTIVITY_UPDATE_THRESHOLD', 3)

    def __call__(self, request):
        response = self.get_response(request)

        # Only track activity for authenticated users
        if request.user.is_authenticated:
            self.update_user_activity(request.user)

        return response

    def update_user_activity(self, user):
        """
        Update user's last_activity if enough time has passed since last update.
        This rate-limiting approach reduces database writes while keeping data fresh.
        """
        now = timezone.now()
        threshold = timedelta(minutes=self.threshold_minutes)

        # Check if we need to update
        should_update = (
            user.last_activity is None or  # First time tracking
            (now - user.last_activity) >= threshold  # Enough time has passed
        )

        if should_update:
            # Use update() to avoid triggering model save signals and minimize overhead
            user.__class__.objects.filter(id=user.id).update(last_activity=now)
            # Update the in-memory instance to avoid repeated updates in the same request
            user.last_activity = now