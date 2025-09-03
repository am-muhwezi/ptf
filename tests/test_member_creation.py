from members.models import Member
from memberships.models import MembershipPlan, Membership
import json

def test_member_creation():
    print("Testing member creation with outdoor_daily plan...")
    
    # Simulate the view logic
    membership_type = "outdoor"
    plan_type = "outdoor_daily"
    
    try:
        # Test the plan lookup logic
        plan = None
        if membership_type == "outdoor":
            plan_code_mapping = {
                "outdoor_daily": "outdoor_daily",
                "1_week": "1_session_week",
                "2_week": "OUTDOOR-2X",
                "3_week": "3_sessions_week", 
                "4_week": "4_sessions_week",
                "5_week": "5_sessions_week",
                "daily": "outdoor_daily",
                "monthly": "OUTDOOR-MONTHLY"
            }
            plan_code = plan_code_mapping.get(plan_type, plan_type)
            print(f"  Mapping {plan_type} -> {plan_code}")
            
            plan = MembershipPlan.objects.get(
                membership_type=membership_type, plan_code=plan_code
            )
        else:
            plan = MembershipPlan.objects.get(
                membership_type=membership_type, plan_type=plan_type
            )
            
        print(f"✓ Found plan: {plan.plan_name}")
        print(f"  Plan details: {plan.plan_type}, {plan.sessions_per_week} sessions/week")
        return True
        
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

if __name__ == "__main__":
    test_member_creation()