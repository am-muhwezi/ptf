from . import views
from django.urls import path

urlpatterns = [
    path("notifications", views.notifications, name='dashboard_notifications'),
    # Add more paths as needed for other views
]