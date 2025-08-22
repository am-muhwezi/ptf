from django.urls import path
from . import views

urlpatterns = [
    path('check-in/', views.CheckInView.as_view(), name='attendance-check-in'),
    path('check-out/', views.CheckOutView.as_view(), name='attendance-check-out'),
    path('status/', views.AttendanceStatusView.as_view(), name='attendance-status'),
    path('today/', views.TodaysAttendanceView.as_view(), name='todays-attendance'),
]