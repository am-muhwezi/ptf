from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone

from .services import get_dashboard_statistics


class DashboardStatsView(APIView):
    def get(self, request):
        try:
            stats = get_dashboard_statistics()
            return Response(stats, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": "Could not retrieve dashboard statistics", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class DashboardNotificationsView(APIView):
    def get(self, request):
        """
        Placeholder for notifications endpoint.
        Currently returns a static message.
        """
        notifications = {
            "message": "No new notifications at this time.",
            "timestamp": timezone.now().isoformat(),
        }
        return Response(notifications, status=status.HTTP_200_OK)
