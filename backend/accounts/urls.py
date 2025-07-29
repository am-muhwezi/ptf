from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

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
]
