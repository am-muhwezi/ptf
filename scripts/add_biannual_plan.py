from memberships.models import MembershipPlan
from decimal import Decimal

# Create bi-annual indoor plan
biannual_plan = {
    'plan_name': 'Indoor Bi-Annual Membership',
    'plan_code': 'indoor_biannual',
    'membership_type': 'indoor',
    'plan_type': 'bi-annual',  # This will need to be added to the model choices
    'sessions_per_week': 7,  # Unlimited for bi-annual
    'duration_weeks': 26,    # 6 months
    'weekly_fee': Decimal('0.00'),
    'monthly_fee': Decimal('25000.00'),  # 25K bi-annual fee
    'per_session_fee': Decimal('0.00'),
    'description': 'Bi-annual indoor membership with unlimited access',
    'is_active': True
}

print("Creating bi-annual indoor membership plan...")
plan, created = MembershipPlan.objects.get_or_create(
    plan_code=biannual_plan['plan_code'],
    membership_type=biannual_plan['membership_type'],
    defaults=biannual_plan
)
if created:
    print(f"✓ Created: {plan.plan_name}")
else:
    print(f"- Already exists: {plan.plan_name}")

print("\nAll indoor plans:")
for plan in MembershipPlan.objects.filter(membership_type='indoor').order_by('plan_type'):
    print(f"  {plan.plan_type}: {plan.plan_name}")