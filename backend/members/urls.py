from django.urls import path, include
from . import views
from .views_registration import register_member
from .views_checkin import checkin_member, checkout_member
from rest_framework.routers import DefaultRouter


router = DefaultRouter()


router.register(r"members", views.MemberViewset, basename="member")


urlpatterns = [
    path("", include(router.urls)),
    path("register/", register_member, name="register-member"),
    path("checkin/", checkin_member, name="checkin-member"),
    path("checkout/", checkout_member, name="checkout-member"),
]
