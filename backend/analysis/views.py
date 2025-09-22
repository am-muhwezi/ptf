from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.authentication import SessionAuthentication
from .services import AnalyticsService


class ComprehensiveAnalyticsView(APIView):
    """
    Comprehensive analytics endpoint that returns all calculated analytics data
    All calculations are done on the backend for accuracy and performance
    """

    authentication_classes = [JWTAuthentication, SessionAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """
        Get comprehensive analytics data
        Query params:
        - timeframe: 'week', 'month', 'quarter', 'year' (default: 'month')
        """
        try:
            timeframe = request.query_params.get('timeframe', 'month')

            # Validate timeframe
            valid_timeframes = ['week', 'month', 'quarter', 'year']
            if timeframe not in valid_timeframes:
                return Response(
                    {
                        "error": "Invalid timeframe",
                        "valid_options": valid_timeframes
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Get comprehensive analytics
            analytics_data = AnalyticsService.get_comprehensive_analytics(timeframe)

            return Response(
                {
                    "success": True,
                    "data": analytics_data,
                    "timeframe": timeframe
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            return Response(
                {
                    "success": False,
                    "error": "Failed to retrieve analytics data",
                    "details": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class OutdoorAnalyticsView(APIView):
    """
    Outdoor-specific analytics endpoint
    """

    authentication_classes = [JWTAuthentication, SessionAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Get outdoor-specific analytics"""
        try:
            timeframe = request.query_params.get('timeframe', 'month')

            # Get full analytics and extract outdoor data
            full_analytics = AnalyticsService.get_comprehensive_analytics(timeframe)

            outdoor_data = {
                'outdoor_membership': full_analytics['membershipBreakdown']['outdoor'],
                'outdoor_analytics': full_analytics['outdoorAnalytics'],
                'outdoor_attendance': {
                    'visits': full_analytics['attendanceAnalytics']['outdoorVisits'],
                    'daily_average': full_analytics['outdoorAnalytics']['attendance']['daily_avg']
                }
            }

            return Response(
                {
                    "success": True,
                    "data": outdoor_data,
                    "timeframe": timeframe
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            return Response(
                {
                    "success": False,
                    "error": "Failed to retrieve outdoor analytics",
                    "details": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )