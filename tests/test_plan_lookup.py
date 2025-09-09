from memberships.models import MembershipPlan

def test_plan_lookup(membership_type, plan_type):
    print(f"Testing lookup: {membership_type} + {plan_type}")
    
    plan = None
    try:
        # For outdoor plans, frontend might send "outdoor_daily", "1_week", etc.
        if membership_type == "outdoor":
            # Map frontend plan_type to plan_code
            plan_code_mapping = {
                "outdoor_daily": "outdoor_daily",
                "1_week": "1_session_week",
                "2_week": "2_sessions_week",
                "3_week": "3_sessions_week", 
                "4_week": "4_sessions_week",
                "5_week": "5_sessions_week",
                "daily": "outdoor_daily",
                "monthly": "outdoor_monthly"
            }
            plan_code = plan_code_mapping.get(plan_type, plan_type)
            print(f"  Mapped to plan_code: {plan_code}")
            plan = MembershipPlan.objects.get(
                membership_type=membership_type, plan_code=plan_code
            )
        else:
            # For indoor plans, use plan_type directly
            plan = MembershipPlan.objects.get(
                membership_type=membership_type, plan_type=plan_type
            )
    except MembershipPlan.DoesNotExist:
        print(f"  Primary lookup failed, trying fallback...")
        # Fallback: try by plan_type
        normalized_plan_type = plan_type
        if plan_type.startswith("outdoor_"):
            normalized_plan_type = plan_type.replace("outdoor_", "")
        elif plan_type.startswith("indoor_"):
            normalized_plan_type = plan_type.replace("indoor_", "")
        
        print(f"  Fallback normalized_plan_type: {normalized_plan_type}")
        try:
            plan = MembershipPlan.objects.get(
                membership_type=membership_type, plan_type=normalized_plan_type
            )
        except Exception as e:
            print(f"  ✗ Fallback failed: {e}")
            return None
    except Exception as e:
        print(f"  ✗ Primary lookup failed: {e}")
        return None
    
    if plan:
        print(f"  ✓ Found: {plan.plan_name} (code: {plan.plan_code})")
        return plan
    else:
        print(f"  ✗ No plan found")
        return None

# Test cases
test_cases = [
    ("outdoor", "outdoor_daily"),
    ("outdoor", "1_week"), 
    ("outdoor", "daily"),
    ("indoor", "annual"),
    ("indoor", "daily")
]

for membership_type, plan_type in test_cases:
    test_plan_lookup(membership_type, plan_type)
    print()