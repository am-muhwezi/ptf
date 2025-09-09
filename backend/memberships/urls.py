from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MembershipPlanViewSet, MembershipViewSet
from .views_list import (
    list_all_memberships,
    list_memberships_by_plan,
    list_expiring_memberships,
)

router = DefaultRouter()
router.register(r"plans", MembershipPlanViewSet, basename="membership-plan")
router.register(r"memberships", MembershipViewSet, basename="membership")

urlpatterns = [
    # MEMBERSHIP LISTS
    path("all/", list_all_memberships, name="list-all-memberships"),
    path(
        "by-plan/<str:plan_code>/",
        list_memberships_by_plan,
        name="list-memberships-by-plan",
    ),
    path("expiring/", list_expiring_memberships, name="list-expiring-memberships"),
    # EXISTING
    path("", include(router.urls)),
]
