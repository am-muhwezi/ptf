from django.db.models import Count, Sum, Q
from django.utils import timezone
from datetime import timedelta, date
from members.models import Member
from bookings.models import Booking


def get_dashboard_statistics():
    """
    Get comprehensive dashboard statistics matching frontend expectations
    """
    today = timezone.now().date()
    start_of_month = today.replace(day=1)
    start_of_week = today - timedelta(days=today.weekday())

    # Member Statistics
    total_members = Member.objects.count()
    active_members = Member.objects.filter(status="active").count()
    inactive_members = Member.objects.filter(status="inactive").count()
    suspended_members = Member.objects.filter(status="suspended").count()

    # Members checked in today
    checked_in_today = Member.objects.filter(is_checked_in=True).count()

    # New members this month
    new_members_this_month = Member.objects.filter(
        registrationDate__date__gte=start_of_month
    ).count()

    # Members expiring soon (within 30 days)
    expiring_soon = Member.objects.filter(
        membership_end_date__lte=today + timedelta(days=30),
        membership_end_date__gt=today,
        status="active",
    ).count()

    # Booking Statistics
    total_bookings = Booking.objects.count()
    pending_bookings = Booking.objects.filter(status="pending").count()
    confirmed_bookings = Booking.objects.filter(status="confirmed").count()
    completed_bookings = Booking.objects.filter(status="completed").count()
    cancelled_bookings = Booking.objects.filter(status="cancelled").count()

    # Bookings today
    bookings_today = Booking.objects.filter(booking_date__date=today).count()

    # Session type breakdown
    group_sessions = Booking.objects.filter(session_type="Group Class").count()
    one_on_one_sessions = Booking.objects.filter(session_type="One-on-One").count()

    # Weekly bookings trend (last 7 days)
    weekly_bookings = []
    for i in range(7):
        day = today - timedelta(days=i)
        count = Booking.objects.filter(booking_date__date=day).count()
        weekly_bookings.append(
            {"date": day.isoformat(), "count": count, "day": day.strftime("%A")}
        )
    weekly_bookings.reverse()  # Show chronologically

    # Monthly revenue calculation
    monthly_revenue = (
        Member.objects.filter(last_payment__date__gte=start_of_month).aggregate(
            total=Sum("amount")
        )["total"]
        or 0
    )

    # Payment status breakdown
    paid_members = Member.objects.filter(payment_status="paid").count()
    pending_payments = Member.objects.filter(payment_status="pending").count()
    overdue_payments = Member.objects.filter(payment_status="overdue").count()

    # Membership type breakdown
    indoor_members = Member.objects.filter(membership_type="indoor").count()
    outdoor_members = Member.objects.filter(membership_type="outdoor").count()
    both_members = Member.objects.filter(membership_type="both").count()

    # Plan type breakdown
    basic_plan = Member.objects.filter(plan_type="basic").count()
    standard_plan = Member.objects.filter(plan_type="standard").count()
    premium_plan = Member.objects.filter(plan_type="premium").count()
    vip_plan = Member.objects.filter(plan_type="vip").count()

    # Calculate attendance data (this was missing!)
    # Assuming outdoor members who checked in today = outdoor visits
    outdoor_visits = Member.objects.filter(
        membership_type__in=["outdoor", "both"], is_checked_in=True
    ).count()

    indoor_visits = Member.objects.filter(
        membership_type__in=["indoor", "both"], is_checked_in=True
    ).count()

    total_visits = checked_in_today
    daily_average = total_visits  # You might want to calculate this over a period

    # Weekly attendance trend (last 7 days)
    weekly_trend = []
    for i in range(7):
        day = today - timedelta(days=i)
        # You might need to adjust this based on how you track daily attendance
        daily_checkins = (
            Member.objects.filter(last_checkin_date__date=day).count()
            if hasattr(Member, "last_checkin_date")
            else 0
        )

        weekly_trend.append(
            {
                "date": day.isoformat(),
                "visits": daily_checkins,
                "day": day.strftime("%A"),
            }
        )
    weekly_trend.reverse()

    # Monthly trend (last 30 days, grouped by week)
    monthly_trend = []
    for week in range(4):
        week_start = today - timedelta(days=today.weekday() + (week * 7))
        week_end = week_start + timedelta(days=6)

        # Adjust this query based on your attendance tracking
        week_checkins = (
            Member.objects.filter(
                last_checkin_date__date__range=[week_start, week_end]
            ).count()
            if hasattr(Member, "last_checkin_date")
            else 0
        )

        monthly_trend.append(
            {
                "week": f"Week {4-week}",
                "visits": week_checkins,
                "startDate": week_start.isoformat(),
                "endDate": week_end.isoformat(),
            }
        )
    monthly_trend.reverse()

    # Return structure matching frontend expectations
    return {
        # ATTENDANCE DATA - This was missing and causing the frontend error!
        "attendanceData": {
            "outdoorVisits": outdoor_visits,
            "indoorVisits": indoor_visits,
            "totalVisits": total_visits,
            "dailyAverage": daily_average,
            "weeklyTrend": weekly_trend,
            "monthlyTrend": monthly_trend,
        },
        # MEMBER STATISTICS
        "memberStats": {
            "totalMembers": total_members,
            "activeMembers": active_members,
            "newMembersThisMonth": new_members_this_month,
            "inactiveMembers": inactive_members,
            "membershipTypes": {
                "indoor": indoor_members,
                "outdoor": outdoor_members,
                "both": both_members,
            },
        },
        # REVENUE DATA
        "revenueData": {
            "monthlyRevenue": float(monthly_revenue),
            "totalRevenue": float(
                monthly_revenue
            ),  # You might want to calculate total differently
            "pendingPayments": pending_payments,
            "overduePayments": overdue_payments,
        },
        # BOOKING STATISTICS
        "bookingStats": {
            "totalBookings": total_bookings,
            "pendingBookings": pending_bookings,
            "confirmedBookings": confirmed_bookings,
            "cancelledBookings": cancelled_bookings,
            "todaysBookings": bookings_today,
        },
        # TRENDS
        "trends": {
            "peakHours": [],  # You'll need to implement this based on your data
            "popularActivities": [],  # You'll need to implement this
            "busyDays": weekly_bookings,
        },
        # QUICK METRICS
        "quickMetrics": {
            "checkedInToday": checked_in_today,
            "expiringMemberships": expiring_soon,
            "equipmentIssues": 0,  # You'll need to implement this
            "feedbackReceived": 0,  # You'll need to implement this
        },
        # LEGACY DATA (keep for backward compatibility)
        "memberData": {
            "total": total_members,
            "active": active_members,
            "inactive": inactive_members,
            "suspended": suspended_members,
            "newThisMonth": new_members_this_month,
            "checkedInToday": checked_in_today,
            "expiringSoon": expiring_soon,
            "membershipTypes": {
                "indoor": indoor_members,
                "outdoor": outdoor_members,
                "both": both_members,
            },
            "planTypes": {
                "basic": basic_plan,
                "standard": standard_plan,
                "premium": premium_plan,
                "vip": vip_plan,
            },
        },
        "bookingData": {
            "total": total_bookings,
            "pending": pending_bookings,
            "confirmed": confirmed_bookings,
            "completed": completed_bookings,
            "cancelled": cancelled_bookings,
            "today": bookings_today,
            "groupSessions": group_sessions,
            "oneOnOneSessions": one_on_one_sessions,
            "weeklyTrend": weekly_bookings,
        },
        # METADATA
        "lastUpdated": timezone.now().isoformat(),
        "generatedAt": timezone.now().isoformat(),
        "dateRange": {
            "today": today.isoformat(),
            "monthStart": start_of_month.isoformat(),
            "weekStart": start_of_week.isoformat(),
        },
    }
