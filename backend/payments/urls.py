from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views_payments import (
    confirm_payment,
    list_pending_payments_detailed,
    list_all_payments,
    list_completed_payments,
    record_manual_payment,
)
from .views_due import (
    list_payments_due,
    list_renewals_due,
    payment_stats,
)
from .views_invoice import (
    send_invoice,
    send_bulk_invoices,
    preview_invoice,
    download_invoice,
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
    path("payments/due/", list_payments_due, name="list-payments-due"),
    path("renewals/due/", list_renewals_due, name="list-renewals-due"),
    path("payments/stats/", payment_stats, name="payment-stats"),

    # INVOICE ENDPOINTS
    path("invoice/bulk/", send_bulk_invoices, name="send-bulk-invoices"),
    path("invoice/<str:member_id>/", send_invoice, name="send-invoice"),
    path("invoice/<str:member_id>/preview/", preview_invoice, name="preview-invoice"),
    path("invoice/<str:member_id>/download/", download_invoice, name="download-invoice"),
]
