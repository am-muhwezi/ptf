import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ptf.settings')
django.setup()

from members.models import Member, Location
from memberships.models import MembershipPlan, Membership
from datetime import datetime, timedelta
from decimal import Decimal
import random

# Sample data
first_names = [
    'John', 'Jane', 'Michael', 'Sarah', 'David', 'Lisa', 'James', 'Maria', 'Robert', 'Jennifer',
    'William', 'Linda', 'Richard', 'Patricia', 'Joseph', 'Elizabeth', 'Thomas', 'Susan', 'Charles', 'Jessica',
    'Christopher', 'Karen', 'Daniel', 'Nancy', 'Matthew', 'Betty', 'Anthony', 'Helen', 'Mark', 'Sandra',
    'Donald', 'Donna', 'Steven', 'Carol', 'Paul', 'Ruth', 'Andrew', 'Sharon', 'Joshua', 'Michelle',
    'Kenneth', 'Laura', 'Kevin', 'Sarah', 'Brian', 'Kimberly', 'George', 'Deborah', 'Timothy', 'Dorothy',
    'Ronald', 'Amy', 'Jason', 'Angela', 'Edward', 'Ashley', 'Jeffrey', 'Brenda', 'Ryan', 'Emma'
]

last_names = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
    'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
    'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
    'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
    'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts',
    'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker', 'Cruz', 'Edwards', 'Collins', 'Reyes'
]

blood_groups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
locations = ['Nairobi West', 'Westlands', 'Karen', 'Kilimani', 'Parklands', 'Lavington']

def generate_phone():
    """Generate a unique Kenyan phone number"""
    prefix = random.choice(['0700', '0701', '0702', '0703', '0704', '0705', '0720', '0721', '0722'])
    number = ''.join([str(random.randint(0, 9)) for _ in range(6)])
    return f"{prefix}{number}"

def create_test_members(count=55):
    print(f"Creating {count} test members...")
    
    # Get all available plans
    indoor_plans = list(MembershipPlan.objects.filter(membership_type='indoor'))
    outdoor_plans = list(MembershipPlan.objects.filter(membership_type='outdoor'))
    
    print(f"Available indoor plans: {len(indoor_plans)}")
    print(f"Available outdoor plans: {len(outdoor_plans)}")
    
    # Ensure locations exist
    for loc_name in locations:
        Location.objects.get_or_create(
            name=loc_name,
            defaults={'code': loc_name.lower().replace(' ', '_')}
        )
    
    created_count = 0
    skipped_count = 0
    
    for i in range(count):
        # Generate unique identifiers
        first_name = random.choice(first_names)
        last_name = random.choice(last_names)
        email = f"{first_name.lower()}.{last_name.lower()}.{i+1}@testuser.com"
        phone = generate_phone()
        
        # Check if member already exists
        if Member.objects.filter(email=email).exists() or Member.objects.filter(phone=phone).exists():
            skipped_count += 1
            continue
        
        try:
            # Create member
            member = Member.objects.create(
                first_name=first_name,
                last_name=last_name,
                email=email,
                phone=phone,
                id_passport=f"ID{random.randint(10000000, 99999999)}",
                blood_group=random.choice(blood_groups),
                emergency_contact=f"{random.choice(first_names)} {random.choice(last_names)}",
                emergency_phone=generate_phone(),
                date_of_birth=datetime.now().date() - timedelta(days=random.randint(18*365, 60*365)),
                address=f"{random.randint(1, 999)} {random.choice(['Main', 'Oak', 'Pine', 'Elm'])} Street",
                medical_conditions=random.choice(["None", "Asthma", "Diabetes", "High Blood Pressure", ""]),
                status='active'
            )
            
            # Randomly assign membership type (60% indoor, 40% outdoor)
            is_indoor = random.random() < 0.6
            
            if is_indoor and indoor_plans:
                # Create indoor membership
                plan = random.choice(indoor_plans)
                location = None
            elif outdoor_plans:
                # Create outdoor membership
                plan = random.choice(outdoor_plans)
                location = Location.objects.get(name=random.choice(locations))
            else:
                print(f"No plans available for member {i+1}")
                continue
                
            # Calculate membership duration and sessions
            start_date = datetime.now().date() - timedelta(days=random.randint(0, 30))
            
            if plan.plan_type == "daily":
                end_date = start_date + timedelta(days=1)
                total_sessions = 1
            elif plan.plan_type == "monthly":
                end_date = start_date + timedelta(days=30)
                total_sessions = plan.sessions_per_week * 4
            elif plan.plan_type == "quarterly":
                end_date = start_date + timedelta(days=90)
                total_sessions = plan.sessions_per_week * 12
            elif plan.plan_type == "bi-annual":
                end_date = start_date + timedelta(days=180)
                total_sessions = plan.sessions_per_week * 24
            elif plan.plan_type == "annual":
                end_date = start_date + timedelta(days=365)
                total_sessions = plan.sessions_per_week * 52
            else:
                # Session-based plans
                end_date = start_date + timedelta(weeks=plan.duration_weeks)
                total_sessions = plan.sessions_per_week * plan.duration_weeks
            
            # Random sessions used (0 to 80% of total)
            sessions_used = random.randint(0, int(total_sessions * 0.8))
            
            # Create membership
            membership = Membership.objects.create(
                member=member,
                plan=plan,
                location=location,
                status=random.choice(['active', 'active', 'active', 'suspended']),  # 75% active
                total_sessions_allowed=total_sessions,
                sessions_used=sessions_used,
                start_date=start_date,
                end_date=end_date,
                amount_paid=(
                    plan.per_session_fee if plan.plan_type == "daily"
                    else plan.weekly_fee if plan.weekly_fee > 0
                    else plan.monthly_fee
                ),
                payment_status=random.choice(['paid', 'paid', 'pending', 'overdue']),  # 50% paid
            )
            
            created_count += 1
            print(f"✓ Created: {member.first_name} {member.last_name} - {plan.plan_name} ({'Indoor' if is_indoor else 'Outdoor'})")
            
        except Exception as e:
            print(f"✗ Error creating member {i+1}: {str(e)}")
            skipped_count += 1
    
    print(f"\nSummary:")
    print(f"Created: {created_count} members")
    print(f"Skipped: {skipped_count} members")
    print(f"Total members in system: {Member.objects.count()}")

if __name__ == "__main__":
    create_test_members(55)