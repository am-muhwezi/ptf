#!/usr/bin/env python3
"""
Test script to verify timeout fixes work correctly.
This simulates the conditions that were causing timeouts on DigitalOcean.
"""

import requests
import time
import json
from concurrent.futures import ThreadPoolExecutor, as_completed

# Configuration
BASE_URL = "https://api.paulstropicalfitness.fit"  # Change to local for testing: http://localhost:8000
ENDPOINTS_TO_TEST = [
    "/all/",
    "/all/?page=1&limit=20",
    "/all/?page=1&limit=50", 
    "/all/?page=1&limit=100",
    "/all/?q=test",  # Search functionality
    "/indoor/",
    "/outdoor/",
]

TIMEOUT_LIMIT = 30  # 30 seconds to match our new backend timeout
CONCURRENT_REQUESTS = 5  # Simulate multiple users

def test_endpoint(endpoint, timeout=TIMEOUT_LIMIT):
    """Test a single endpoint and measure response time."""
    start_time = time.time()
    try:
        url = f"{BASE_URL}{endpoint}"
        print(f"Testing: {url}")
        
        response = requests.get(url, timeout=timeout)
        end_time = time.time()
        response_time = end_time - start_time
        
        result = {
            'endpoint': endpoint,
            'status_code': response.status_code,
            'response_time': round(response_time, 2),
            'success': response.status_code == 200,
            'timeout': False,
            'error': None
        }
        
        if response.status_code == 200:
            try:
                data = response.json()
                result['data_count'] = len(data.get('data', []))
                result['total_count'] = data.get('pagination', {}).get('total_count', data.get('count', 0))
                result['has_pagination'] = 'pagination' in data
                print(f"✅ {endpoint}: {response_time:.2f}s, {result['data_count']} items")
            except:
                result['data_count'] = 0
                print(f"✅ {endpoint}: {response_time:.2f}s, non-JSON response")
        else:
            print(f"❌ {endpoint}: HTTP {response.status_code}, {response_time:.2f}s")
            
        return result
        
    except requests.exceptions.Timeout:
        end_time = time.time()
        response_time = end_time - start_time
        print(f"⏰ {endpoint}: TIMEOUT after {response_time:.2f}s")
        return {
            'endpoint': endpoint,
            'status_code': None,
            'response_time': round(response_time, 2),
            'success': False,
            'timeout': True,
            'error': 'Timeout'
        }
    except Exception as e:
        end_time = time.time()
        response_time = end_time - start_time
        print(f"💥 {endpoint}: ERROR - {str(e)}")
        return {
            'endpoint': endpoint,
            'status_code': None,
            'response_time': round(response_time, 2),
            'success': False,
            'timeout': False,
            'error': str(e)
        }

def test_concurrent_access():
    """Test multiple concurrent requests to simulate real-world load."""
    print(f"\n🔄 Testing concurrent access ({CONCURRENT_REQUESTS} requests to /all/)...")
    
    with ThreadPoolExecutor(max_workers=CONCURRENT_REQUESTS) as executor:
        futures = [executor.submit(test_endpoint, "/all/?page=1&limit=20") for _ in range(CONCURRENT_REQUESTS)]
        results = []
        
        for future in as_completed(futures):
            results.append(future.result())
    
    successful = sum(1 for r in results if r['success'])
    avg_time = sum(r['response_time'] for r in results) / len(results)
    
    print(f"Concurrent test results: {successful}/{CONCURRENT_REQUESTS} successful, avg time: {avg_time:.2f}s")
    return results

def main():
    print("🧪 Testing Timeout Fix Implementation")
    print("=" * 50)
    
    all_results = []
    
    # Test each endpoint individually
    print("\n📋 Testing individual endpoints...")
    for endpoint in ENDPOINTS_TO_TEST:
        result = test_endpoint(endpoint)
        all_results.append(result)
        time.sleep(1)  # Brief pause between tests
    
    # Test concurrent access
    concurrent_results = test_concurrent_access()
    all_results.extend(concurrent_results)
    
    # Summary
    print("\n📊 SUMMARY")
    print("=" * 50)
    
    successful = [r for r in all_results if r['success']]
    timeouts = [r for r in all_results if r['timeout']]
    errors = [r for r in all_results if r['error'] and not r['timeout']]
    
    print(f"✅ Successful requests: {len(successful)}/{len(all_results)}")
    print(f"⏰ Timeouts: {len(timeouts)}")
    print(f"💥 Other errors: {len(errors)}")
    
    if successful:
        avg_response_time = sum(r['response_time'] for r in successful) / len(successful)
        max_response_time = max(r['response_time'] for r in successful)
        print(f"📈 Average response time: {avg_response_time:.2f}s")
        print(f"📈 Max response time: {max_response_time:.2f}s")
    
    # Check if pagination is working
    paginated_responses = [r for r in all_results if r.get('has_pagination')]
    print(f"📄 Responses with pagination: {len(paginated_responses)}")
    
    if timeouts:
        print("\n⚠️  TIMEOUT ISSUES DETECTED:")
        for timeout in timeouts:
            print(f"   - {timeout['endpoint']}: {timeout['response_time']:.2f}s")
    
    if errors:
        print("\n⚠️  OTHER ERRORS:")
        for error in errors:
            print(f"   - {error['endpoint']}: {error['error']}")
    
    # Recommendations
    print("\n🎯 RECOMMENDATIONS:")
    if not timeouts:
        print("✅ No timeouts detected - fix appears successful!")
    else:
        print("❌ Timeouts still occurring - may need further optimization")
    
    if any(r.get('has_pagination') for r in all_results):
        print("✅ Pagination is working correctly")
    else:
        print("⚠️  Pagination may not be implemented correctly")
    
    return len(timeouts) == 0 and len(errors) == 0

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)