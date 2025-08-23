from django.urls import path
from . import views

urlpatterns = [
    path("", views.AttendanceViewSet.as_view(), name="attendance-api"),
]
