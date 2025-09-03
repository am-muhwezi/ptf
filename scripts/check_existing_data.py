#!/usr/bin/env python3

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ptf.settings')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
django.setup()

from members.models import Location, Member
from memberships.models import MembershipPlan

def main():
    print('=== LOCATIONS ===')
    locations = Location.objects.all()
    if locations.exists():
        for loc in locations:
            print(f'{loc.code}: {loc.name}')
    else:
        print('No locations found')
    
    print('\n=== MEMBERSHIP PLANS ===')
    plans = MembershipPlan.objects.all()
    if plans.exists():
        for plan in plans:
            print(f'{plan.plan_code}: {plan.plan_name} ({plan.membership_type}) - {plan.sessions_per_week} sessions/week - ${plan.monthly_fee}/month - ${plan.per_session_fee}/session')
    else:
        print('No membership plans found')
    
    print(f'\n=== EXISTING MEMBERS ===')
    members = Member.objects.all()
    print(f'Total members: {members.count()}')

if __name__ == '__main__':
    main()