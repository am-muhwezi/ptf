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

    # Members checked in today - use proper attendance tracking
    from memberships.models import Membership, SessionLog
    from attendance.models import AttendanceLog, Attendance
    
    # Get unique members who checked in today from attendance logs
    checked_in_today = AttendanceLog.objects.filter(
        check_in_time__date=today,
        status__in=['checked_in', 'active']
    ).values('member').distinct().count()
    
    # If no attendance data, fallback to session logs
    if checked_in_today == 0:
        checked_in_today = SessionLog.objects.filter(
            date_used__date=today
        ).values('membership__member').distinct().count()
    
    # New members this month
    new_members_this_month = Member.objects.filter(
        registration_date__gte=start_of_month
    ).count()

    # Members with expiring memberships (within 30 days)
    expiring_soon = Membership.objects.filter(
        end_date__lte=today + timedelta(days=30),
        end_date__gt=today,
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

    # Monthly revenue calculation - now from Membership model
    monthly_revenue = (
        Membership.objects.filter(created_at__gte=start_of_month).aggregate(
            total=Sum("amount_paid")
        )["total"]
        or 0
    )

    # Payment status breakdown - now from Membership model
    paid_members = Membership.objects.filter(payment_status="paid").count()
    pending_payments = Membership.objects.filter(payment_status="pending").count()
    overdue_payments = Membership.objects.filter(payment_status="overdue").count()

    # Membership type breakdown - now from Membership model
    indoor_members = Membership.objects.filter(plan__membership_type="indoor").count()
    outdoor_members = Membership.objects.filter(plan__membership_type="outdoor").count()

    # Plan type breakdown
    daily_memberships = Membership.objects.filter(plan__plan_type="daily").count()
    monthly_memberships = Membership.objects.filter(plan__plan_type="monthly").count()
    session_based_memberships = Membership.objects.filter(
        plan__plan_type__in=["1_session_week", "2_sessions_week", "3_sessions_week", "4_sessions_week", "5_sessions_week"]
    ).count()
    annual_memberships = Membership.objects.filter(plan__plan_type__in=["bi-annual", "annual"]).count()

    # Calculate attendance data from AttendanceLog (primary) and SessionLog (fallback)
    
    # Get today's attendance by visit type
    outdoor_visits = AttendanceLog.objects.filter(
        check_in_time__date=today,
        visit_type="outdoor"
    ).count()
    
    indoor_visits = AttendanceLog.objects.filter(
        check_in_time__date=today,
        visit_type="indoor"
    ).count()
    
    # If no attendance logs today, fallback to session logs with membership type
    if outdoor_visits == 0 and indoor_visits == 0:
        outdoor_visits = SessionLog.objects.filter(
            membership__plan__membership_type="outdoor",
            date_used__date=today
        ).count()
        
        indoor_visits = SessionLog.objects.filter(
            membership__plan__membership_type="indoor",
            date_used__date=today
        ).count()
    
    total_visits = outdoor_visits + indoor_visits
    
    # Calculate daily average over the last 30 days from AttendanceLog
    thirty_days_ago = today - timedelta(days=30)
    total_visits_last_30_days = AttendanceLog.objects.filter(
        check_in_time__date__gte=thirty_days_ago,
        check_in_time__date__lte=today
    ).count()
    
    # Fallback to session logs if no attendance data
    if total_visits_last_30_days == 0:
        total_visits_last_30_days = SessionLog.objects.filter(
            date_used__date__gte=thirty_days_ago,
            date_used__date__lte=today
        ).count()
    
    daily_average = round(total_visits_last_30_days / 30, 1) if total_visits_last_30_days > 0 else 0

    # Weekly attendance trend (last 7 days) - using AttendanceLog with fallback
    weekly_trend = []
    for i in range(7):
        day = today - timedelta(days=i)
        
        # Try AttendanceLog first
        daily_checkins = AttendanceLog.objects.filter(check_in_time__date=day).count()
        
        # Fallback to SessionLog if no attendance data
        if daily_checkins == 0:
            daily_checkins = SessionLog.objects.filter(date_used__date=day).count()
        
        # Get indoor/outdoor breakdown for this day
        indoor_day = AttendanceLog.objects.filter(
            check_in_time__date=day,
            visit_type="indoor"
        ).count()
        
        outdoor_day = AttendanceLog.objects.filter(
            check_in_time__date=day,
            visit_type="outdoor"
        ).count()
        
        # Fallback for indoor/outdoor if needed
        if indoor_day == 0 and outdoor_day == 0 and daily_checkins > 0:
            indoor_day = SessionLog.objects.filter(
                date_used__date=day,
                membership__plan__membership_type="indoor"
            ).count()
            outdoor_day = SessionLog.objects.filter(
                date_used__date=day,
                membership__plan__membership_type="outdoor"
            ).count()

        weekly_trend.append(
            {
                "date": day.isoformat(),
                "visits": daily_checkins,
                "indoor": indoor_day,
                "outdoor": outdoor_day,
                "day": day.strftime("%A"),
            }
        )
    weekly_trend.reverse()

    # Monthly trend (last 30 days, grouped by week) - using AttendanceLog with fallback
    monthly_trend = []
    for week in range(4):
        week_start = today - timedelta(days=today.weekday() + (week * 7))
        week_end = week_start + timedelta(days=6)

        # Try AttendanceLog first
        week_checkins = AttendanceLog.objects.filter(
            check_in_time__date__range=[week_start, week_end]
        ).count()
        
        # Fallback to SessionLog if no attendance data
        if week_checkins == 0:
            week_checkins = SessionLog.objects.filter(
                date_used__date__range=[week_start, week_end]
            ).count()

        monthly_trend.append(
            {
                "week": f"Week {4-week}",
                "visits": week_checkins,
                "startDate": week_start.isoformat(),
                "endDate": week_end.isoformat(),
            }
        )
    monthly_trend.reverse()

    # Get currently active members by type
    currently_active_indoor = AttendanceLog.objects.filter(
        check_in_time__date=today,
        visit_type="indoor",
        status__in=['checked_in', 'active'],
        check_out_time__isnull=True
    ).count()
    
    currently_active_outdoor = AttendanceLog.objects.filter(
        check_in_time__date=today,
        visit_type="outdoor", 
        status__in=['checked_in', 'active'],
        check_out_time__isnull=True
    ).count()
    
    currently_active_total = currently_active_indoor + currently_active_outdoor

    # Return structure matching frontend expectations
    return {
        # FRONTEND DASHBOARD DATA - Matching expected structure
        "membershipData": {
            "indoor": indoor_members,
            "outdoor": outdoor_members,
            "renewalsDue": expiring_soon,
            "paymentOverdue": overdue_payments,
        },
        "bookingData": {
            "groupSessions": group_sessions,
            "oneOnOneSessions": one_on_one_sessions,
        },
        "attendanceData": {
            "indoorVisits": indoor_visits,
            "outdoorVisits": outdoor_visits,
            "totalVisits": total_visits,
            "dailyAverage": daily_average,
            "currentlyActive": {
                "total": currently_active_total,
                "indoor": currently_active_indoor,
                "outdoor": currently_active_outdoor
            },
            "weeklyTrend": weekly_trend,
            "monthlyTrend": monthly_trend,
        },
        "feedbackData": {
            "openTickets": 0,  # You'll need to implement this
            "avgResolutionTime": "0 days",  # You'll need to implement this
        },
        
        # MEMBER STATISTICS - Enhanced with proper categorization
        "memberStats": {
            "totalMembers": total_members,
            "activeMembers": active_members,
            "newMembersThisMonth": new_members_this_month,
            "inactiveMembers": inactive_members,
            "suspendedMembers": suspended_members,
            "checkedInToday": checked_in_today,
            "membershipTypes": {
                "indoor": indoor_members,
                "outdoor": outdoor_members,
                "total": indoor_members + outdoor_members
            },
            "planBreakdown": {
                "daily": daily_memberships,
                "monthly": monthly_memberships,
                "sessionBased": session_based_memberships,
                "annual": annual_memberships,
                "total": daily_memberships + monthly_memberships + session_based_memberships + annual_memberships
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
        # QUICK METRICS - Enhanced for stat cards
        "quickMetrics": {
            "checkedInToday": checked_in_today,
            "expiringMemberships": expiring_soon,
            "equipmentIssues": 0,  # You'll need to implement this
            "feedbackReceived": 0,  # You'll need to implement this
        },
        
        # STAT CARDS DATA - Specific data structure for frontend stat cards
        "statCards": {
            "attendance": {
                "title": "Today's Attendance",
                "total": total_visits,
                "indoor": {
                    "count": indoor_visits,
                    "active": currently_active_indoor,
                    "label": "Indoor Members"
                },
                "outdoor": {
                    "count": outdoor_visits, 
                    "active": currently_active_outdoor,
                    "label": "Outdoor Members"
                },
                "trend": "up" if total_visits > daily_average else "down",
                "change": f"{abs(total_visits - daily_average):.1f} vs avg"
            },
            "members": {
                "title": "Member Overview",
                "total": total_members,
                "active": active_members,
                "inactive": inactive_members,
                "suspended": suspended_members,
                "newThisMonth": new_members_this_month,
                "indoor": indoor_members,
                "outdoor": outdoor_members
            },
            "revenue": {
                "title": "Monthly Revenue", 
                "total": float(monthly_revenue),
                "pending": pending_payments,
                "overdue": overdue_payments,
                "paid": paid_members
            },
            "memberships": {
                "title": "Active Memberships",
                "total": indoor_members + outdoor_members,
                "expiring": expiring_soon,
                "daily": daily_memberships,
                "monthly": monthly_memberships,
                "sessionBased": session_based_memberships,
                "annual": annual_memberships
            }
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
            },
            "planTypes": {
                "daily": daily_memberships,
                "monthly": monthly_memberships,
                "sessionBased": session_based_memberships,
                "annual": annual_memberships,
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
