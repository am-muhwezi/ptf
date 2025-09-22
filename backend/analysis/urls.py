from django.urls import path
from .views import ComprehensiveAnalyticsView, OutdoorAnalyticsView

app_name = 'analytics'

urlpatterns = [
    path('analytics/', ComprehensiveAnalyticsView.as_view(), name='comprehensive-analytics'),
    path('analytics/outdoor/', OutdoorAnalyticsView.as_view(), name='outdoor-analytics'),
]