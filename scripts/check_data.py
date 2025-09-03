#!/usr/bin/env python
import os
import sys
import django

# Add the project root to the Python path
sys.path.insert(0, '/home/yahwehsdelight/ptf/backend')

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ptf.settings')
django.setup()

from memberships.models import MembershipPlan
from members.models import Location
from accounts.models import User
from members.models import Member
from bookings.models import Session

print('=== MEMBERSHIP PLANS ===')
plans = MembershipPlan.objects.all()
for plan in plans:
    print(f'{plan.id}: {plan.name} - ${plan.price} ({plan.duration_months} months) - {plan.membership_type}')

print('\n=== LOCATIONS ===')
locations = Location.objects.all()
for loc in locations:
    print(f'{loc.id}: {loc.name} - {loc.location_type}')

print('\n=== EXISTING MEMBERS COUNT ===')
print(f'Total members: {Member.objects.count()}')
indoor_members = Member.objects.filter(membership_plan__membership_type='indoor').count()
outdoor_members = Member.objects.filter(membership_plan__membership_type='outdoor').count()
print(f'Indoor members: {indoor_members}')
print(f'Outdoor members: {outdoor_members}')

print('\n=== SESSION TYPES ===')
sessions = Session.objects.values_list('session_type', flat=True).distinct()
for session in sessions:
    print(f'- {session}')