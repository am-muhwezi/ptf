#!/usr/bin/env python3

import os
import sys
import django
from datetime import datetime, timedelta, date
from decimal import Decimal
from faker import Faker
import random

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ptf.settings')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
django.setup()

from members.models import Location, Member, PhysicalProfile
from memberships.models import MembershipPlan, Membership, SessionLog

fake = Faker()

def create_locations():
    """Create test locations for outdoor activities"""
    locations_data = [
        {"name": "Uhuru Park Tennis Courts", "code": "UPTC"},
        {"name": "Ngong Forest", "code": "NGF"},
        {"name": "Karura Forest", "code": "KF"},
        {"name": "City Park", "code": "CP"},
        {"name": "Nairobi Arboretum", "code": "NAR"},
        {"name": "Athi River Courts", "code": "ARC"},
    ]
    
    created_locations = []
    for loc_data in locations_data:
        location, created = Location.objects.get_or_create(
            code=loc_data["code"],
            defaults={"name": loc_data["name"]}
        )
        created_locations.append(location)
        if created:
            print(f"Created location: {location}")
    
    return created_locations

def create_membership_plans():
    """Create comprehensive membership plans for both indoor and outdoor"""
    plans_data = [
        # Indoor Plans
        {
            "plan_name": "Indoor Daily Drop-in",
            "plan_code": "IND_DAILY",
            "membership_type": "indoor",
            "plan_type": "daily",
            "sessions_per_week": 1,
            "duration_weeks": 1,
            "per_session_fee": Decimal("1500.00"),
            "description": "Single indoor training session"
        },
        {
            "plan_name": "Indoor 2x per Week",
            "plan_code": "IND_2X_WEEK",
            "membership_type": "indoor",
            "plan_type": "2_sessions_week",
            "sessions_per_week": 2,
            "duration_weeks": 4,
            "monthly_fee": Decimal("8000.00"),
            "per_session_fee": Decimal("1000.00"),
            "description": "Indoor training 2 times per week"
        },
        {
            "plan_name": "Indoor 3x per Week",
            "plan_code": "IND_3X_WEEK",
            "membership_type": "indoor",
            "plan_type": "3_sessions_week",
            "sessions_per_week": 3,
            "duration_weeks": 4,
            "monthly_fee": Decimal("11000.00"),
            "per_session_fee": Decimal("900.00"),
            "description": "Indoor training 3 times per week"
        },
        {
            "plan_name": "Indoor Unlimited Monthly",
            "plan_code": "IND_UNLIMITED",
            "membership_type": "indoor",
            "plan_type": "monthly",
            "sessions_per_week": 7,
            "duration_weeks": 4,
            "monthly_fee": Decimal("15000.00"),
            "per_session_fee": Decimal("600.00"),
            "description": "Unlimited indoor training sessions"
        },
        {
            "plan_name": "Indoor Quarterly",
            "plan_code": "IND_QUARTERLY",
            "membership_type": "indoor",
            "plan_type": "quarterly",
            "sessions_per_week": 3,
            "duration_weeks": 12,
            "monthly_fee": Decimal("10000.00"),
            "per_session_fee": Decimal("800.00"),
            "description": "3-month indoor membership package"
        },
        {
            "plan_name": "Indoor Annual",
            "plan_code": "IND_ANNUAL",
            "membership_type": "indoor",
            "plan_type": "annual",
            "sessions_per_week": 4,
            "duration_weeks": 52,
            "monthly_fee": Decimal("12000.00"),
            "per_session_fee": Decimal("750.00"),
            "description": "Annual indoor membership with premium benefits"
        },
        
        # Outdoor Plans
        {
            "plan_name": "Outdoor Daily Drop-in",
            "plan_code": "OUT_DAILY",
            "membership_type": "outdoor",
            "plan_type": "daily",
            "sessions_per_week": 1,
            "duration_weeks": 1,
            "per_session_fee": Decimal("2000.00"),
            "description": "Single outdoor training session"
        },
        {
            "plan_name": "Outdoor 1x per Week",
            "plan_code": "OUT_1X_WEEK",
            "membership_type": "outdoor",
            "plan_type": "1_session_week",
            "sessions_per_week": 1,
            "duration_weeks": 4,
            "monthly_fee": Decimal("6000.00"),
            "per_session_fee": Decimal("1500.00"),
            "description": "Outdoor training once per week"
        },
        {
            "plan_name": "Outdoor 2x per Week",
            "plan_code": "OUT_2X_WEEK",
            "membership_type": "outdoor",
            "plan_type": "2_sessions_week",
            "sessions_per_week": 2,
            "duration_weeks": 4,
            "monthly_fee": Decimal("10000.00"),
            "per_session_fee": Decimal("1250.00"),
            "description": "Outdoor training 2 times per week"
        },
        {
            "plan_name": "Outdoor 3x per Week",
            "plan_code": "OUT_3X_WEEK",
            "membership_type": "outdoor",
            "plan_type": "3_sessions_week",
            "sessions_per_week": 3,
            "duration_weeks": 4,
            "monthly_fee": Decimal("13500.00"),
            "per_session_fee": Decimal("1125.00"),
            "description": "Outdoor training 3 times per week"
        },
        {
            "plan_name": "Outdoor Weekly Package",
            "plan_code": "OUT_WEEKLY",
            "membership_type": "outdoor",
            "plan_type": "weekly",
            "sessions_per_week": 2,
            "duration_weeks": 1,
            "weekly_fee": Decimal("3500.00"),
            "per_session_fee": Decimal("1750.00"),
            "description": "Weekly outdoor training package"
        },
        {
            "plan_name": "Outdoor Bi-Annual",
            "plan_code": "OUT_BIANNUAL",
            "membership_type": "outdoor",
            "plan_type": "bi-annual",
            "sessions_per_week": 2,
            "duration_weeks": 26,
            "monthly_fee": Decimal("9000.00"),
            "per_session_fee": Decimal("1100.00"),
            "description": "6-month outdoor membership package"
        },
    ]
    
    created_plans = []
    for plan_data in plans_data:
        plan, created = MembershipPlan.objects.get_or_create(
            plan_code=plan_data["plan_code"],
            defaults=plan_data
        )
        created_plans.append(plan)
        if created:
            print(f"Created plan: {plan}")
    
    return created_plans

def create_test_member(membership_type, locations, plans):
    """Create a single test member with realistic data"""
    
    # Generate realistic personal data
    first_name = fake.first_name()
    last_name = fake.last_name()
    email = f"{first_name.lower()}.{last_name.lower()}@{fake.free_email_domain()}"
    
    # Create member
    member = Member.objects.create(
        first_name=first_name,
        last_name=last_name,
        email=email,
        phone=f"+254{fake.random_int(min=700000000, max=799999999)}",
        address=fake.address(),
        date_of_birth=fake.date_of_birth(minimum_age=16, maximum_age=65),
        id_passport=f"ID{fake.random_int(min=10000000, max=99999999)}",
        blood_group=random.choice([choice[0] for choice in Member.BLOOD_GROUPS]),
        emergency_contact=fake.name(),
        emergency_phone=f"+254{fake.random_int(min=700000000, max=799999999)}",
        medical_conditions=fake.text(max_nb_chars=200) if random.choice([True, False]) else "",
        status=random.choices(
            ["active", "inactive", "suspended"],
            weights=[85, 10, 5],
            k=1
        )[0],
        total_visits=random.randint(0, 200),
        last_visit=fake.date_time_this_year() if random.choice([True, False]) else None
    )
    
    # Create physical profile for indoor members only
    if membership_type == "indoor":
        PhysicalProfile.objects.create(
            member=member,
            height=random.uniform(150.0, 200.0),
            weight=random.uniform(50.0, 120.0),
            body_fat_percentage=random.uniform(8.0, 35.0),
            fitness_level=random.choice([choice[0] for choice in PhysicalProfile.FITNESS_LEVELS]),
            strength_test_results=f"Bench Press: {random.randint(40, 120)}kg, Deadlift: {random.randint(60, 180)}kg",
            cardio_test_results=f"5K Run: {random.randint(18, 35)} minutes, VO2 Max: {random.randint(35, 65)}",
            flexibility_test_results=f"Sit and Reach: {random.randint(-5, 25)}cm",
            short_term_goals="Improve strength and endurance",
            long_term_goals="Complete a marathon and achieve target body composition"
        )
    
    # Create membership(s)
    relevant_plans = [p for p in plans if p.membership_type == membership_type]
    selected_plan = random.choice(relevant_plans)
    
    # Generate realistic membership dates
    start_date = fake.date_between(start_date='-6M', end_date='today')
    if selected_plan.plan_type == 'daily':
        end_date = start_date
    elif selected_plan.plan_type == 'weekly':
        end_date = start_date + timedelta(weeks=1)
    elif selected_plan.plan_type == 'monthly':
        end_date = start_date + timedelta(weeks=4)
    elif selected_plan.plan_type == 'quarterly':
        end_date = start_date + timedelta(weeks=12)
    elif selected_plan.plan_type == 'bi-annual':
        end_date = start_date + timedelta(weeks=26)
    elif selected_plan.plan_type == 'annual':
        end_date = start_date + timedelta(weeks=52)
    else:
        # Session-based plans
        end_date = start_date + timedelta(weeks=selected_plan.duration_weeks)
    
    # Calculate total sessions allowed
    total_sessions = selected_plan.sessions_per_week * selected_plan.duration_weeks
    sessions_used = random.randint(0, min(total_sessions, int(total_sessions * 0.8)))
    
    # Determine amount paid based on plan
    if selected_plan.monthly_fee > 0:
        amount_paid = selected_plan.monthly_fee
    elif selected_plan.weekly_fee > 0:
        amount_paid = selected_plan.weekly_fee
    else:
        amount_paid = selected_plan.per_session_fee * total_sessions
    
    membership = Membership.objects.create(
        member=member,
        plan=selected_plan,
        location=random.choice(locations) if membership_type == "outdoor" else None,
        status=random.choices(
            ["active", "suspended", "expired", "cancelled"],
            weights=[70, 5, 20, 5],
            k=1
        )[0],
        total_sessions_allowed=total_sessions,
        sessions_used=sessions_used,
        start_date=start_date,
        end_date=end_date,
        amount_paid=amount_paid,
        payment_status=random.choices(
            ["paid", "pending", "overdue", "partial"],
            weights=[70, 10, 15, 5],
            k=1
        )[0],
        next_billing_date=end_date + timedelta(days=7) if end_date > date.today() else None
    )
    
    # Create session logs for used sessions
    for i in range(sessions_used):
        session_date = fake.date_time_between(
            start_date=start_date,
            end_date=min(datetime.now().date(), end_date)
        )
        SessionLog.objects.create(
            membership=membership,
            session_type=random.choices(
                ["regular", "trial", "makeup", "complimentary"],
                weights=[85, 5, 8, 2],
                k=1
            )[0],
            notes=fake.sentence() if random.choice([True, False]) else "",
            created_at=session_date
        )
    
    return member, membership

def main():
    print("Creating test data...")
    
    # Create locations
    print("\n=== Creating Locations ===")
    locations = create_locations()
    
    # Create membership plans
    print("\n=== Creating Membership Plans ===")
    plans = create_membership_plans()
    
    # Create indoor members
    print("\n=== Creating Indoor Members ===")
    indoor_members = []
    for i in range(15):  # Create 15 indoor members
        member, membership = create_test_member("indoor", locations, plans)
        indoor_members.append((member, membership))
        print(f"Created indoor member: {member.full_name} - Plan: {membership.plan.plan_name}")
    
    # Create outdoor members
    print("\n=== Creating Outdoor Members ===")
    outdoor_members = []
    for i in range(12):  # Create 12 outdoor members
        member, membership = create_test_member("outdoor", locations, plans)
        outdoor_members.append((member, membership))
        print(f"Created outdoor member: {member.full_name} - Plan: {membership.plan.plan_name} - Location: {membership.location}")
    
    print(f"\n=== Summary ===")
    print(f"Total locations created: {len(locations)}")
    print(f"Total membership plans created: {len(plans)}")
    print(f"Total indoor members created: {len(indoor_members)}")
    print(f"Total outdoor members created: {len(outdoor_members)}")
    print(f"Total members created: {len(indoor_members) + len(outdoor_members)}")
    
    # Show some stats
    print(f"\n=== Statistics ===")
    active_memberships = Membership.objects.filter(status='active').count()
    expired_memberships = Membership.objects.filter(status='expired').count()
    total_sessions_used = sum([m.sessions_used for _, m in indoor_members + outdoor_members])
    
    print(f"Active memberships: {active_memberships}")
    print(f"Expired memberships: {expired_memberships}")
    print(f"Total sessions logged: {total_sessions_used}")
    
    print("\n✅ Test data creation completed!")

if __name__ == '__main__':
    main()