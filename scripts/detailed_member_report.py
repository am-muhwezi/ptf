#!/usr/bin/env python3

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ptf.settings')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
django.setup()

from members.models import Location, Member, PhysicalProfile
from memberships.models import MembershipPlan, Membership, SessionLog
from django.db.models import Count, Sum, Avg

def main():
    print('=== DETAILED MEMBER REPORT ===\n')
    
    # Indoor Members Report
    print('=== INDOOR MEMBERS ===')
    indoor_memberships = Membership.objects.filter(plan__membership_type='indoor').select_related('member', 'plan')
    
    for membership in indoor_memberships:
        member = membership.member
        profile = getattr(member, 'physical_profile', None)
        
        print(f"👤 {member.full_name}")
        print(f"   📧 {member.email}")
        print(f"   📱 {member.phone}")
        print(f"   📅 DOB: {member.date_of_birth}")
        print(f"   🏋️ Plan: {membership.plan.plan_name}")
        print(f"   📊 Status: {membership.status}")
        print(f"   🎯 Sessions: {membership.sessions_used}/{membership.total_sessions_allowed}")
        print(f"   💰 Amount Paid: ${membership.amount_paid}")
        print(f"   📅 Period: {membership.start_date} to {membership.end_date}")
        
        if profile:
            print(f"   📏 Height: {profile.height}cm, Weight: {profile.weight}kg")
            print(f"   💪 Fitness Level: {profile.fitness_level}")
            if profile.bmi:
                print(f"   📈 BMI: {profile.bmi}")
        
        session_count = SessionLog.objects.filter(membership=membership).count()
        print(f"   📝 Session Logs: {session_count}")
        print()
    
    print('=== OUTDOOR MEMBERS ===')
    outdoor_memberships = Membership.objects.filter(plan__membership_type='outdoor').select_related('member', 'plan', 'location')
    
    for membership in outdoor_memberships:
        member = membership.member
        
        print(f"🏃 {member.full_name}")
        print(f"   📧 {member.email}")
        print(f"   📱 {member.phone}")
        print(f"   📅 DOB: {member.date_of_birth}")
        print(f"   🏋️ Plan: {membership.plan.plan_name}")
        print(f"   📍 Location: {membership.location}")
        print(f"   📊 Status: {membership.status}")
        print(f"   🎯 Sessions: {membership.sessions_used}/{membership.total_sessions_allowed}")
        print(f"   💰 Amount Paid: ${membership.amount_paid}")
        print(f"   📅 Period: {membership.start_date} to {membership.end_date}")
        
        session_count = SessionLog.objects.filter(membership=membership).count()
        print(f"   📝 Session Logs: {session_count}")
        print()
    
    # Summary Statistics
    print('=== STATISTICS SUMMARY ===')
    total_members = Member.objects.count()
    indoor_members = indoor_memberships.count()
    outdoor_members = outdoor_memberships.count()
    
    print(f"Total Members: {total_members}")
    print(f"Indoor Members: {indoor_members}")
    print(f"Outdoor Members: {outdoor_members}")
    
    # Membership Status Breakdown
    status_breakdown = Membership.objects.values('status').annotate(count=Count('status'))
    print(f"\nMembership Status Breakdown:")
    for status in status_breakdown:
        print(f"  {status['status'].title()}: {status['count']}")
    
    # Payment Status Breakdown
    payment_breakdown = Membership.objects.values('payment_status').annotate(count=Count('payment_status'))
    print(f"\nPayment Status Breakdown:")
    for payment in payment_breakdown:
        print(f"  {payment['payment_status'].title()}: {payment['count']}")
    
    # Location Usage for Outdoor Members
    location_usage = Membership.objects.filter(plan__membership_type='outdoor').values('location__name').annotate(count=Count('location')).order_by('-count')
    print(f"\nOutdoor Location Usage:")
    for loc in location_usage:
        print(f"  {loc['location__name']}: {loc['count']} members")
    
    # Plan Popularity
    plan_popularity = Membership.objects.values('plan__plan_name', 'plan__membership_type').annotate(count=Count('plan')).order_by('-count')
    print(f"\nPlan Popularity:")
    for plan in plan_popularity:
        print(f"  {plan['plan__plan_name']} ({plan['plan__membership_type']}): {plan['count']} members")
    
    # Session Usage Stats
    total_sessions_used = SessionLog.objects.count()
    avg_sessions_per_member = total_sessions_used / total_members if total_members > 0 else 0
    
    print(f"\nSession Usage:")
    print(f"  Total Sessions Logged: {total_sessions_used}")
    print(f"  Average Sessions per Member: {avg_sessions_per_member:.1f}")
    
    # Revenue Summary
    total_revenue = Membership.objects.aggregate(total=Sum('amount_paid'))['total'] or 0
    indoor_revenue = indoor_memberships.aggregate(total=Sum('amount_paid'))['total'] or 0
    outdoor_revenue = outdoor_memberships.aggregate(total=Sum('amount_paid'))['total'] or 0
    
    print(f"\nRevenue Summary:")
    print(f"  Total Revenue: ${total_revenue}")
    print(f"  Indoor Revenue: ${indoor_revenue}")
    print(f"  Outdoor Revenue: ${outdoor_revenue}")

if __name__ == '__main__':
    main()