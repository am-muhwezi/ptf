from django.urls import path
from . import views

urlpatterns = [
    path('', views.member_list, name='member_list'),
    path('create/', views.member_create, name='member_create'),
    path('search/', views.member_search, name='member_search'),
    path('checkin/', views.member_checkin, name='member_checkin'),
]