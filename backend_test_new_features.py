import requests
import sys
from datetime import datetime, timezone, timedelta

class NewFeaturesTester:
    def __init__(self, base_url="https://birth-plan-builder-1.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.session = requests.Session()
        self.tests_run = 0
        self.tests_passed = 0
        self.admin_logged_in = False

    def run_test(self, name, method, endpoint, expected_status=200, data=None):
        """Run a single test"""
        url = f"{self.base_url}{endpoint}"
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = self.session.get(url, timeout=30)
            elif method == 'POST':
                response = self.session.post(url, json=data, timeout=30)
            elif method == 'PUT':
                response = self.session.put(url, json=data, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ PASSED - Status: {response.status_code}")
                return True, response.json() if response.content else {}
            else:
                print(f"❌ FAILED - Expected {expected_status}, got {response.status_code}")
                print(f"Response: {response.text[:200]}")
                return False, {}

        except Exception as e:
            print(f"❌ FAILED - Error: {str(e)}")
            return False, {}

    def admin_login(self):
        """Login as admin"""
        if self.admin_logged_in:
            return True
            
        login_data = {
            "email": "admin@dhyanagarey.ie", 
            "password": "Dhyana2026!"
        }
        success, response = self.run_test("Admin Login", "POST", "/auth/login", 200, login_data)
        if success:
            self.admin_logged_in = True
            print(f"🎯 Logged in as: {response.get('name', 'Admin')}")
        return success

    def test_token_remaining_uses_feature(self):
        """Test that validate-token returns remaining_uses in token_info"""
        if not self.admin_login():
            return False

        # Generate token with max_uses = 2
        token_data = {
            "couple_name": f"Test Remaining Uses {datetime.now().strftime('%H%M%S')}",
            "max_uses": 2,
            "expires_at": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
        }
        
        success, token_response = self.run_test("Generate token for remaining uses test", "POST", "/admin/tokens", 200, token_data)
        if not success or 'token' not in token_response:
            return False
        
        token = token_response['token']
        
        # Test first validation - should return remaining_uses
        success, validation_response = self.run_test(
            "Validate token - check remaining_uses field", 
            "POST", 
            f"/validate-token?token={token}", 
            200
        )
        
        if not success:
            return False
        
        # Check if token_info exists and has remaining_uses
        token_info = validation_response.get('token_info', {})
        if 'remaining_uses' not in token_info:
            print(f"❌ MISSING: token_info.remaining_uses field not found in response")
            print(f"   Response: {validation_response}")
            return False
        
        remaining_uses = token_info['remaining_uses']
        max_uses = token_info.get('max_uses', 0)
        current_uses = token_info.get('current_uses', 0)
        
        print(f"🎯 Token info: max_uses={max_uses}, current_uses={current_uses}, remaining_uses={remaining_uses}")
        
        # Should be 2 remaining (max 2, used 0)
        if remaining_uses != 2:
            print(f"❌ INCORRECT: Expected remaining_uses=2, got {remaining_uses}")
            return False
        
        return True

    def test_token_usage_increment_on_complete(self):
        """Test that complete endpoint increments token usage"""
        if not self.admin_login():
            return False

        # Generate new token
        token_data = {
            "couple_name": f"Test Usage Increment {datetime.now().strftime('%H%M%S')}",
            "max_uses": 2,
            "expires_at": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
        }
        
        success, token_response = self.run_test("Generate token for usage test", "POST", "/admin/tokens", 200, token_data)
        if not success:
            return False
        
        token = token_response['token']
        
        # Validate token to create birth plan
        success, validation_response = self.run_test(
            "Validate token to create plan", 
            "POST", 
            f"/validate-token?token={token}", 
            200
        )
        
        if not success:
            return False
        
        plan_id = validation_response['plan_id']
        
        # Check initial token info (should have 2 remaining)
        initial_remaining = validation_response.get('token_info', {}).get('remaining_uses', 0)
        print(f"🎯 Initial remaining uses: {initial_remaining}")
        
        # Complete the birth plan (this should increment usage)
        success, complete_response = self.run_test(
            "Complete birth plan (should increment usage)", 
            "POST", 
            f"/birth-plan/{plan_id}/complete", 
            200
        )
        
        if not success:
            return False
        
        # Validate token again to check if usage was incremented
        success, second_validation = self.run_test(
            "Re-validate token to check usage increment", 
            "POST", 
            f"/validate-token?token={token}", 
            200
        )
        
        if not success:
            return False
        
        new_remaining = second_validation.get('token_info', {}).get('remaining_uses', 0)
        new_current_uses = second_validation.get('token_info', {}).get('current_uses', 0)
        
        print(f"🎯 After complete - remaining: {new_remaining}, current_uses: {new_current_uses}")
        
        # Should have 1 remaining (was 2, used 1)
        if new_remaining != 1:
            print(f"❌ INCORRECT: Expected remaining_uses=1 after complete, got {new_remaining}")
            return False
        
        if new_current_uses != 1:
            print(f"❌ INCORRECT: Expected current_uses=1 after complete, got {new_current_uses}")
            return False
        
        return True

    def test_admin_options_filter(self):
        """Test that admin options endpoint supports category filtering"""
        if not self.admin_login():
            return False

        # Test getting all options
        success, all_options = self.run_test("Get all admin options", "GET", "/admin/options", 200)
        if not success:
            return False
        
        print(f"🎯 Total options found: {len(all_options)}")
        
        # Get categories to test filtering
        success, categories = self.run_test("Get categories for filtering", "GET", "/admin/categories", 200)
        if not success or not categories:
            return False
        
        # Test filtering by first category
        first_category_id = categories[0]['category_id']
        success, filtered_options = self.run_test(
            f"Get options filtered by category {first_category_id}", 
            "GET", 
            f"/admin/options?category_id={first_category_id}", 
            200
        )
        
        if not success:
            return False
        
        print(f"🎯 Options in category {first_category_id}: {len(filtered_options)}")
        
        # Check that we got fewer options when filtering (unless there's only one category)
        if len(filtered_options) >= len(all_options) and len(categories) > 1:
            print(f"❌ FILTERING NOT WORKING: Expected fewer than {len(all_options)} options when filtering, got {len(filtered_options)}")
            return False
        
        # Verify all returned options belong to the requested category
        wrong_category_count = 0
        for option in filtered_options:
            if option.get('category_id') != first_category_id:
                wrong_category_count += 1
        
        if wrong_category_count > 0:
            print(f"❌ INCORRECT: {wrong_category_count} options have wrong category_id")
            return False
        
        print(f"🎯 All {len(filtered_options)} filtered options belong to category {first_category_id}")
        return True

    def test_test123_token(self):
        """Test the specific test token 'test123'"""
        success, response = self.run_test(
            "Validate test123 token", 
            "POST", 
            "/validate-token?token=test123", 
            200
        )
        
        if not success:
            return False
        
        # Check if token_info exists
        token_info = response.get('token_info', {})
        if not token_info:
            print(f"❌ MISSING: token_info not found in test123 validation response")
            return False
        
        print(f"🎯 test123 token info: {token_info}")
        return True

    def run_new_features_tests(self):
        """Run tests for new features"""
        print("=" * 60)
        print("🧪 TESTING NEW FEATURES - DOULA WEBSITE")
        print("=" * 60)
        
        print("\n🎫 TESTING TOKEN REMAINING_USES FEATURE")
        print("-" * 40)
        test1 = self.test_token_remaining_uses_feature()
        
        print("\n💰 TESTING TOKEN USAGE INCREMENT ON COMPLETE")
        print("-" * 40)
        test2 = self.test_token_usage_increment_on_complete()
        
        print("\n🔍 TESTING ADMIN OPTIONS CATEGORY FILTER")
        print("-" * 40)
        test3 = self.test_admin_options_filter()
        
        print("\n🔑 TESTING test123 TOKEN")
        print("-" * 40)
        test4 = self.test_test123_token()
        
        print("\n" + "=" * 60)
        print("🏁 NEW FEATURES TEST RESULTS")
        print("=" * 60)
        print(f"📊 Tests Passed: {self.tests_passed}/{self.tests_run}")
        print(f"📈 Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("\n🎉 ALL NEW FEATURES TESTS PASSED!")
        else:
            print(f"\n⚠️  {self.tests_run - self.tests_passed} tests failed")
        
        return self.tests_passed == self.tests_run

def main():
    tester = NewFeaturesTester()
    success = tester.run_new_features_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())