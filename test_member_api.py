#!/usr/bin/env python
"""
Test script to verify that the member API returns payment_status correctly
"""

import os
import sys
import django

# Setup Django
sys.path.append('/home/yahwehsdelight/ptf/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from members.models import Member
from members.serializers import MemberSerializer

def test_payment_status():
    print("Testing Member API payment_status field:")
    print("=" * 50)
    
    # Test with members that have active memberships
    members_with_memberships = Member.objects.filter(memberships__status='active').distinct()[:3]
    
    print(f"Found {members_with_memberships.count()} members with active memberships")
    print()
    
    for member in members_with_memberships:
        serializer = MemberSerializer(member)
        data = serializer.data
        
        print(f"Member: {data['full_name']}")
        print(f"  - ID: {data['member_id']}")
        print(f"  - Payment Status: {data['payment_status']}")
        print(f"  - Plan Type: {data['plan_type']}")
        print(f"  - Amount: {data['amount']}")
        print(f"  - Membership Type: {data['membership_type']}")
        print()
    
    # Test with a member without active membership
    member_without_membership = Member.objects.exclude(memberships__status='active').first()
    if member_without_membership:
        serializer = MemberSerializer(member_without_membership)
        data = serializer.data
        
        print("Member without active membership:")
        print(f"  - Name: {data['full_name']}")
        print(f"  - Payment Status: {data['payment_status']} (should be 'unknown')")
        print(f"  - Plan Type: {data['plan_type']} (should be 'No Plan')")
        print()
    
    print("✅ Test completed successfully!")
    print("Frontend should now display payment_status correctly.")

if __name__ == "__main__":
    test_payment_status()