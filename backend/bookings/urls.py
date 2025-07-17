from django.urls import path, include
from . import views
from rest_framework.routers import DefaultRouter


router = DefaultRouter()

router.register(r"bookings", views.BookingViewSet, basename="booking")

urlpatterns = [
    path("homepage/", views.homepage, name="bookings_homepage"),
    path("", include(router.urls)),
]
