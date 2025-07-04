from . import views
from django.urls import path

urlpatterns = [

    path("notifications/", views.notifications, name='dashboard_notifications'),
    path('stats/', views.dashboard_stats, name='dashboard_stats'),
    path('checkin/', views.member_checkin, name='member_checkin'),
    # Add more paths as needed for other views
]