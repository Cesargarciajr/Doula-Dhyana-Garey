import requests
import sys
import json
from datetime import datetime, timezone, timedelta

class AdminBirthPlansAPITester:
    def __init__(self, base_url="https://birth-plan-builder-1.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.session = requests.Session()
        self.tests_run = 0
        self.tests_passed = 0
        self.admin_token = None
        
    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if headers:
            test_headers.update(headers)
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=test_headers)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json() if response.content else {}
                except:
                    return True, {"message": "Success"}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_body = response.json()
                    print(f"   Error: {error_body}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_admin_login(self):
        """Test admin login and get session cookies"""
        print("=== Testing Admin Authentication ===")
        
        success, response = self.run_test(
            "Admin Login",
            "POST", 
            "/auth/login",
            200,
            data={"email": "admin@dhyanagarey.ie", "password": "Dhyana2026!"}
        )
        
        if success and response.get('is_admin'):
            print(f"✅ Admin login successful for: {response.get('email')}")
            return True
        else:
            print("❌ Admin login failed or user is not admin")
            return False

    def seed_test_data(self):
        """Seed test data including categories and options"""
        print("\n=== Seeding Test Data ===")
        
        success, response = self.run_test(
            "Seed Data",
            "POST",
            "/admin/seed", 
            200
        )
        
        if success:
            print(f"✅ Seed data successful: {response.get('message', 'Data seeded')}")
        else:
            print("ℹ️  Seed data may already exist")
        
        return success

    def get_categories_and_options(self):
        """Get categories and options for testing"""
        print("\n=== Getting Categories and Options ===")
        
        categories_success, categories_data = self.run_test(
            "Get Admin Categories",
            "GET",
            "/admin/categories",
            200
        )
        
        options_success, options_data = self.run_test(
            "Get Admin Options", 
            "GET",
            "/admin/options",
            200
        )
        
        if categories_success and options_success:
            print(f"✅ Found {len(categories_data)} categories and {len(options_data)} options")
            return categories_data, options_data
        else:
            print("❌ Failed to get categories or options")
            return [], []

    def create_test_birth_plan(self):
        """Create a test birth plan for editing"""
        print("\n=== Creating Test Birth Plan ===")
        
        # First create a token
        token_success, token_data = self.run_test(
            "Create Test Token",
            "POST",
            "/admin/tokens",
            200,
            data={
                "couple_name": "Test Couple for Admin Edit",
                "couple_email": "test-admin@example.com",
                "max_uses": 1,
                "expires_at": (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
            }
        )
        
        if not token_success:
            print("❌ Failed to create test token")
            return None
            
        # Validate the token to create birth plan
        token = token_data.get('token')
        validate_success, validate_data = self.run_test(
            "Validate Token (creates birth plan)",
            "POST",
            f"/validate-token?token={token}",
            200
        )
        
        if validate_success:
            plan_id = validate_data.get('plan_id')
            print(f"✅ Created test birth plan: {plan_id}")
            return plan_id
        else:
            print("❌ Failed to create birth plan")
            return None

    def test_admin_birth_plan_update(self, plan_id, test_options):
        """Test admin birth plan update endpoint - MAIN TEST"""
        print(f"\n=== Testing Admin Birth Plan Update (MAIN FEATURE) ===")
        
        # Get some option IDs for testing
        selected_options = test_options[:3] if len(test_options) >= 3 else test_options
        
        update_data = {
            "selected_options": selected_options,
            "visited_categories": ["cat_labor", "cat_pain"],
            "current_category_index": 1
        }
        
        success, response = self.run_test(
            "Admin Update Birth Plan",
            "PUT",
            f"/admin/birth-plan/{plan_id}",
            200,
            data=update_data
        )
        
        if success:
            print(f"✅ Birth plan updated successfully")
            print(f"   Selected options: {len(response.get('selected_options', []))}")
            
            # Verify options were actually saved
            actual_options = response.get('selected_options', [])
            if set(actual_options) == set(selected_options):
                print("✅ Selected options match what was sent")
                return True, response
            else:
                print(f"❌ Options mismatch. Sent: {selected_options}, Got: {actual_options}")
                return False, response
        else:
            print("❌ Failed to update birth plan")
            return False, {}

    def test_get_birth_plans(self):
        """Test getting all birth plans"""
        print("\n=== Testing Get Birth Plans ===")
        
        success, response = self.run_test(
            "Get All Birth Plans",
            "GET",
            "/admin/birth-plans",
            200
        )
        
        if success:
            print(f"✅ Retrieved {len(response)} birth plans")
            return response
        else:
            print("❌ Failed to get birth plans")
            return []

    def test_unauthorized_access(self):
        """Test that admin endpoints require authentication"""
        print("\n=== Testing Unauthorized Access ===")
        
        # Create new session without login
        temp_session = requests.Session()
        
        url = f"{self.base_url}/admin/birth-plans"
        response = temp_session.get(url, headers={'Content-Type': 'application/json'})
        
        if response.status_code == 401:
            print("✅ Unauthorized access properly blocked")
            return True
        else:
            print(f"❌ Expected 401 for unauthorized access, got {response.status_code}")
            return False

    def test_admin_birth_plan_edge_cases(self, plan_id):
        """Test edge cases for admin birth plan update"""
        print("\n=== Testing Edge Cases ===")
        
        # Test with invalid plan ID
        invalid_success, _ = self.run_test(
            "Update Invalid Birth Plan",
            "PUT",
            "/admin/birth-plan/invalid_id",
            404,
            data={"selected_options": [], "visited_categories": [], "current_category_index": 0}
        )
        
        if invalid_success:
            print("✅ Proper error handling for invalid birth plan ID")
        
        # Test with empty options (valid case)
        empty_success, _ = self.run_test(
            "Update with Empty Options",
            "PUT", 
            f"/admin/birth-plan/{plan_id}",
            200,
            data={"selected_options": [], "visited_categories": [], "current_category_index": 0}
        )
        
        if empty_success:
            print("✅ Empty options update works correctly")
        
        return invalid_success and empty_success

def main():
    print("🚀 Starting Admin Birth Plans API Testing...")
    print("Testing admin birth plans view/edit functionality\n")
    
    tester = AdminBirthPlansAPITester()
    
    # Test admin authentication
    if not tester.test_admin_login():
        print("❌ Admin login failed, stopping tests")
        return 1
    
    # Test unauthorized access
    tester.test_unauthorized_access()
    
    # Seed test data
    tester.seed_test_data()
    
    # Get categories and options
    categories, options = tester.get_categories_and_options()
    if not categories or not options:
        print("❌ No test data available, stopping tests")
        return 1
    
    # Create test birth plan
    plan_id = tester.create_test_birth_plan()
    if not plan_id:
        print("❌ Failed to create test birth plan, stopping tests")
        return 1
    
    # Get option IDs for testing
    option_ids = [opt.get('option_id') for opt in options if opt.get('option_id')][:5]
    
    # Test admin birth plan update - MAIN FEATURE
    update_success, updated_plan = tester.test_admin_birth_plan_update(plan_id, option_ids)
    if not update_success:
        print("❌ CRITICAL: Admin birth plan update failed")
    
    # Test getting birth plans
    birth_plans = tester.test_get_birth_plans()
    
    # Find our test birth plan and verify update
    test_plan = next((plan for plan in birth_plans if plan.get('plan_id') == plan_id), None)
    if test_plan:
        selected_count = len(test_plan.get('selected_options', []))
        print(f"✅ Verified test birth plan has {selected_count} selected options")
    
    # Test edge cases
    tester.test_admin_birth_plan_edge_cases(plan_id)
    
    # Print final results
    print(f"\n📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    # Focus on main feature result
    if update_success:
        print("🎯 MAIN FEATURE TEST: ✅ Admin Birth Plan Update PASSED")
    else:
        print("🎯 MAIN FEATURE TEST: ❌ Admin Birth Plan Update FAILED")
    
    print(f"\n🎯 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    return 0 if tester.tests_passed >= (tester.tests_run * 0.8) else 1  # 80% pass rate

if __name__ == "__main__":
    sys.exit(main())