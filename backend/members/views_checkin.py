from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.utils import timezone
from django.db import transaction
from django.db.models import F, Q
from django.shortcuts import get_object_or_404
from django.core.cache import cache
from .models import Member
from attendance.models import AttendanceLog


@api_view(["POST"])
def checkin(request, member_id):
    """Optimized check-in endpoint with member ID in URL"""
    try:
        # Single optimized query with all needed relationships
        member = Member.objects.select_related().prefetch_related(
            'memberships__plan'
        ).get(id=member_id, status="active")

        # Get active membership in single query
        active_membership = member.memberships.filter(status='active').select_related('plan').first()
        if not active_membership:
            return Response(
                {"error": f"{member.first_name} {member.last_name} has no active membership"},
                status=400
            )

        visit_type = active_membership.plan.membership_type

        # Consolidated payment status checks
        payment_status = active_membership.payment_status
        if payment_status in ['pending', 'overdue']:
            status_messages = {
                'pending': "Cannot check-in: Payment is still pending. Please complete payment first.",
                'overdue': "Cannot check-in: Payment is overdue. Please update payment to continue."
            }
            return Response({"error": status_messages[payment_status]}, status=400)

        # Check if membership is expired
        if active_membership.is_expired:
            return Response(
                {"error": "Membership has expired. Please renew to continue."},
                status=400
            )

        # Check sessions remaining
        if active_membership.sessions_used >= active_membership.total_sessions_allowed:
            return Response(
                {"error": "No sessions remaining on this membership."},
                status=400
            )

        # Optimized today's check-in query with database-level date comparison
        today = timezone.now().date()
        if AttendanceLog.objects.filter(
            member=member,
            check_in_time__date=today
        ).exists():
            return Response(
                {"error": f"{member.first_name} {member.last_name} has already checked in today"},
                status=400,
            )

        # Use database transaction for atomicity and performance
        with transaction.atomic():
            # Create attendance
            attendance = AttendanceLog.objects.create(
                member=member,
                visit_type=visit_type,
                status="checked_in"
            )

            # Update member stats using F() expressions to avoid race conditions
            Member.objects.filter(id=member.id).update(
                total_visits=F('total_visits') + 1,
                last_visit=timezone.now()
            )

            # Update session count atomically
            active_membership.sessions_used = F('sessions_used') + 1
            active_membership.save(update_fields=['sessions_used'])

            # Calculate sessions remaining (refresh from db for accurate count)
            active_membership.refresh_from_db()
            sessions_remaining = (
                active_membership.total_sessions_allowed - active_membership.sessions_used
            )

        return Response({
            "message": f"✅ {member.first_name} {member.last_name} checked in successfully",
            "visit_type": visit_type,
            "sessions_remaining": sessions_remaining,
            "check_in_time": attendance.check_in_time.isoformat(),
        })

    except Member.DoesNotExist:
        return Response({"error": "Member not found or inactive"}, status=404)
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(["POST"])
def checkout(request, member_id):
    """Simple check-out with member ID in URL"""
    try:
        member = Member.objects.get(id=member_id)

        # Find active check-in
        attendance = AttendanceLog.objects.filter(
            member=member, check_out_time__isnull=True
        ).first()

        if not attendance:
            return Response(
                {"error": f"{member.first_name} {member.last_name} is not checked in"},
                status=400,
            )

        # Check out
        attendance.check_out_time = timezone.now()
        attendance.status = "checked_out"
        attendance.save()

        return Response(
            {
                "success": True,
                "message": f"✅ {member.first_name} {member.last_name} checked out successfully",
                "member_name": f"{member.first_name} {member.last_name}",
                "duration": attendance.formatted_duration,
                "visit_type": attendance.visit_type,
            }
        )

    except Member.DoesNotExist:
        return Response({"error": "Member not found"}, status=404)
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(['GET'])
def get_member_detail(request, member_id):
    """
    Optimized endpoint to get single member details by ID
    Fixes the 404 error for getMemberById calls
    """
    try:
        # Optimized query with select_related for performance
        member = get_object_or_404(
            Member.objects.select_related().prefetch_related(
                'memberships__plan'
            ),
            id=member_id,
            status='active'
        )

        # Get active membership for payment status check
        active_membership = member.memberships.filter(status='active').first()

        # Build optimized response with only essential data for check-in
        member_data = {
            'id': member.id,
            'first_name': member.first_name,
            'last_name': member.last_name,
            'email': member.email,
            'phone': member.phone,
            'status': member.status,
            'membership_type': active_membership.plan.membership_type if active_membership else None,
            'payment_status': active_membership.payment_status if active_membership else 'unknown',
            'sessions_remaining': (
                active_membership.total_sessions_allowed - active_membership.sessions_used
                if active_membership else 0
            ),
            'membership_expired': active_membership.is_expired if active_membership else True
        }

        return Response(member_data)

    except Exception as e:
        return Response(
            {'error': 'Failed to retrieve member details'},
            status=500
        )


@api_view(['GET'])
def search_members_optimized(request):
    """
    Ultra-optimized member search endpoint with caching
    """
    query = request.GET.get('q', '').strip()
    limit = min(int(request.GET.get('limit', 10)), 20)  # Max 20 results for performance

    if len(query) < 2:
        return Response({
            'results': [],
            'message': 'Query must be at least 2 characters'
        })

    # Check cache first (5-minute cache for search results)
    cache_key = f"member_search_{query.lower()}_{limit}"
    cached_result = cache.get(cache_key)
    if cached_result:
        # Add cache hit indicator for performance monitoring
        cached_result['cached'] = True
        return Response(cached_result)

    # Performance timing
    import time
    start_time = time.time()

    try:
        # Ultra-optimized search query - only fetch needed fields
        members = Member.objects.filter(
            status='active'
        ).only('id', 'first_name', 'last_name').prefetch_related(
            'memberships__plan'
        )

        # Search across multiple fields (indexed fields only for performance)
        search_filter = (
            Q(first_name__icontains=query) |
            Q(last_name__icontains=query) |
            Q(phone__icontains=query)  # Removed email search - not commonly used
        )

        members = members.filter(search_filter)[:limit]

        # Build ultra-lightweight response - minimal JSON payload
        results = []
        for member in members:
            # Use .first() with prefetch_related for efficiency
            active_membership = next(
                (m for m in member.memberships.all() if m.status == 'active'),
                None
            )

            results.append({
                'id': member.id,
                'first_name': member.first_name,
                'last_name': member.last_name,
                'membership_type': active_membership.plan.membership_type if active_membership else 'unknown',
                'payment_status': active_membership.payment_status if active_membership else 'unknown'
            })

        # Calculate query time for performance monitoring
        query_time = round((time.time() - start_time) * 1000, 2)  # ms

        response_data = {
            'results': results,
            'count': len(results),
            'query': query,
            'cached': False,
            'query_time_ms': query_time
        }

        # Cache the result for 5 minutes
        cache.set(cache_key, response_data, 300)

        return Response(response_data)

    except Exception as e:
        return Response(
            {'error': 'Search failed'},
            status=500
        )
