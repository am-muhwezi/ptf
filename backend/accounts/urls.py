from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework.routers import DefaultRouter
from . import views
from .admin_views import AdminManagementViewSet
from . import session_views

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
    # Email verification endpoints
    path(
        "auth/email/verify/",
        views.EmailVerificationView.as_view(),
        name="email_verify",
    ),
    path(
        "auth/email/resend/",
        views.ResendVerificationView.as_view(),
        name="resend_verification",
    ),
    # Admin management endpoints (renamed to avoid conflict with Django admin)
    path("api/admin/", include(admin_router.urls)),
    # Session management endpoints
    path("api/admin/sessions/logged-in/", session_views.get_logged_in_admins, name="logged_in_admins"),
    path("api/admin/sessions/stats/", session_views.get_session_stats, name="session_stats"),
    path("api/admin/sessions/force-logout/<int:user_id>/", session_views.force_logout_user, name="force_logout_user"),
    path("api/admin/sessions/user-info/<int:user_id>/", session_views.get_user_session_info, name="user_session_info"),
    path("api/admin/sessions/my-info/", session_views.get_user_session_info, name="my_session_info"),

    # OPTIMIZED: Combined dashboard endpoint (recommended for frontend)
    path("api/admin/dashboard/", session_views.get_admin_dashboard_data, name="admin_dashboard"),
    path("api/admin/cache/invalidate/", session_views.invalidate_admin_cache, name="invalidate_cache"),
]
