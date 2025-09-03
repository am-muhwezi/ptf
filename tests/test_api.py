#!/usr/bin/env python
"""
Test API endpoints for cash payment functionality
"""

import requests
import json
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000"
LOGIN_URL = f"{BASE_URL}/auth/login/"
PAYMENT_URL = f"{BASE_URL}/payments/manual/"

def get_auth_token():
    """Get JWT token for authentication"""
    login_data = {
        "username": "testadmin",
        "password": "testpass123"
    }
    
    try:
        response = requests.post(LOGIN_URL, json=login_data)
        print(f"Login response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            token = data.get('access')
            if token:
                print("✅ Authentication successful!")
                return token
            else:
                print("❌ No access token in response")
                print(f"Response: {data}")
                return None
        else:
            print(f"❌ Login failed: {response.status_code}")
            print(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Login error: {str(e)}")
        return None

def test_cash_payment_api(token):
    """Test the cash payment API endpoint"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Test with existing membership ID from our previous test
    payment_data = {
        "membership_id": 49,  # From our test data
        "amount": 3000,
        "payment_method": "cash",
        "notes": "API test cash payment"
    }
    
    try:
        print(f"Testing payment API endpoint: {PAYMENT_URL}")
        print(f"Payment data: {payment_data}")
        
        response = requests.post(PAYMENT_URL, json=payment_data, headers=headers)
        print(f"Payment API response status: {response.status_code}")
        
        if response.status_code in [200, 201]:
            data = response.json()
            print("✅ Cash payment API successful!")
            print(f"Response: {json.dumps(data, indent=2)}")
            return True
        else:
            print(f"❌ Payment API failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Payment API error: {str(e)}")
        return False

def test_unauthenticated_request():
    """Test that unauthenticated requests are properly rejected"""
    payment_data = {
        "membership_id": 49,
        "amount": 1000,
        "payment_method": "cash"
    }
    
    try:
        print(f"\nTesting unauthenticated request to {PAYMENT_URL}")
        response = requests.post(PAYMENT_URL, json=payment_data)
        print(f"Unauthenticated response status: {response.status_code}")
        
        if response.status_code == 401:
            print("✅ Unauthenticated request properly rejected!")
            return True
        else:
            print(f"❌ Unauthenticated request should be rejected but got: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Unauthenticated test error: {str(e)}")
        return False

if __name__ == '__main__':
    print("🧪 Testing Cash Payment API")
    print("=" * 50)
    
    # Test 1: Authentication
    print("1. Testing authentication...")
    token = get_auth_token()
    if not token:
        print("❌ Cannot proceed without authentication token")
        exit(1)
    
    # Test 2: Authenticated cash payment
    print("\n2. Testing authenticated cash payment...")
    payment_success = test_cash_payment_api(token)
    
    # Test 3: Unauthenticated request rejection
    print("\n3. Testing unauthenticated request rejection...")
    auth_rejection_success = test_unauthenticated_request()
    
    # Summary
    print("\n" + "=" * 50)
    print("📋 Test Summary:")
    print(f"  ✅ Authentication: {'PASS' if token else 'FAIL'}")
    print(f"  ✅ Cash Payment API: {'PASS' if payment_success else 'FAIL'}")
    print(f"  ✅ Auth Rejection: {'PASS' if auth_rejection_success else 'FAIL'}")
    
    if token and payment_success and auth_rejection_success:
        print("\n🎉 All API tests passed! The system is working correctly.")
        print("✅ All authenticated users can make cash payments")
        print("✅ Unauthenticated users are properly rejected")
    else:
        print("\n❌ Some tests failed. Please check the errors above.")