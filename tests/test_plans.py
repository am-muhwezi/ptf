from memberships.models import MembershipPlan

print('=== INDOOR PLANS ===')
indoor_plans = MembershipPlan.objects.filter(membership_type='indoor').order_by('plan_type')
for plan in indoor_plans:
    print(f'{plan.plan_type}: {plan.plan_name} - {plan.monthly_fee}')

print('\n=== OUTDOOR PLANS ===')  
outdoor_plans = MembershipPlan.objects.filter(membership_type='outdoor').order_by('plan_type')
for plan in outdoor_plans:
    print(f'{plan.plan_type}: {plan.plan_name} - {plan.weekly_fee}/week')
    
print('\n=== PLAN TYPE VALIDATION ===')
frontend_plan_types = ['daily', 'monthly', 'quarterly', 'bi-annual', 'annual']
for plan_type in frontend_plan_types:
    indoor_exists = MembershipPlan.objects.filter(membership_type='indoor', plan_type=plan_type).exists()
    print(f'Indoor {plan_type}: {"✓" if indoor_exists else "✗"}')