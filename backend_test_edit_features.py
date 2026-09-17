import requests
import sys
from datetime import datetime, timezone, timedelta

class EditFeaturesTester:
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

    def test_edit123_token_validation(self):
        """Test the specific edit123 token"""
        success, response = self.run_test(
            "Validate edit123 token", 
            "POST", 
            "/validate-token?token=edit123", 
            200
        )
        
        if not success:
            return False, None
        
        # Check if token_info exists and has remaining_uses
        token_info = response.get('token_info', {})
        if not token_info:
            print(f"❌ MISSING: token_info not found in edit123 validation response")
            return False, None
        
        remaining_uses = token_info.get('remaining_uses', 0)
        max_uses = token_info.get('max_uses', 0)
        current_uses = token_info.get('current_uses', 0)
        
        print(f"🎯 edit123 token info: max_uses={max_uses}, current_uses={current_uses}, remaining_uses={remaining_uses}")
        
        # Should have at least 1 remaining use for editing
        if remaining_uses < 1:
            print(f"❌ INSUFFICIENT: edit123 token has {remaining_uses} remaining uses, need at least 1 for editing")
            return False, None
        
        return True, response

    def test_birth_plan_reset_endpoint(self):
        """Test the birth plan reset endpoint functionality"""
        if not self.admin_login():
            return False
        
        # First validate edit123 token to get/create birth plan
        success, validation_response = self.test_edit123_token_validation()
        if not success:
            return False
            
        plan_id = validation_response.get('plan_id')
        if not plan_id:
            print(f"❌ ERROR: No plan_id in edit123 validation response")
            return False
        
        print(f"🎯 Using birth plan: {plan_id}")
        
        # Get the current birth plan status
        success, plan_data = self.run_test(
            "Get birth plan current status",
            "GET",
            f"/birth-plan/{plan_id}",
            200
        )
        
        if not success:
            return False
            
        print(f"🎯 Current birth plan status: {plan_data.get('status', 'unknown')}")
        
        # If plan is already in progress, complete it first so we can test reset
        if plan_data.get('status') == 'in_progress':
            success, complete_response = self.run_test(
                "Complete birth plan to test reset",
                "POST",
                f"/birth-plan/{plan_id}/complete",
                200
            )
            if not success:
                return False
            print(f"🎯 Birth plan completed, new status: {complete_response.get('status', 'unknown')}")
        
        # Now test the reset endpoint
        success, reset_response = self.run_test(
            "Reset birth plan to in_progress",
            "POST", 
            f"/birth-plan/{plan_id}/reset",
            200
        )
        
        if not success:
            return False
        
        # Verify the reset worked
        reset_status = reset_response.get('status')
        if reset_status != 'in_progress':
            print(f"❌ RESET FAILED: Expected status 'in_progress', got '{reset_status}'")
            return False
        
        # Check that the reset cleared visited categories
        visited_categories = reset_response.get('visited_categories', [])
        if len(visited_categories) != 0:
            print(f"❌ RESET INCOMPLETE: visited_categories not cleared, still has {len(visited_categories)} items")
            return False
        
        # Check that current_category_index was reset
        current_index = reset_response.get('current_category_index', -1)
        if current_index != 0:
            print(f"❌ RESET INCOMPLETE: current_category_index not reset to 0, got {current_index}")
            return False
        
        print(f"🎯 ✅ Reset successful: status={reset_status}, visited_categories=[], current_index={current_index}")
        return True

    def test_reset_requires_remaining_uses(self):
        """Test that reset endpoint requires remaining uses"""
        if not self.admin_login():
            return False
        
        # Create a token with max_uses = 1 and use it up
        token_data = {
            "couple_name": f"Test No Remaining Uses {datetime.now().strftime('%H%M%S')}",
            "max_uses": 1,
            "expires_at": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
        }
        
        success, token_response = self.run_test("Generate token with max_uses=1", "POST", "/admin/tokens", 200, token_data)
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
        
        # Complete the birth plan (this should use up the token)
        success, complete_response = self.run_test(
            "Complete birth plan (uses token)", 
            "POST", 
            f"/birth-plan/{plan_id}/complete", 
            200
        )
        
        if not success:
            return False
        
        # Now try to reset - should fail with 400 because no remaining uses
        success, reset_response = self.run_test(
            "Try to reset with no remaining uses (should fail)", 
            "POST", 
            f"/birth-plan/{plan_id}/reset", 
            400
        )
        
        # In this case, success=False is what we want (400 status)
        if success:
            print(f"❌ ERROR: Reset should have failed with 400, but got 200")
            return False
        
        print(f"🎯 ✅ Correctly rejected reset attempt with no remaining uses")
        return True

    def test_token_info_in_validation_response(self):
        """Test that token validation returns proper token_info"""
        success, response = self.test_edit123_token_validation()
        if not success:
            return False
        
        token_info = response.get('token_info', {})
        required_fields = ['max_uses', 'current_uses', 'remaining_uses']
        
        for field in required_fields:
            if field not in token_info:
                print(f"❌ MISSING: token_info.{field} field not found")
                return False
        
        # Verify remaining_uses calculation
        max_uses = token_info['max_uses']
        current_uses = token_info['current_uses']
        remaining_uses = token_info['remaining_uses']
        expected_remaining = max(0, max_uses - current_uses)
        
        if remaining_uses != expected_remaining:
            print(f"❌ CALCULATION ERROR: remaining_uses={remaining_uses}, but max_uses={max_uses} - current_uses={current_uses} = {expected_remaining}")
            return False
        
        print(f"🎯 ✅ Token info calculation correct: {max_uses} - {current_uses} = {remaining_uses}")
        return True

    def run_edit_features_tests(self):
        """Run all edit feature tests"""
        print("=" * 60)
        print("🧪 TESTING BIRTH PLAN EDIT FEATURES")
        print("=" * 60)
        
        print("\n🎫 TESTING edit123 TOKEN VALIDATION")
        print("-" * 40)
        test1 = self.test_edit123_token_validation()[0]
        
        print("\n🔄 TESTING BIRTH PLAN RESET ENDPOINT")
        print("-" * 40)
        test2 = self.test_birth_plan_reset_endpoint()
        
        print("\n🚫 TESTING RESET REQUIRES REMAINING USES")
        print("-" * 40)
        test3 = self.test_reset_requires_remaining_uses()
        
        print("\n📊 TESTING TOKEN INFO IN VALIDATION")
        print("-" * 40)
        test4 = self.test_token_info_in_validation_response()
        
        print("\n" + "=" * 60)
        print("🏁 EDIT FEATURES TEST RESULTS")
        print("=" * 60)
        print(f"📊 Tests Passed: {self.tests_passed}/{self.tests_run}")
        print(f"📈 Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("\n🎉 ALL EDIT FEATURES TESTS PASSED!")
        else:
            print(f"\n⚠️  {self.tests_run - self.tests_passed} tests failed")
        
        return self.tests_passed == self.tests_run

def main():
    tester = EditFeaturesTester()
    success = tester.run_edit_features_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())