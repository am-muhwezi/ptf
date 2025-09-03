from django.urls import path
from . import views

urlpatterns = [
    path('payments/<uuid:payment_id>/status/', views.update_payment_status, name='update_payment_status'),
    path('payments/<uuid:payment_id>/', views.get_payment_status, name='get_payment_status'),
]