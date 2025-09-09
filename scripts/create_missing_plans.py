from memberships.models import MembershipPlan
from decimal import Decimal

# Create missing indoor plans
indoor_plans = [
    {
        'plan_name': 'Indoor Annual Membership',
        'plan_code': 'indoor_annual',
        'membership_type': 'indoor',
        'plan_type': 'annual',
        'sessions_per_week': 7,  # Unlimited for annual
        'duration_weeks': 52,    # 1 year
        'weekly_fee': Decimal('0.00'),
        'monthly_fee': Decimal('50000.00'),  # 50K annual fee
        'per_session_fee': Decimal('0.00'),
        'description': 'Annual indoor membership with unlimited access',
        'is_active': True
    },
    {
        'plan_name': 'Indoor Quarterly Membership',
        'plan_code': 'indoor_quarterly',
        'membership_type': 'indoor',
        'plan_type': 'quarterly',
        'sessions_per_week': 7,  # Unlimited for quarterly
        'duration_weeks': 12,    # 3 months
        'weekly_fee': Decimal('0.00'),
        'monthly_fee': Decimal('15000.00'),  # 15K quarterly fee
        'per_session_fee': Decimal('0.00'),
        'description': 'Quarterly indoor membership with unlimited access',
        'is_active': True
    }
]

print("Creating missing indoor membership plans...")
for plan_data in indoor_plans:
    plan, created = MembershipPlan.objects.get_or_create(
        plan_code=plan_data['plan_code'],
        membership_type=plan_data['membership_type'],
        defaults=plan_data
    )
    if created:
        print(f"✓ Created: {plan.plan_name}")
    else:
        print(f"- Already exists: {plan.plan_name}")

print("\nAll indoor plans:")
for plan in MembershipPlan.objects.filter(membership_type='indoor').order_by('plan_type'):
    print(f"  {plan.plan_type}: {plan.plan_name}")