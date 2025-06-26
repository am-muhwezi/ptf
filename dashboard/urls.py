from django.urls import path
from . import views

urlpatterns = [
    path('stats/', views.dashboard_stats, name='dashboard_stats'),
    path('notifications/', views.dashboard_notifications, name='dashboard_notifications'),
]