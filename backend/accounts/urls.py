from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework.routers import DefaultRouter
from . import views
from .admin_views import AdminManagementViewSet

# Router for admin management
admin_router = DefaultRouter()
admin_router.register(r'admin-users', AdminManagementViewSet, basename='admin-users')

urlpatterns = [
    # Authentication endpoints
    path("auth/register/", views.RegisterView.as_view(), name="register"),
    path("auth/login/", views.LoginView.as_view(), name="login"),
    path("auth/logout/", views.LogoutView.as_view(), name="logout"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    # User profile endpoints
    path("auth/profile/", views.ProfileView.as_view(), name="profile"),
    path("auth/user-info/", views.user_info, name="user_info"),
    # Password management
    path(
        "auth/password/change/",
        views.PasswordChangeView.as_view(),
        name="password_change",
    ),
    path(
        "auth/password/forgot/",
        views.ForgotPasswordView.as_view(),
        name="forgot_password",
    ),
    path(
        "auth/password/reset/",
        views.PasswordResetView.as_view(),
        name="password_reset",
    ),
    # Admin management endpoints
    path("admin/", include(admin_router.urls)),
]
