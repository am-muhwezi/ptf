
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'members', views.MemberViewSet)
router.register(r'bookings', views.BookingViewSet)
router.register(r'trainers', views.TrainerViewSet)
router.register(r'waitlist', views.WaitlistViewSet)
router.register(r'attendance', views.AttendanceViewSet)
router.register(r'feedback', views.FeedbackViewSet)
router.register(r'inventory', views.InventoryItemViewSet)
router.register(r'notifications', views.NotificationViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('stats/', views.dashboard_stats, name='dashboard_stats'),
    path('checkin/', views.member_checkin, name='member_checkin'),
    path('notifications/', views.notifications, name='dashboard_notifications'),
]
