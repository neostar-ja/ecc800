#!/usr/bin/env python3
"""
Test script for Data Center management API endpoints
"""
import requests
import json

BASE_URL = "http://localhost:8010/ecc800/api"

def test_data_centers_api():
    """Test Data Center API endpoints"""
    try:
        print("🔍 Testing Data Center API endpoints...")

        # Test 1: GET /admin/data-centers
        print("\n1. Testing GET /admin/data-centers")
        response = requests.get(f"{BASE_URL}/admin/data-centers")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ GET /admin/data-centers: {len(data)} data centers found")
            if data:
                print(f"   Sample: {data[0]}")
        else:
            print(f"❌ GET /admin/data-centers failed: {response.status_code} - {response.text}")

        # Test 2: POST /admin/data-centers (create new)
        print("\n2. Testing POST /admin/data-centers")
        new_dc = {
            "name": "Test Data Center",
            "location": "Test Location",
            "description": "Test Description",
            "site_code": "TEST",
            "ip_address": "192.168.1.100",
            "is_active": True
        }
        response = requests.post(f"{BASE_URL}/admin/data-centers", json=new_dc)
        if response.status_code == 201:
            data = response.json()
            print(f"✅ POST /admin/data-centers: Created data center with ID {data['id']}")
            created_id = data['id']
        else:
            print(f"❌ POST /admin/data-centers failed: {response.status_code} - {response.text}")
            return

        # Test 3: GET /admin/data-centers/{id}
        print(f"\n3. Testing GET /admin/data-centers/{created_id}")
        response = requests.get(f"{BASE_URL}/admin/data-centers/{created_id}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ GET /admin/data-centers/{created_id}: {data['name']}")
        else:
            print(f"❌ GET /admin/data-centers/{created_id} failed: {response.status_code} - {response.text}")

        # Test 4: PUT /admin/data-centers/{id} (update)
        print(f"\n4. Testing PUT /admin/data-centers/{created_id}")
        update_data = {
            "name": "Updated Test Data Center",
            "location": "Updated Location",
            "description": "Updated Description"
        }
        response = requests.put(f"{BASE_URL}/admin/data-centers/{created_id}", json=update_data)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ PUT /admin/data-centers/{created_id}: Updated to '{data['name']}'")
        else:
            print(f"❌ PUT /admin/data-centers/{created_id} failed: {response.status_code} - {response.text}")

        # Test 5: DELETE /admin/data-centers/{id}
        print(f"\n5. Testing DELETE /admin/data-centers/{created_id}")
        response = requests.delete(f"{BASE_URL}/admin/data-centers/{created_id}")
        if response.status_code == 200:
            print(f"✅ DELETE /admin/data-centers/{created_id}: Data center deleted")
        else:
            print(f"❌ DELETE /admin/data-centers/{created_id} failed: {response.status_code} - {response.text}")

        print("\n🎉 All Data Center API tests completed!")

    except requests.exceptions.ConnectionError as e:
        print(f"❌ Connection error: {e}")
        print("💡 Make sure the backend server is running on http://localhost:8010")
    except Exception as e:
        print(f"❌ Test error: {e}")

if __name__ == "__main__":
    test_data_centers_api()
