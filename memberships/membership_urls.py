from django.urls import path
from . import views

urlpatterns = [
    path('indoor/', views.indoor_memberships, name='indoor_memberships'),
    # Add more membership endpoints as needed
]