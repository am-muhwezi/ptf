from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from accounts.permissions import IsSuperAdminPermission
from django.db.models import Q, Sum, Count
from django.utils import timezone
from datetime import datetime, timedelta
from memberships.models import Membership
from .models import Payment


@api_view(["GET"])
def list_payments_due(request):
    """List all payments due with comprehensive stats"""
    try:
        # Query parameters
        search = request.GET.get("search", "")
        status_filter = request.GET.get("status", "")
        page = int(request.GET.get("page", 1))
        limit = int(request.GET.get("limit", 50))

        # Base queryset - memberships with pending/overdue payments
        queryset = (
            Membership.objects.filter(payment_status__in=["pending", "overdue"])
            .select_related("member", "plan")
            .order_by("-created_at")
        )

        # Apply search filter
        if search:
            queryset = queryset.filter(
                Q(member__first_name__icontains=search)
                | Q(member__last_name__icontains=search)
                | Q(member__email__icontains=search)
                | Q(member__id__icontains=search)
            )

        # Calculate payment status based on expiry date
        today = timezone.now().date()

        payments_due = []
        total_outstanding = 0
        overdue_count = 0
        due_today_count = 0

        for membership in queryset:
            expiry_date = membership.end_date
            if expiry_date:
                days_diff = (expiry_date - today).days

                # Determine status
                if days_diff < 0:
                    payment_status = "overdue"
                    days_overdue = abs(days_diff)
                    overdue_count += 1
                elif days_diff == 0:
                    payment_status = "due_today"
                    days_overdue = 0
                    due_today_count += 1
                elif days_diff <= 7:
                    payment_status = "due_soon"
                    days_overdue = 0
                else:
                    payment_status = "current"
                    days_overdue = 0

                # Apply status filter
                if status_filter and payment_status != status_filter:
                    continue

                amount = float(membership.amount_paid)
                total_outstanding += amount

                payment_data = {
                    "id": membership.id,
                    "member_id": membership.member.id,
                    "first_name": membership.member.first_name,
                    "last_name": membership.member.last_name,
                    "firstName": membership.member.first_name,  # Frontend expects camelCase
                    "lastName": membership.member.last_name,  # Frontend expects camelCase
                    "email": membership.member.email,
                    "phone": membership.member.phone,
                    "membership_type": membership.plan.membership_type,
                    "membershipType": membership.plan.membership_type,  # Frontend expects camelCase
                    "plan_type": membership.plan.plan_name,
                    "planType": membership.plan.plan_name,  # Frontend expects camelCase
                    "amount": amount,
                    "due_date": expiry_date.isoformat(),
                    "dueDate": expiry_date.isoformat(),  # Frontend expects camelCase
                    "status": payment_status,
                    "days_overdue": days_overdue,
                    "daysOverdue": days_overdue,  # Frontend expects camelCase
                    "total_outstanding": amount,
                    "totalOutstanding": amount,  # Frontend expects camelCase
                    "invoice_number": f"INV-{membership.id}",
                    "invoiceNumber": f"INV-{membership.id}",  # Frontend expects camelCase
                    "payment_method": "M-Pesa",  # Default
                    "paymentMethod": "M-Pesa",  # Frontend expects camelCase
                }
                payments_due.append(payment_data)

        # Apply pagination
        start_idx = (page - 1) * limit
        end_idx = start_idx + limit
        paginated_data = payments_due[start_idx:end_idx]

        # Calculate comprehensive stats
        stats = {
            "total": len(payments_due),
            "overdue": overdue_count,
            "due_today": due_today_count,
            "due_soon": len([p for p in payments_due if p["status"] == "due_soon"]),
            "total_outstanding": total_outstanding,
            "average_amount": (
                total_outstanding / len(payments_due) if payments_due else 0
            ),
        }

        return Response(
            {
                "success": True,
                "results": paginated_data,
                "count": len(payments_due),
                "stats": stats,
                "pagination": {
                    "page": page,
                    "limit": limit,
                    "total_pages": (len(payments_due) + limit - 1) // limit,
                    "has_next": end_idx < len(payments_due),
                    "has_previous": page > 1,
                },
            }
        )

    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(["GET"])
def list_renewals_due(request):
    """List all renewals due with comprehensive stats"""
    try:
        # Query parameters
        search = request.GET.get("search", "")
        urgency_filter = request.GET.get("urgency", "")
        page = int(request.GET.get("page", 1))
        limit = int(request.GET.get("limit", 50))

        # Get memberships expiring in next 60 days
        today = timezone.now().date()
        future_date = today + timedelta(days=60)

        queryset = (
            Membership.objects.filter(end_date__lte=future_date, end_date__gte=today)
            .select_related("member", "plan")
            .order_by("end_date")
        )

        # Apply search filter
        if search:
            queryset = queryset.filter(
                Q(member__first_name__icontains=search)
                | Q(member__last_name__icontains=search)
                | Q(member__email__icontains=search)
                | Q(member__id__icontains=search)
            )

        renewals_due = []
        total_revenue = 0
        critical_count = 0
        high_count = 0
        medium_count = 0

        for membership in queryset:
            expiry_date = membership.end_date
            days_until_expiry = (expiry_date - today).days

            # Determine urgency
            if days_until_expiry <= 7:
                urgency = "critical"
                critical_count += 1
            elif days_until_expiry <= 15:
                urgency = "high"
                high_count += 1
            elif days_until_expiry <= 30:
                urgency = "medium"
                medium_count += 1
            else:
                urgency = "low"

            # Apply urgency filter
            if urgency_filter and urgency != urgency_filter:
                continue

            amount = float(membership.amount_paid)
            total_revenue += amount

            renewal_data = {
                "id": membership.id,
                "member_id": membership.member.id,
                "first_name": membership.member.first_name,
                "last_name": membership.member.last_name,
                "firstName": membership.member.first_name,  # Frontend expects camelCase
                "lastName": membership.member.last_name,  # Frontend expects camelCase
                "email": membership.member.email,
                "phone": membership.member.phone,
                "membership_type": membership.plan.membership_type,
                "membershipType": membership.plan.membership_type,  # Frontend expects camelCase
                "current_plan": membership.plan.plan_name,
                "currentPlan": membership.plan.plan_name,  # Frontend expects camelCase
                "amount": amount,
                "expiry_date": expiry_date.isoformat(),
                "expiryDate": expiry_date.isoformat(),  # Frontend expects camelCase
                "urgency": urgency,
                "days_until_expiry": days_until_expiry,
                "daysUntilExpiry": days_until_expiry,  # Frontend expects camelCase
                "last_renewal": membership.created_at.date().isoformat(),
                "lastRenewal": membership.created_at.date().isoformat(),  # Frontend expects camelCase
                "total_renewals": 1,  # Could be calculated from payment history
                "totalRenewals": 1,  # Frontend expects camelCase
                "preferred_contact": "sms",  # Default
                "preferredContact": "sms",  # Frontend expects camelCase
            }
            renewals_due.append(renewal_data)

        # Apply pagination
        start_idx = (page - 1) * limit
        end_idx = start_idx + limit
        paginated_data = renewals_due[start_idx:end_idx]

        # Calculate comprehensive stats
        stats = {
            "total": len(renewals_due),
            "critical": critical_count,
            "high": high_count,
            "medium": medium_count,
            "low": len(renewals_due) - critical_count - high_count - medium_count,
            "total_revenue": total_revenue,
            "average_amount": total_revenue / len(renewals_due) if renewals_due else 0,
        }

        return Response(
            {
                "success": True,
                "results": paginated_data,
                "count": len(renewals_due),
                "stats": stats,
                "pagination": {
                    "page": page,
                    "limit": limit,
                    "total_pages": (len(renewals_due) + limit - 1) // limit,
                    "has_next": end_idx < len(renewals_due),
                    "has_previous": page > 1,
                },
            }
        )

    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(["GET"])
@permission_classes([IsSuperAdminPermission])
def payment_stats(request):
    """Get payment statistics"""
    try:
        timeframe = request.GET.get("timeframe", "month")

        # Calculate date range based on timeframe
        today = timezone.now().date()
        if timeframe == "week":
            start_date = today - timedelta(days=7)
        elif timeframe == "month":
            start_date = today - timedelta(days=30)
        elif timeframe == "quarter":
            start_date = today - timedelta(days=90)
        else:
            start_date = today - timedelta(days=30)

        # Get payment statistics
        payments = Payment.objects.filter(created_at__date__gte=start_date)

        total_revenue = (
            payments.filter(status="completed").aggregate(total=Sum("amount"))["total"]
            or 0
        )

        total_payments = payments.filter(status="completed").count()
        pending_payments = payments.filter(status="pending").count()

        # Get overdue payments
        overdue_memberships = Membership.objects.filter(
            payment_status="overdue", end_date__lt=today
        ).count()

        stats = {
            "total_revenue": float(total_revenue),
            "total_payments": total_payments,
            "pending_payments": pending_payments,
            "overdue_payments": overdue_memberships,
            "timeframe": timeframe,
            "start_date": start_date.isoformat(),
            "end_date": today.isoformat(),
        }

        return Response({"success": True, "stats": stats})

    except Exception as e:
        return Response({"error": str(e)}, status=500)
