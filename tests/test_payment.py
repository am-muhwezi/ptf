#!/usr/bin/env python
"""
Test script for cash payment functionality
"""

import os
import sys
import django

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ptf.settings')
django.setup()

from django.contrib.auth import get_user_model
from members.models import Member
from memberships.models import Membership, MembershipPlan
from payments.models import Payment

User = get_user_model()

def test_data_exists():
    """Check if test data exists"""
    print("=== Checking Test Data ===")
    print(f"Members: {Member.objects.count()}")
    print(f"Memberships: {Membership.objects.count()}")
    print(f"Payments: {Payment.objects.count()}")
    print(f"Users: {User.objects.count()}")
    
    if Member.objects.exists():
        member = Member.objects.first()
        print(f"Sample Member: {member.id} - {member.first_name} {member.last_name}")
        
    if Membership.objects.exists():
        membership = Membership.objects.first()
        print(f"Sample Membership: {membership.id} - Member ID: {membership.member.id}")
        print(f"Membership Status: {membership.status}")
        print(f"Plan: {membership.plan.plan_name}")
        
    if User.objects.exists():
        user = User.objects.first()
        print(f"Sample User: {user.id} - {user.username} - is_staff: {user.is_staff}")

def create_test_data():
    """Create some test data if none exists"""
    print("\n=== Creating Test Data ===")
    
    # Create a user
    user, created = User.objects.get_or_create(
        username='testadmin',
        defaults={
            'email': 'admin@test.com',
            'first_name': 'Test',
            'last_name': 'Admin',
            'is_staff': True,
            'is_superuser': False
        }
    )
    if created:
        user.set_password('testpass123')
        user.save()
        print(f"Created user: {user.username}")
    else:
        print(f"User already exists: {user.username}")
    
    # Create a member
    member, created = Member.objects.get_or_create(
        email='testmember@test.com',
        defaults={
            'first_name': 'Test',
            'last_name': 'Member',
            'phone': '+254700123456',
            'status': 'active'
        }
    )
    if created:
        print(f"Created member: {member.id} - {member.first_name} {member.last_name}")
    else:
        print(f"Member already exists: {member.id} - {member.first_name} {member.last_name}")
    
    # Create a membership plan
    plan, created = MembershipPlan.objects.get_or_create(
        plan_code='TEST_INDOOR_MONTHLY',
        defaults={
            'plan_name': 'Test Indoor Monthly',
            'membership_type': 'indoor',
            'plan_type': 'monthly',
            'monthly_fee': 5000,
            'sessions_per_week': 4,
            'duration_weeks': 4
        }
    )
    if created:
        print(f"Created plan: {plan.plan_name}")
    else:
        print(f"Plan already exists: {plan.plan_name}")
    
    # Create a membership
    if not Membership.objects.filter(member=member).exists():
        from datetime import date, timedelta
        membership = Membership.objects.create(
            member=member,
            plan=plan,
            status='active',
            total_sessions_allowed=16,  # 4 weeks * 4 sessions
            sessions_used=0,
            start_date=date.today(),
            end_date=date.today() + timedelta(weeks=4),
            amount_paid=5000,
            payment_status='pending'
        )
        print(f"Created membership: {membership.id} - {membership.member.first_name} {membership.member.last_name}")
    else:
        membership = Membership.objects.filter(member=member).first()
        print(f"Membership already exists: {membership.id}")
    
    return {
        'user': user,
        'member': member,
        'membership': membership,
        'plan': plan
    }

def simulate_cash_payment(member_id, membership_id):
    """Simulate a cash payment using the service directly"""
    print(f"\n=== Testing Cash Payment ===")
    print(f"Member ID: {member_id}")
    print(f"Membership ID: {membership_id}")
    
    from payments.services.payment_service import PaymentService
    
    # Test the payment service directly
    try:
        payment, error = PaymentService.record_manual_payment(
            membership_id=membership_id,
            amount=5000,
            payment_method_name='cash',
            reference_number='CASH-TEST-20250824-001',
            notes='Test cash payment from admin',
            recorded_by='Test Admin',
            payment_date=None
        )
        
        if error:
            print(f"❌ Payment failed: {error}")
            return False
        else:
            print(f"✅ Payment successful!")
            print(f"Payment ID: {payment.payment_id}")
            print(f"Amount: {payment.amount}")
            print(f"Status: {payment.status}")
            print(f"Reference: {payment.external_reference}")
            print(f"Notes: {payment.notes}")
            return True
            
    except Exception as e:
        print(f"❌ Exception during payment: {str(e)}")
        return False

if __name__ == '__main__':
    print("🧪 Testing Cash Payment System")
    print("=" * 50)
    
    # Check existing data
    test_data_exists()
    
    # Create test data if needed
    test_data = create_test_data()
    
    # Test cash payment
    success = simulate_cash_payment(
        member_id=test_data['member'].id,
        membership_id=test_data['membership'].id
    )
    
    if success:
        print("\n✅ All tests passed! Cash payment system is working correctly.")
    else:
        print("\n❌ Tests failed. Please check the errors above.")
    
    # Show final status
    print(f"\n=== Final Status ===")
    membership = Membership.objects.get(id=test_data['membership'].id)
    print(f"Membership Payment Status: {membership.payment_status}")
    recent_payments = Payment.objects.filter(membership_id=membership.id).order_by('-created_at')[:3]
    print(f"Recent Payments: {recent_payments.count()}")
    for payment in recent_payments:
        print(f"  - {payment.payment_id}: {payment.amount} KES ({payment.status})")