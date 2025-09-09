from memberships.models import MembershipPlan

print('Available Plans:')
plans = MembershipPlan.objects.all()
if not plans:
    print('  No plans found!')
else:
    for plan in plans:
        print(f'  {plan.membership_type}: {plan.plan_type} - {plan.plan_name}')