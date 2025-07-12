from django.urls import path
from . import views

urlpatterns = [
    # Add member-specific URLs here as needed
    path("homepage/", views.homepage, name="members_homepage"),
    path("", views.MemberListCreateView.as_view(), name="members_list"),
    path(
        "<int:pk>",
        views.MemberRetrieveUpdateDelete.as_view(),
        name="member_detail_view",
    ),
    path(
        "<int:pk>/checkin/",
        views.MemberCheckInView.as_view(),
        name="member_checkin",
    ),
]
