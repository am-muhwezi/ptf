from django.core.management.base import BaseCommand
from django.utils import timezone
from decimal import Decimal
from datetime import date, timedelta
import random

from members.models import Member, Location, PhysicalProfile
from memberships.models import MembershipPlan, Membership


class Command(BaseCommand):
    help = 'Create test members with indoor and outdoor memberships for testing payment status functionality'

    def add_arguments(self, parser):
        parser.add_argument('--count', type=int, default=20, help='Number of members to create')
        parser.add_argument('--indoor-only', action='store_true', help='Create indoor members only')
        parser.add_argument('--outdoor-only', action='store_true', help='Create outdoor members only')
        parser.add_argument('--clear', action='store_true', help='Clear existing test data first')

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write('Clearing existing test data...')
            Member.objects.filter(email__icontains='test_').delete()
            self.stdout.write(self.style.SUCCESS('Test data cleared.'))

        count = options['count']
        indoor_only = options['indoor_only']
        outdoor_only = options['outdoor_only']
        
        self.create_locations()
        self.create_membership_plans()
        self.create_test_members(count, indoor_only, outdoor_only)

    def create_locations(self):
        """Create outdoor locations if they don't exist"""
        locations = [
            {'name': 'Nakuru Outdoor Training Ground', 'code': 'NAKURU'},
            {'name': 'Eldoret Sports Complex', 'code': 'ELDORET'},
            {'name': 'Kisumu Waterfront Park', 'code': 'KISUMU'},
            {'name': 'Mombasa Beach Training', 'code': 'MOMBASA'},
        ]
        
        for loc_data in locations:
            Location.objects.get_or_create(
                code=loc_data['code'],
                defaults={'name': loc_data['name']}
            )
        
        self.stdout.write(f'Created/verified {len(locations)} outdoor locations.')

    def create_membership_plans(self):
        """Create membership plans if they don't exist"""
        plans = [
            # Indoor Plans
            {
                'plan_name': 'Indoor Daily Drop-in',
                'plan_code': 'INDOOR_DAILY',
                'membership_type': 'indoor',
                'plan_type': 'daily',
                'sessions_per_week': 1,
                'duration_weeks': 1,
                'per_session_fee': Decimal('1500.00'),
                'monthly_fee': Decimal('0.00')
            },
            {
                'plan_name': 'Indoor 3 Sessions/Week',
                'plan_code': 'INDOOR_3X',
                'membership_type': 'indoor',
                'plan_type': '3_sessions_week',
                'sessions_per_week': 3,
                'duration_weeks': 4,
                'monthly_fee': Decimal('8000.00')
            },
            {
                'plan_name': 'Indoor 5 Sessions/Week',
                'plan_code': 'INDOOR_5X',
                'membership_type': 'indoor',
                'plan_type': '5_sessions_week',
                'sessions_per_week': 5,
                'duration_weeks': 4,
                'monthly_fee': Decimal('12000.00')
            },
            # Outdoor Plans
            {
                'plan_name': 'Outdoor Monthly Training',
                'plan_code': 'OUTDOOR_MONTHLY',
                'membership_type': 'outdoor',
                'plan_type': 'monthly',
                'sessions_per_week': 2,
                'duration_weeks': 4,
                'monthly_fee': Decimal('5000.00')
            },
            {
                'plan_name': 'Outdoor Weekly Sessions',
                'plan_code': 'OUTDOOR_WEEKLY',
                'membership_type': 'outdoor',
                'plan_type': 'weekly',
                'sessions_per_week': 1,
                'duration_weeks': 1,
                'weekly_fee': Decimal('1200.00')
            },
        ]
        
        for plan_data in plans:
            MembershipPlan.objects.get_or_create(
                plan_code=plan_data['plan_code'],
                defaults=plan_data
            )
        
        self.stdout.write(f'Created/verified {len(plans)} membership plans.')

    def create_test_members(self, count, indoor_only=False, outdoor_only=False):
        """Create test members with various membership types and payment statuses"""
        
        # Sample data
        first_names = [
            'John', 'Mary', 'Peter', 'Grace', 'James', 'Faith', 'David', 'Sarah',
            'Michael', 'Catherine', 'Joseph', 'Rose', 'Daniel', 'Joyce', 'Samuel',
            'Elizabeth', 'Paul', 'Margaret', 'Stephen', 'Lucy', 'Anthony', 'Agnes',
            'Francis', 'Susan', 'Robert', 'Nancy', 'Charles', 'Mercy', 'Patrick', 'Jane'
        ]
        
        last_names = [
            'Kiprotich', 'Wanjiku', 'Otieno', 'Achieng', 'Mwangi', 'Nyong\'o',
            'Kiptoo', 'Wambui', 'Ochieng', 'Akinyi', 'Kamau', 'Wairimu',
            'Kiplagat', 'Njeri', 'Odhiambo', 'Adhiambo', 'Kiplimo', 'Wanjiru',
            'Owino', 'Atieno', 'Kigen', 'Gathoni', 'Bett', 'Wangari',
            'Rono', 'Njoki', 'Komen', 'Wambu', 'Terer', 'Nyambura'
        ]
        
        blood_groups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
        payment_statuses = ['pending', 'paid', 'overdue', 'partial']
        
        # Get existing plans and locations
        indoor_plans = list(MembershipPlan.objects.filter(membership_type='indoor'))
        outdoor_plans = list(MembershipPlan.objects.filter(membership_type='outdoor'))
        locations = list(Location.objects.all())
        
        created_members = []
        
        for i in range(count):
            # Create member
            member_data = {
                'first_name': random.choice(first_names),
                'last_name': random.choice(last_names),
                'email': f'test_member_{i+1}@ptf.test',
                'phone': f'+254{random.randint(700000000, 799999999)}',
                'address': f'{random.randint(1, 999)} Test Street, Nairobi',
                'date_of_birth': date(
                    random.randint(1980, 2005),
                    random.randint(1, 12),
                    random.randint(1, 28)
                ),
                'id_passport': f'TEST{random.randint(10000000, 99999999)}',
                'blood_group': random.choice(blood_groups),
                'emergency_contact': f'{random.choice(first_names)} {random.choice(last_names)}',
                'emergency_phone': f'+254{random.randint(700000000, 799999999)}',
                'status': 'active',
                'total_visits': random.randint(0, 50),
            }
            
            if member_data['total_visits'] > 0:
                member_data['last_visit'] = timezone.now() - timedelta(
                    days=random.randint(0, 30)
                )
            
            member = Member.objects.create(**member_data)
            created_members.append(member)
            
            # Decide membership type (60% indoor, 40% outdoor)
            is_indoor = random.random() < 0.6
            
            if is_indoor:
                # Create indoor membership
                plan = random.choice(indoor_plans)
                location = None
                
                # Create physical profile for indoor members
                PhysicalProfile.objects.create(
                    member=member,
                    height=random.uniform(150.0, 190.0),
                    weight=random.uniform(50.0, 100.0),
                    body_fat_percentage=random.uniform(10.0, 30.0),
                    fitness_level=random.choice(['beginner', 'intermediate', 'advanced']),
                    short_term_goals='Build strength and endurance',
                    long_term_goals='Achieve peak physical fitness'
                )
            else:
                # Create outdoor membership
                plan = random.choice(outdoor_plans)
                location = random.choice(locations)
            
            # Calculate membership details
            start_date = timezone.now().date() - timedelta(days=random.randint(1, 90))
            end_date = start_date + timedelta(weeks=plan.duration_weeks)
            total_sessions = plan.sessions_per_week * plan.duration_weeks
            sessions_used = random.randint(0, min(total_sessions, 
                                                int(total_sessions * 0.8)))
            
            # Amount based on plan type
            if plan.plan_type == 'daily':
                amount = plan.per_session_fee
            elif plan.weekly_fee > 0:
                amount = plan.weekly_fee * plan.duration_weeks
            else:
                amount = plan.monthly_fee
            
            # All members have pending payment status for testing
            payment_status = 'pending'
            
            # Create membership
            membership_data = {
                'member': member,
                'plan': plan,
                'location': location,
                'status': 'active',
                'total_sessions_allowed': total_sessions,
                'sessions_used': sessions_used,
                'start_date': start_date,
                'end_date': end_date,
                'amount_paid': amount,
                'payment_status': payment_status,
                'next_billing_date': end_date + timedelta(days=1) if payment_status == 'paid' else start_date
            }
            
            Membership.objects.create(**membership_data)
            
            membership_type = 'Indoor' if is_indoor else 'Outdoor'
            self.stdout.write(
                f'Created {membership_type} member: {member.full_name} '
                f'({plan.plan_name}, Payment: {payment_status})'
            )
        
        # Summary
        self.stdout.write('\n' + '='*50)
        self.stdout.write(self.style.SUCCESS(f'Successfully created {count} test members!'))
        
        # Statistics
        indoor_count = Member.objects.filter(
            memberships__plan__membership_type='indoor'
        ).distinct().count()
        
        outdoor_count = Member.objects.filter(
            memberships__plan__membership_type='outdoor'
        ).distinct().count()
        
        pending_payments = Membership.objects.filter(payment_status='pending').count()
        paid_payments = Membership.objects.filter(payment_status='paid').count()
        overdue_payments = Membership.objects.filter(payment_status='overdue').count()
        partial_payments = Membership.objects.filter(payment_status='partial').count()
        
        self.stdout.write('\nBreakdown:')
        self.stdout.write(f'Indoor Members: {indoor_count}')
        self.stdout.write(f'Outdoor Members: {outdoor_count}')
        self.stdout.write(f'\nPayment Status:')
        self.stdout.write(f'Pending: {pending_payments}')
        self.stdout.write(f'Paid: {paid_payments}')
        self.stdout.write(f'Overdue: {overdue_payments}')
        self.stdout.write(f'Partial: {partial_payments}')
        
        self.stdout.write(f'\nYou can now test the indoor/outdoor member filtering and payment status functionality!')