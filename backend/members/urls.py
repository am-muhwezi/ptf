from django.urls import path, include
from . import views
from rest_framework.routers import DefaultRouter


router = DefaultRouter()


router.register(r"members", views.MemberViewset, basename="member")


urlpatterns = [
    path("homepage/", views.homepage, name="members_homepage"),
    path("", include(router.urls)),
]
