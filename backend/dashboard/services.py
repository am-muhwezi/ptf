from django.db.models import Count, Sum
from django.utils import timezone
from datetime import timedelta, date
from members.models import Member
from memberships.models import Membership
from attendance.models import AttendanceLog
from bookings.models import Booking


def get_member_statistics():
    """
    Get basic member counts and statistics
    Returns: dict with member counts by status and type
    """
    today = timezone.now().date()
    start_of_month = today.replace(day=1)

    # Basic member counts
    total_members = Member.objects.count()
    active_members = Member.objects.filter(status="active").count()
    inactive_members = Member.objects.filter(status="inactive").count()
    suspended_members = Member.objects.filter(status="suspended").count()

    # New members this month
    new_members_this_month = Member.objects.filter(
        registration_date__gte=start_of_month
    ).count()

    return {
        "total_members": total_members,
        "active_members": active_members,
        "inactive_members": inactive_members,
        "suspended_members": suspended_members,
        "new_members_this_month": new_members_this_month,
    }


def get_dashboard_statistics():
    """
    Get membership plan and type statistics
    Returns: dict with membership breakdown by type and plan
    """
    # Membership type counts
    indoor_memberships = Membership.objects.filter(
        plan__membership_type="indoor", status="active"
    ).count()

    outdoor_memberships = Membership.objects.filter(
        plan__membership_type="outdoor", status="active"
    ).count()

    # Payment status counts
    paid_memberships = Membership.objects.filter(payment_status="paid").count()
    pending_payments = Membership.objects.filter(payment_status="pending").count()
    overdue_payments = Membership.objects.filter(payment_status="overdue").count()

    # Expiring memberships (within 30 days)
    today = timezone.now().date()
    expiring_soon = Membership.objects.filter(
        end_date__lte=today + timedelta(days=30), end_date__gt=today, status="active"
    ).count()

    return {
        "indoor_memberships": indoor_memberships,
        "outdoor_memberships": outdoor_memberships,
        "paid_memberships": paid_memberships,
        "pending_payments": pending_payments,
        "overdue_payments": overdue_payments,
        "expiring_soon": expiring_soon,
    }


def get_attendance_today():
    """
    Get today's attendance statistics
    Returns: dict with today's check-ins and visit breakdown
    """
    today = timezone.now().date()

    # Today's attendance
    total_checkins_today = AttendanceLog.objects.filter(
        check_in_time__date=today
    ).count()

    indoor_visits_today = AttendanceLog.objects.filter(
        check_in_time__date=today, visit_type="indoor"
    ).count()

    outdoor_visits_today = AttendanceLog.objects.filter(
        check_in_time__date=today, visit_type="outdoor"
    ).count()

    # Currently active (checked in but not out)
    currently_active = AttendanceLog.objects.filter(
        check_in_time__date=today, check_out_time__isnull=True
    ).count()

    return {
        "total_checkins_today": total_checkins_today,
        "indoor_visits_today": indoor_visits_today,
        "outdoor_visits_today": outdoor_visits_today,
        "currently_active": currently_active,
    }


def get_weekly_attendance():
    """
    Get attendance for the last 7 days
    Returns: list of daily attendance data
    """
    today = timezone.now().date()
    weekly_data = []

    for i in range(7):
        day = today - timedelta(days=i)

        daily_checkins = AttendanceLog.objects.filter(check_in_time__date=day).count()

        indoor_visits = AttendanceLog.objects.filter(
            check_in_time__date=day, visit_type="indoor"
        ).count()

        outdoor_visits = AttendanceLog.objects.filter(
            check_in_time__date=day, visit_type="outdoor"
        ).count()

        weekly_data.append(
            {
                "date": day.isoformat(),
                "day_name": day.strftime("%A"),
                "total_visits": daily_checkins,
                "indoor_visits": indoor_visits,
                "outdoor_visits": outdoor_visits,
            }
        )

    weekly_data.reverse()  # Show oldest to newest
    return weekly_data


def get_booking_statistics():
    """
    Get booking counts by status and type
    Returns: dict with booking statistics
    """
    today = timezone.now().date()

    # Total bookings by status
    total_bookings = Booking.objects.count()
    pending_bookings = Booking.objects.filter(status="pending").count()
    confirmed_bookings = Booking.objects.filter(status="confirmed").count()
    completed_bookings = Booking.objects.filter(status="completed").count()
    cancelled_bookings = Booking.objects.filter(status="cancelled").count()

    # Today's bookings
    bookings_today = Booking.objects.filter(booking_date=today).count()

    # Bookings by type
    indoor_bookings = Booking.objects.filter(booking_type="indoor").count()
    outdoor_bookings = Booking.objects.filter(booking_type="outdoor").count()

    return {
        "total_bookings": total_bookings,
        "pending_bookings": pending_bookings,
        "confirmed_bookings": confirmed_bookings,
        "completed_bookings": completed_bookings,
        "cancelled_bookings": cancelled_bookings,
        "bookings_today": bookings_today,
        "indoor_bookings": indoor_bookings,
        "outdoor_bookings": outdoor_bookings,
    }


def get_revenue_statistics():
    """
    Get revenue data from memberships
    Returns: dict with revenue totals
    """
    today = timezone.now().date()
    start_of_month = today.replace(day=1)

    # Monthly revenue from new memberships
    monthly_revenue = (
        Membership.objects.filter(created_at__gte=start_of_month).aggregate(
            total=Sum("amount_paid")
        )["total"]
        or 0
    )

    # Total revenue (all time)
    total_revenue = Membership.objects.aggregate(total=Sum("amount_paid"))["total"] or 0

    return {
        "monthly_revenue": float(monthly_revenue),
        "total_revenue": float(total_revenue),
    }


def get_dashboard_summary():
    """
    Main dashboard function - combines all statistics
    Returns: complete dashboard data structure
    """
    # Get all individual statistics
    member_stats = get_member_statistics()
    membership_stats = get_dashboard_statistics()
    attendance_today = get_attendance_today()
    weekly_attendance = get_weekly_attendance()
    booking_stats = get_booking_statistics()
    revenue_stats = get_revenue_statistics()

    # Calculate daily average from weekly data
    total_weekly_visits = sum(day["total_visits"] for day in weekly_attendance)
    daily_average = round(total_weekly_visits / 7, 1) if weekly_attendance else 0

    return {
        # Member overview
        "members": {
            "total": member_stats["total_members"],
            "active": member_stats["active_members"],
            "inactive": member_stats["inactive_members"],
            "suspended": member_stats["suspended_members"],
            "new_this_month": member_stats["new_members_this_month"],
        },
        # Membership overview
        "memberships": {
            "indoor_count": membership_stats["indoor_memberships"],
            "outdoor_count": membership_stats["outdoor_memberships"],
            "paid": membership_stats["paid_memberships"],
            "pending_payment": membership_stats["pending_payments"],
            "overdue_payment": membership_stats["overdue_payments"],
            "expiring_soon": membership_stats["expiring_soon"],
        },
        # Today's attendance
        "attendance_today": {
            "total_checkins": attendance_today["total_checkins_today"],
            "indoor_visits": attendance_today["indoor_visits_today"],
            "outdoor_visits": attendance_today["outdoor_visits_today"],
            "currently_active": attendance_today["currently_active"],
            "daily_average": daily_average,
        },
        # Weekly attendance trend
        "weekly_attendance": weekly_attendance,
        # Booking statistics
        "bookings": {
            "total": booking_stats["total_bookings"],
            "pending": booking_stats["pending_bookings"],
            "confirmed": booking_stats["confirmed_bookings"],
            "completed": booking_stats["completed_bookings"],
            "cancelled": booking_stats["cancelled_bookings"],
            "today": booking_stats["bookings_today"],
            "indoor": booking_stats["indoor_bookings"],
            "outdoor": booking_stats["outdoor_bookings"],
        },
        # Revenue data
        "revenue": {
            "monthly": revenue_stats["monthly_revenue"],
            "total": revenue_stats["total_revenue"],
        },
        # Metadata
        "generated_at": timezone.now().isoformat(),
        "date": timezone.now().date().isoformat(),
    }
