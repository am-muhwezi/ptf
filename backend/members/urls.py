from django.urls import path, include
from .views_registration import register_member
from .views_checkin import checkin, get_member_detail, search_members_optimized
from .views_list import list_all_members, list_indoor_members, list_outdoor_members, MembersSummaryView
from rest_framework.routers import DefaultRouter


router = DefaultRouter()

urlpatterns = [
    path("", include(router.urls)),
    # Dashboard-style summary endpoint (following dashboard pattern)
    path("summary/", MembersSummaryView.as_view(), name="members-summary"),

    # OPTIMIZED ENDPOINTS - Use these for better performance
    path("members/<int:member_id>/", get_member_detail, name="member-detail"),  # Fixes 404 error
    path("search/", search_members_optimized, name="members-search"),          # Fast search
    path("checkin/<int:member_id>/", checkin, name="checkin-member"),          # Direct check-in

    # Existing list endpoints (hybrid functionality) - Consider deprecating /all/
    path("all/", list_all_members, name="list-all-members"),
    path("indoor/", list_indoor_members, name="list-indoor-members"),
    path("outdoor/", list_outdoor_members, name="list-outdoor-members"),
    path("member/register/", register_member, name="register-member"),
]
