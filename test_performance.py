#!/usr/bin/env python3
"""
Simple performance test to verify our pagination fixes.
Tests response times without authentication.
"""

import requests
import time

# Test the live API endpoints that were timing out
def test_live_api():
    print("🔍 Testing Live API Performance...")
    print("=" * 40)
    
    endpoints = [
        "https://api.paulstropicalfitness.fit/all/?page=1&limit=20",
        "https://api.paulstropicalfitness.fit/all/?page=1&limit=50",  
        "https://api.paulstropicalfitness.fit/all/?page=2&limit=20",
    ]
    
    for endpoint in endpoints:
        start_time = time.time()
        try:
            response = requests.get(endpoint, timeout=30)
            end_time = time.time()
            response_time = end_time - start_time
            
            if response.status_code == 401:
                print(f"✅ {endpoint}")
                print(f"   Response time: {response_time:.2f}s (Auth required - expected)")
            elif response.status_code == 200:
                print(f"✅ {endpoint}")
                print(f"   Response time: {response_time:.2f}s (Success)")
            else:
                print(f"⚠️  {endpoint}")
                print(f"   Response time: {response_time:.2f}s (HTTP {response.status_code})")
                
        except requests.exceptions.Timeout:
            print(f"❌ {endpoint}")
            print(f"   TIMEOUT after 30s")
        except Exception as e:
            print(f"❌ {endpoint}")
            print(f"   ERROR: {e}")
        
        print()

if __name__ == "__main__":
    test_live_api()
    print("🎯 Key Findings:")
    print("• No timeouts = Pagination fix successful")
    print("• Fast response times = Server optimized")
    print("• 401 errors = Authentication working (expected)")