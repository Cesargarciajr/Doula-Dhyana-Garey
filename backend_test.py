import requests
import sys
import json
from datetime import datetime, timezone, timedelta
from typing import Dict, Any

class BirthPlanTokenAPITester:
    def __init__(self, base_url="https://birth-plan-builder-1.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.session = requests.Session()
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.test_token = "edit123"  # Test token from review request
        self.plan_id = None
        print(f"🚀 Testing Birth Plan Token API at: {base_url}")
        print(f"🔑 Using test token: {self.test_token}")

    def run_test(self, name: str, method: str, endpoint: str, expected_status: int = 200, 
                 data: Dict[Any, Any] = None, headers: Dict[str, str] = None) -> tuple:
        """Run a single API test"""
        url = f"{self.base_url}{endpoint}"
        test_headers = headers or {}
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   {method} {url}")
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=test_headers, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")

            success = response.status_code == expected_status
            result = {
                'name': name,
                'method': method,
                'endpoint': endpoint,
                'expected_status': expected_status,
                'actual_status': response.status_code,
                'success': success,
                'response_time': response.elapsed.total_seconds(),
                'response_size': len(response.content)
            }
            
            if success:
                self.tests_passed += 1
                print(f"   ✅ PASSED - Status: {response.status_code}")
                try:
                    result['response_data'] = response.json() if response.content else {}
                except:
                    result['response_data'] = response.text
            else:
                print(f"   ❌ FAILED - Expected {expected_status}, got {response.status_code}")
                print(f"   📄 Response: {response.text[:200]}...")
                result['error'] = response.text[:200]

            self.test_results.append(result)
            return success, response.json() if response.content and success else {}

        except requests.exceptions.RequestException as e:
            print(f"   ❌ FAILED - Network Error: {str(e)}")
            self.test_results.append({
                'name': name,
                'method': method,
                'endpoint': endpoint,
                'expected_status': expected_status,
                'actual_status': 'ERROR',
                'success': False,
                'error': str(e)
            })
            return False, {}
        except Exception as e:
            print(f"   ❌ FAILED - Error: {str(e)}")
            self.test_results.append({
                'name': name,
                'method': method,
                'endpoint': endpoint,
                'expected_status': expected_status,
                'actual_status': 'ERROR',
                'success': False,
                'error': str(e)
            })
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root endpoint", "GET", "/")

    def test_categories_endpoint(self):
        """Test categories endpoint"""
        return self.run_test("Get categories", "GET", "/categories")

    def test_options_endpoint(self):
        """Test options endpoint"""
        return self.run_test("Get options", "GET", "/options")

    def test_token_validation_with_test_token(self):
        """Test token validation with the provided test token"""
        success, response = self.run_test(
            "Token validation (test token)", 
            "POST", 
            f"/validate-token?token={self.test_token}"
        )
        
        if success and response:
            self.plan_id = response.get('plan_id')
            print(f"   📋 Plan ID: {self.plan_id}")
            print(f"   👫 Couple Name: {response.get('couple_name', 'N/A')}")
            print(f"   🔄 Existing Plan: {response.get('existing', False)}")
            
            # Check token_info structure
            token_info = response.get('token_info', {})
            if token_info:
                print(f"   📊 Token Info:")
                print(f"      Max Uses: {token_info.get('max_uses', 'N/A')}")
                print(f"      Current Uses: {token_info.get('current_uses', 'N/A')}")
                print(f"      Remaining Uses: {token_info.get('remaining_uses', 'N/A')}")
            
        return success, response

    def test_birth_plan_token_info_endpoint(self):
        """Test the new GET /api/birth-plan/{plan_id}/token-info endpoint"""
        if not self.plan_id:
            print(f"   ⚠️ SKIPPED - No plan_id available")
            return False, {}
        
        success, response = self.run_test(
            "Get birth plan token info", 
            "GET", 
            f"/birth-plan/{self.plan_id}/token-info"
        )
        
        if success and response:
            print(f"   📊 Token Info Response:")
            print(f"      Max Uses: {response.get('max_uses', 'N/A')}")
            print(f"      Current Uses: {response.get('current_uses', 'N/A')}")
            print(f"      Remaining Uses: {response.get('remaining_uses', 'N/A')}")
            
            # Verify structure
            required_fields = ['max_uses', 'current_uses', 'remaining_uses']
            for field in required_fields:
                if field not in response:
                    print(f"   ❌ Missing required field: {field}")
                    return False, response
        
        return success, response

    def test_birth_plan_access(self):
        """Test birth plan access by ID"""
        if not self.plan_id:
            print(f"   ⚠️ SKIPPED - No plan_id available")
            return False, {}
        
        success, response = self.run_test(
            "Get birth plan by ID", 
            "GET", 
            f"/birth-plan/{self.plan_id}"
        )
        
        if success and response:
            print(f"   📋 Birth Plan Details:")
            print(f"      Status: {response.get('status', 'N/A')}")
            print(f"      Couple Name: {response.get('couple_name', 'N/A')}")
            print(f"      Completed: {response.get('is_completed', 'N/A')}")
        
        return success, response

    def test_birth_plan_reset_flow(self):
        """Test the birth plan reset flow (POST /api/birth-plan/{plan_id}/reset)"""
        if not self.plan_id:
            print(f"   ⚠️ SKIPPED - No plan_id available")
            return False, {}
        
        success, response = self.run_test(
            "Reset birth plan", 
            "POST", 
            f"/birth-plan/{self.plan_id}/reset"
        )
        
        if success and response:
            print(f"   📋 Reset Response:")
            print(f"      Status: {response.get('status', 'N/A')}")
            print(f"      Completed: {response.get('is_completed', 'N/A')}")
            print(f"      Current Category Index: {response.get('current_category_index', 'N/A')}")
            print(f"      Visited Categories: {len(response.get('visited_categories', []))}")
        
        return success, response

    def test_birth_plan_update(self):
        """Test birth plan update to verify edit functionality"""
        if not self.plan_id:
            print(f"   ⚠️ SKIPPED - No plan_id available")
            return False, {}
        
        update_data = {
            "selected_options": ["opt_1", "opt_2"],
            "visited_categories": ["cat_labor"],
            "current_category_index": 0
        }
        
        success, response = self.run_test(
            "Update birth plan", 
            "PUT", 
            f"/birth-plan/{self.plan_id}",
            200,
            update_data
        )
        
        if success and response:
            print(f"   📋 Update Response:")
            print(f"      Selected Options: {len(response.get('selected_options', []))}")
            print(f"      Visited Categories: {len(response.get('visited_categories', []))}")
        
        return success, response

    def test_birth_plan_access_invalid(self):
        """Test birth plan access with invalid ID"""
        return self.run_test("Birth plan access (invalid)", "GET", "/birth-plan/invalid-plan-id", 404)

    def run_full_test_suite(self):
        """Run all API tests focused on the token functionality"""
        print("=" * 60)
        print("🧪 STARTING BIRTH PLAN TOKEN TEST SUITE")
        print("=" * 60)
        
        # Basic endpoint tests
        print("\n📋 TESTING PUBLIC ENDPOINTS")
        print("-" * 30)
        
        self.test_root_endpoint()
        self.test_categories_endpoint()
        self.test_options_endpoint()
        
        # Token and birth plan tests - FOCUS AREA
        print("\n🔐 TESTING TOKEN & BIRTH PLAN FUNCTIONALITY")
        print("-" * 40)
        
        # Step 1: Validate test token and get plan_id
        print("\n1️⃣ Testing token validation...")
        self.test_token_validation_with_test_token()
        
        # Step 2: Test the new token-info endpoint
        print("\n2️⃣ Testing token-info endpoint...")
        self.test_birth_plan_token_info_endpoint()
        
        # Step 3: Test birth plan access
        print("\n3️⃣ Testing birth plan access...")
        self.test_birth_plan_access()
        
        # Step 4: Test reset functionality
        print("\n4️⃣ Testing reset functionality...")
        self.test_birth_plan_reset_flow()
        
        # Step 5: Test update functionality
        print("\n5️⃣ Testing update functionality...")
        self.test_birth_plan_update()
        
        # Test invalid scenarios
        print("\n❌ TESTING ERROR SCENARIOS")
        print("-" * 30)
        
        self.run_test("Token validation (invalid)", "POST", "/validate-token?token=invalid-token", 404)
        self.test_birth_plan_access_invalid()
        
        # Final results
        print("\n" + "=" * 60)
        print("🏁 TEST SUITE RESULTS")
        print("=" * 60)
        print(f"📊 Tests Passed: {self.tests_passed}/{self.tests_run}")
        print(f"📈 Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        # Detailed failed tests
        failed_tests = [test for test in self.test_results if not test['success']]
        if failed_tests:
            print(f"\n❌ FAILED TESTS ({len(failed_tests)}):")
            for test in failed_tests:
                print(f"   • {test['name']}: Expected {test['expected_status']}, got {test.get('actual_status', 'ERROR')}")
                if 'error' in test:
                    print(f"     Error: {test['error']}")
        else:
            print("\n🎉 ALL TESTS PASSED!")
        
        return self.tests_passed, self.tests_run, self.test_results

def main():
    """Main test runner"""
    tester = BirthPlanTokenAPITester()
    passed, total, results = tester.run_full_test_suite()
    
    # Return appropriate exit code
    return 0 if passed == total else 1

if __name__ == "__main__":
    sys.exit(main())