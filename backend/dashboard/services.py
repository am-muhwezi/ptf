from django.utils import timezone
from datetime import timedelta
from members.models import Member
from bookings.models import Booking


def get_dashboard_statistics():
    """
    Fetches statistics for the dashboard using the correct model fields.
    """
    today = timezone.now()

    # --- Membership Stats (Using the 'Member' model) ---
    # An active member is one whose 'expiry' date is in the future.
    active_members = Member.objects.filter(active=True)

    indoor_members = active_members.filter(membership_type="indoor").count()
    outdoor_members = active_members.filter(membership_type="outdoor").count()

    # Renewals are calculated from active members expiring in the next 30 days.
    renewals_due = active_members.filter(
        registrationDate__lte=today - timedelta(days=30),
        registrationDate__gte=today - timedelta(days=60),
    ).count()

    # --- Booking & Attendance Stats (Using the 'Booking' model) ---
    todays_bookings = Booking.objects.filter(booking_date__date=today.date())

    # Match the exact choices in your Booking model
    group_sessions = todays_bookings.filter(
        status="confirmed", session_type="Group Class"
    ).count()
    one_on_one_sessions = todays_bookings.filter(
        status="confirmed", session_type="One-on-One"
    ).count()

    # Query through the 'member' relationship to find their membership type
    attended_bookings_today = todays_bookings.filter(status="Completed")
    indoor_visits = attended_bookings_today.filter(
        member__membership_type="indoor"
    ).count()
    outdoor_visits = attended_bookings_today.filter(
        member__membership_type="outdoor"
    ).count()

    # --- Final JSON data structure ---
    stats = {
        "membershipData": {
            "indoor": indoor_members,
            "outdoor": outdoor_members,
            "renewalsDue": renewals_due,
            "paymentOverdue": 0,  # Placeholder
        },
        "bookingData": {
            "groupSessions": group_sessions,
            "oneOnOneSessions": one_on_one_sessions,
            "trainersAvailable": 0,  # Placeholder
            "waitlistRequests": 0,  # Placeholder
        },
        "attendanceData": {
            "indoorVisits": indoor_visits,
            "outdoorVisits": outdoor_visits,
        },
        "feedbackData": {
            "openTickets": 0,  # Placeholder
            "avgResolutionTime": "0",  # Placeholder
        },
        "inventoryData": {
            "availableStock": 0,  # Placeholder
            "lowStockAlerts": 0,  # Placeholder
        },
    }

    return stats
