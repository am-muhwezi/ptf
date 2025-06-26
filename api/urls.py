from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    # Authentication endpoints
    path('auth/', include([
        path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
        path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    ])),
    
    # Dashboard endpoints
    path('dashboard/', include('dashboard.urls')),
    
    # Members endpoints
    path('members/', include('memberships.urls')),
    
    # Memberships endpoints
    path('memberships/', include('memberships.membership_urls')),
]