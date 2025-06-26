from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q
from django.utils import timezone
from datetime import timedelta
from .models import Member, Membership, Attendance
from .serializers import MemberSerializer, MembershipSerializer, AttendanceSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def member_list(request):
    """Get all members with optional filtering"""
    try:
        members = Member.objects.all()
        
        # Apply filters
        search = request.GET.get('search', '')
        if search:
            members = members.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(email__icontains=search) |
                Q(id__icontains=search)
            )
        
        status_filter = request.GET.get('status', '')
        if status_filter:
            members = members.filter(status=status_filter)
            
        serializer = MemberSerializer(members, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': 'Failed to fetch members', 'detail': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def member_create(request):
    """Create a new member"""
    try:
        serializer = MemberSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        return Response(
            {'error': 'Failed to create member', 'detail': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def member_search(request):
    """Search members"""
    try:
        query = request.GET.get('q', '')
        if not query:
            return Response([], status=status.HTTP_200_OK)
            
        members = Member.objects.filter(
            Q(first_name__icontains=query) |
            Q(last_name__icontains=query) |
            Q(email__icontains=query) |
            Q(id__icontains=query)
        )[:10]  # Limit to 10 results
        
        serializer = MemberSerializer(members, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': 'Failed to search members', 'detail': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def member_checkin(request):
    """Check-in a member"""
    try:
        member_id = request.data.get('memberId')
        membership_type = request.data.get('membershipType', 'indoor')
        
        if not member_id:
            return Response(
                {'error': 'Member ID is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            member = Member.objects.get(id=member_id)
        except Member.DoesNotExist:
            return Response(
                {'error': 'Member not found'},
                status=status.HTTP_404_NOT_FOUND
            )
            
        # Create attendance record
        attendance = Attendance.objects.create(
            member=member,
            membership_type=membership_type,
            check_in_time=timezone.now(),
            date=timezone.now().date()
        )
        
        serializer = AttendanceSerializer(attendance)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response(
            {'error': 'Failed to check-in member', 'detail': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def indoor_memberships(request):
    """Get indoor memberships"""
    try:
        members = Member.objects.filter(
            membership_type__in=['indoor', 'both']
        ).prefetch_related('memberships')
        
        # Apply filters
        search = request.GET.get('search', '')
        if search:
            members = members.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(email__icontains=search) |
                Q(id__icontains=search)
            )
        
        status_filter = request.GET.get('status', '')
        if status_filter:
            members = members.filter(status=status_filter)
            
        # Prepare response data with membership details
        response_data = []
        for member in members:
            latest_membership = member.memberships.filter(is_active=True).first()
            
            member_data = {
                'id': member.id,
                'firstName': member.first_name,
                'lastName': member.last_name,
                'email': member.email,
                'phone': member.phone,
                'membershipType': member.membership_type,
                'status': member.status,
                'joinDate': member.registration_date.date(),
                'expiryDate': latest_membership.expiry_date if latest_membership else None,
                'planType': latest_membership.plan_type if latest_membership else 'No Plan',
                'amount': float(latest_membership.amount) if latest_membership else 0,
                'paymentStatus': latest_membership.payment_status if latest_membership else 'pending',
                'lastVisit': member.attendance_records.first().date if member.attendance_records.exists() else None,
                'totalVisits': member.attendance_records.count()
            }
            response_data.append(member_data)
            
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': 'Failed to fetch indoor memberships', 'detail': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )