from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views_payments import (
    confirm_payment,
    list_pending_payments_detailed,
    list_all_payments,
    list_completed_payments,
    record_manual_payment,
)
from . import views

app_name = "payments"

router = DefaultRouter()

urlpatterns = [
    path("payments/confirm/", confirm_payment, name="confirm-payment"),
    path("payments/manual/", record_manual_payment, name="record-manual-payment"),
    path(
        "payments/pending/",
        list_pending_payments_detailed,
        name="list-pending-detailed",
    ),
    # PAYMENT LISTS
    path("payments/all/", list_all_payments, name="list-all-payments"),
    path(
        "payments/completed/", list_completed_payments, name="list-completed-payments"
    ),
]
