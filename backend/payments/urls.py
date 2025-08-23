from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .viewsets import PaymentViewSet, PaymentMethodViewSet, InvoiceViewSet, PaymentReminderViewSet
from . import views

app_name = 'payments'

# Create router and register viewsets
router = DefaultRouter()
router.register(r'payment-methods', PaymentMethodViewSet, basename='paymentmethod')
router.register(r'payments', PaymentViewSet, basename='payment')
router.register(r'invoices', InvoiceViewSet, basename='invoice')
router.register(r'reminders', PaymentReminderViewSet, basename='paymentreminder')

urlpatterns = [
    # Custom payment endpoints (matching frontend service expectations)
    path('manual/', views.record_manual_payment, name='manual-payment'),
    path('status/<str:transaction_id>/', views.get_payment_status, name='payment-status'),
    path('history/<str:member_id>/', views.get_payment_history, name='payment-history'),
    
    # Include the router for other endpoints
    path('', include(router.urls)),
]