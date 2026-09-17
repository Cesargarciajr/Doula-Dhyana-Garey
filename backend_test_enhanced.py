import requests
import sys
from datetime import datetime, timezone, timedelta
from typing import Dict, Any

class DoulaAPITesterEnhanced:
    def __init__(self, base_url="https://birth-plan-builder-1.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.session = requests.Session()
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.admin_token = None
        print(f"🚀 Testing Enhanced Doula API at: {base_url}")

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

    def test_admin_login(self):
        """Test admin login with email/password"""
        login_data = {
            "email": "admin@dhyanagarey.ie",
            "password": "Dhyana2026!"
        }
        success, response = self.run_test("Admin login", "POST", "/auth/login", 200, login_data)
        if success and 'user_id' in response:
            print(f"   🎯 Admin logged in successfully as {response.get('name', 'Admin')}")
            return True
        return False

    def test_admin_login_invalid(self):
        """Test admin login with invalid credentials"""
        login_data = {
            "email": "admin@dhyanagarey.ie",
            "password": "wrongpassword"
        }
        return self.run_test("Admin login (invalid)", "POST", "/auth/login", 401, login_data)

    def test_admin_endpoints_after_login(self):
        """Test admin endpoints after successful login"""
        # First login
        if not self.test_admin_login():
            print("   ⚠️  Cannot test admin endpoints - login failed")
            return False

        # Test admin endpoints
        admin_tests = [
            ("Admin categories", "GET", "/admin/categories", 200),
            ("Admin options", "GET", "/admin/options", 200),
            ("Admin tokens", "GET", "/admin/tokens", 200),
            ("Admin birth plans", "GET", "/admin/birth-plans", 200),
            ("Admin pending birth plans", "GET", "/admin/birth-plans/pending", 200),
            ("Admin contacts", "GET", "/admin/contacts", 200),
            ("Admin email templates", "GET", "/admin/email-templates", 200)
        ]
        
        all_passed = True
        for name, method, endpoint, expected_status in admin_tests:
            success, response = self.run_test(name, method, endpoint, expected_status)
            if not success:
                all_passed = False
        
        return all_passed

    def test_token_generation_and_usage(self):
        """Test token generation and usage flow"""
        # First login as admin
        if not self.test_admin_login():
            print("   ⚠️  Cannot test token generation - admin login failed")
            return False

        # Generate a token
        token_data = {
            "couple_name": f"Test Couple {datetime.now().strftime('%H%M%S')}",
            "couple_email": "test@example.com",
            "max_uses": 2,
            "expires_at": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
        }
        
        success, token_response = self.run_test("Generate token", "POST", "/admin/tokens", 200, token_data)
        if not success or 'token' not in token_response:
            print("   ❌ Token generation failed")
            return False
        
        generated_token = token_response['token']
        print(f"   🎯 Generated token: {generated_token}")
        
        # Test token validation (first use)
        success, validation_response = self.run_test(
            "Token validation (first use)", 
            "POST", 
            f"/validate-token?token={generated_token}", 
            200
        )
        
        if not success:
            return False
        
        plan_id = validation_response.get('plan_id')
        print(f"   🎯 Created birth plan: {plan_id}")
        
        # Test token reuse (should return same plan)
        success, reuse_response = self.run_test(
            "Token reuse (same plan)", 
            "POST", 
            f"/validate-token?token={generated_token}", 
            200
        )
        
        if success and reuse_response.get('plan_id') == plan_id:
            print("   🎯 Token reuse correctly returned same birth plan")
        
        return success

    def test_birth_plan_workflow(self):
        """Test complete birth plan workflow"""
        # Create a token and plan first
        if not self.test_admin_login():
            return False
        
        # Generate token
        token_data = {
            "couple_name": f"Workflow Test {datetime.now().strftime('%H%M%S')}",
            "max_uses": 1,
            "expires_at": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
        }
        
        success, token_response = self.run_test("Generate workflow token", "POST", "/admin/tokens", 200, token_data)
        if not success:
            return False
        
        # Validate token to create plan
        token = token_response['token']
        success, validation_response = self.run_test(
            "Validate workflow token", 
            "POST", 
            f"/validate-token?token={token}", 
            200
        )
        
        if not success:
            return False
        
        plan_id = validation_response['plan_id']
        
        # Update birth plan
        update_data = {
            "selected_options": ["opt_1", "opt_2"],
            "visited_categories": ["cat_labor"],
            "current_category_index": 1
        }
        
        success, _ = self.run_test(
            "Update birth plan", 
            "PUT", 
            f"/birth-plan/{plan_id}", 
            200, 
            update_data
        )
        
        if not success:
            return False
        
        # Get updated birth plan
        success, plan_response = self.run_test(
            "Get birth plan", 
            "GET", 
            f"/birth-plan/{plan_id}", 
            200
        )
        
        if not success:
            return False
        
        # Complete birth plan
        success, _ = self.run_test(
            "Complete birth plan", 
            "POST", 
            f"/birth-plan/{plan_id}/complete", 
            200
        )
        
        if not success:
            return False
        
        # Admin approve birth plan
        success, _ = self.run_test(
            "Approve birth plan", 
            "POST", 
            f"/admin/birth-plan/{plan_id}/approve", 
            200
        )
        
        return success

    def test_seed_data(self):
        """Test seeding initial data"""
        if not self.test_admin_login():
            return False
        
        return self.run_test("Seed initial data", "POST", "/admin/seed", 200)

    def run_enhanced_test_suite(self):
        """Run enhanced API test suite focusing on key features"""
        print("=" * 60)
        print("🧪 STARTING ENHANCED DOULA API TEST SUITE")
        print("=" * 60)
        
        # Basic endpoint tests
        print("\n📋 TESTING PUBLIC ENDPOINTS")
        print("-" * 30)
        
        self.run_test("Root endpoint", "GET", "/")
        self.run_test("Get categories", "GET", "/categories")
        self.run_test("Get options", "GET", "/options")
        
        # Admin authentication tests
        print("\n🔐 TESTING ADMIN AUTHENTICATION")
        print("-" * 30)
        
        self.test_admin_login()
        self.test_admin_login_invalid()
        
        # Admin functionality tests
        print("\n👑 TESTING ADMIN FUNCTIONALITY")
        print("-" * 30)
        
        self.test_admin_endpoints_after_login()
        self.test_seed_data()
        
        # Token system tests
        print("\n🎫 TESTING TOKEN SYSTEM")
        print("-" * 30)
        
        self.test_token_generation_and_usage()
        
        # Birth plan workflow tests
        print("\n📋 TESTING BIRTH PLAN WORKFLOW")
        print("-" * 30)
        
        self.test_birth_plan_workflow()
        
        # Final results
        print("\n" + "=" * 60)
        print("🏁 ENHANCED TEST SUITE RESULTS")
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
                    print(f"     Error: {test['error'][:100]}...")
        else:
            print("\n🎉 ALL TESTS PASSED!")
        
        return self.tests_passed, self.tests_run, self.test_results

def main():
    """Main test runner"""
    tester = DoulaAPITesterEnhanced()
    passed, total, results = tester.run_enhanced_test_suite()
    
    # Return appropriate exit code
    return 0 if passed == total else 1

if __name__ == "__main__":
    sys.exit(main())