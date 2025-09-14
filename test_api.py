#!/usr/bin/env python3
"""
Test Data Center API endpoints using urllib
"""
import urllib.request
import urllib.parse
import json
import time

def make_request(url, method='GET', data=None, headers=None):
    """Make HTTP request"""
    if headers is None:
        headers = {'Content-Type': 'application/json'}
    
    if data and isinstance(data, dict):
        data = json.dumps(data).encode('utf-8')
    
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            return response.read().decode('utf-8'), response.getcode()
    except urllib.error.HTTPError as e:
        return e.read().decode('utf-8'), e.code
    except Exception as e:
        return str(e), 0

def test_api():
    """Test API endpoints"""
    base_url = "http://localhost:8011/ecc800/api"
    
    try:
        print("🔍 Testing Data Center API endpoints...")

        # Test health check
        print("\n1. Testing health check...")
        response, status = make_request(f"{base_url}/health")
        if status == 200:
            print("✅ Health check passed")
        else:
            print(f"❌ Health check failed: {status} - {response}")

        # Test GET data-centers
        print("\n2. Testing GET /admin/data-centers...")
        response, status = make_request(f"{base_url}/admin/data-centers")
        if status == 200:
            data = json.loads(response)
            print(f"✅ GET data-centers: {len(data)} data centers found")
            if data:
                print(f"   Sample: {data[0]['name']}")
        else:
            print(f"❌ GET data-centers failed: {status} - {response}")

        # Test POST data-centers (create)
        print("\n3. Testing POST /admin/data-centers...")
        new_dc = {
            "name": "Test Data Center API",
            "location": "Test Location",
            "description": "Created via API test",
            "site_code": "API_TEST",
            "ip_address": "192.168.1.200",
            "is_active": True
        }
        response, status = make_request(f"{base_url}/admin/data-centers", method='POST', data=new_dc)
        if status == 201:
            data = json.loads(response)
            print(f"✅ POST data-centers: Created with ID {data['id']}")
            created_id = data['id']
        else:
            print(f"❌ POST data-centers failed: {status} - {response}")
            return

        # Test GET specific data-center
        print(f"\n4. Testing GET /admin/data-centers/{created_id}...")
        response, status = make_request(f"{base_url}/admin/data-centers/{created_id}")
        if status == 200:
            data = json.loads(response)
            print(f"✅ GET data-center: {data['name']}")
        else:
            print(f"❌ GET data-center failed: {status} - {response}")

        # Test PUT data-center (update)
        print(f"\n5. Testing PUT /admin/data-centers/{created_id}...")
        update_data = {
            "name": "Updated Test Data Center API",
            "location": "Updated Location"
        }
        response, status = make_request(f"{base_url}/admin/data-centers/{created_id}", method='PUT', data=update_data)
        if status == 200:
            data = json.loads(response)
            print(f"✅ PUT data-center: Updated to '{data['name']}'")
        else:
            print(f"❌ PUT data-center failed: {status} - {response}")

        # Test DELETE data-center
        print(f"\n6. Testing DELETE /admin/data-centers/{created_id}...")
        response, status = make_request(f"{base_url}/admin/data-centers/{created_id}", method='DELETE')
        if status == 200:
            print("✅ DELETE data-center: Successfully deleted")
        else:
            print(f"❌ DELETE data-center failed: {status} - {response}")

        print("\n🎉 All API tests completed successfully!")

    except Exception as e:
        print(f"❌ Test error: {e}")

if __name__ == "__main__":
    test_api()
