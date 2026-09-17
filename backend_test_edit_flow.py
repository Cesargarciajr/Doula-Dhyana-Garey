import requests
import sys
from datetime import datetime, timezone, timedelta

class EditFlowTester:
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
                print(f"Response: {response.text[:300]}")
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

    def test_complete_edit_flow(self):
        """Test complete edit flow: create token -> complete plan -> edit -> reset"""
        if not self.admin_login():
            return False
        
        print("=" * 50)
        print("🎯 TESTING COMPLETE EDIT FLOW")
        print("=" * 50)
        
        # Step 1: Create a token with multiple uses for edit testing
        token_data = {
            "couple_name": f"Edit Flow Test {datetime.now().strftime('%H%M%S')}",
            "max_uses": 3,  # Allow 3 uses for thorough testing
            "expires_at": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
        }
        
        success, token_response = self.run_test("Create token with 3 uses", "POST", "/admin/tokens", 200, token_data)
        if not success:
            return False
        
        token = token_response['token']
        print(f"🔑 Created token: {token}")
        
        # Step 2: Validate token to create birth plan
        success, validation_response = self.run_test(
            "Validate new token", 
            "POST", 
            f"/validate-token?token={token}", 
            200
        )
        
        if not success:
            return False
        
        plan_id = validation_response['plan_id']
        token_info = validation_response.get('token_info', {})
        print(f"📋 Created plan: {plan_id}")
        print(f"🎫 Initial token info: {token_info}")
        
        # Verify initial token state
        if token_info.get('remaining_uses') != 3:
            print(f"❌ FAILED: Expected 3 remaining uses, got {token_info.get('remaining_uses')}")
            return False
        
        # Step 3: Complete the birth plan (uses 1 attempt)
        success, complete_response = self.run_test(
            "Complete birth plan", 
            "POST", 
            f"/birth-plan/{plan_id}/complete", 
            200
        )
        
        if not success:
            return False
        
        print(f"✅ Plan status after complete: {complete_response.get('status')}")
        
        # Step 4: Re-validate token to check usage increment
        success, post_complete_validation = self.run_test(
            "Re-validate token after complete", 
            "POST", 
            f"/validate-token?token={token}", 
            200
        )
        
        if not success:
            return False
        
        post_complete_token_info = post_complete_validation.get('token_info', {})
        print(f"🎫 Token info after complete: {post_complete_token_info}")
        
        # Verify usage was incremented
        if post_complete_token_info.get('remaining_uses') != 2:
            print(f"❌ FAILED: Expected 2 remaining uses after complete, got {post_complete_token_info.get('remaining_uses')}")
            return False
        
        if post_complete_token_info.get('current_uses') != 1:
            print(f"❌ FAILED: Expected 1 current use after complete, got {post_complete_token_info.get('current_uses')}")
            return False
        
        print("✅ Usage correctly incremented after completing birth plan")
        
        # Step 5: Test reset functionality (this is the core edit feature)
        success, reset_response = self.run_test(
            "Reset birth plan for editing", 
            "POST", 
            f"/birth-plan/{plan_id}/reset", 
            200
        )
        
        if not success:
            return False
        
        print(f"🔄 Plan status after reset: {reset_response.get('status')}")
        
        # Verify reset worked correctly
        if reset_response.get('status') != 'in_progress':
            print(f"❌ FAILED: Expected status 'in_progress' after reset, got '{reset_response.get('status')}'")
            return False
        
        if len(reset_response.get('visited_categories', [])) != 0:
            print(f"❌ FAILED: Expected empty visited_categories after reset, got {len(reset_response.get('visited_categories', []))}")
            return False
        
        if reset_response.get('current_category_index') != 0:
            print(f"❌ FAILED: Expected current_category_index=0 after reset, got {reset_response.get('current_category_index')}")
            return False
        
        print("✅ Reset successfully restored plan to in_progress state")
        
        # Step 6: Re-validate token to ensure reset doesn't use an attempt
        success, post_reset_validation = self.run_test(
            "Re-validate token after reset", 
            "POST", 
            f"/validate-token?token={token}", 
            200
        )
        
        if not success:
            return False
        
        post_reset_token_info = post_reset_validation.get('token_info', {})
        print(f"🎫 Token info after reset: {post_reset_token_info}")
        
        # Reset should NOT use an attempt - remaining uses should still be 2
        if post_reset_token_info.get('remaining_uses') != 2:
            print(f"❌ FAILED: Reset should not use an attempt. Expected 2 remaining, got {post_reset_token_info.get('remaining_uses')}")
            return False
        
        print("✅ Reset did not consume a token attempt")
        
        # Step 7: Test completing again after reset (uses another attempt)
        success, second_complete = self.run_test(
            "Complete birth plan again after reset", 
            "POST", 
            f"/birth-plan/{plan_id}/complete", 
            200
        )
        
        if not success:
            return False
        
        # Step 8: Final token validation
        success, final_validation = self.run_test(
            "Final token validation", 
            "POST", 
            f"/validate-token?token={token}", 
            200
        )
        
        if not success:
            return False
        
        final_token_info = final_validation.get('token_info', {})
        print(f"🎫 Final token info: {final_token_info}")
        
        # Should have 1 remaining use (started with 3, used 2)
        if final_token_info.get('remaining_uses') != 1:
            print(f"❌ FAILED: Expected 1 remaining use after 2 completions, got {final_token_info.get('remaining_uses')}")
            return False
        
        if final_token_info.get('current_uses') != 2:
            print(f"❌ FAILED: Expected 2 current uses after 2 completions, got {final_token_info.get('current_uses')}")
            return False
        
        print("✅ Final token state is correct")
        
        # Step 9: Test that we can still reset with remaining uses
        success, second_reset = self.run_test(
            "Reset with remaining uses", 
            "POST", 
            f"/birth-plan/{plan_id}/reset", 
            200
        )
        
        if not success:
            return False
        
        print("✅ Can still reset with remaining uses")
        
        # Step 10: Use up all attempts and test rejection
        # Complete again to use the last attempt
        success, third_complete = self.run_test(
            "Complete to use last attempt", 
            "POST", 
            f"/birth-plan/{plan_id}/complete", 
            200
        )
        
        if not success:
            return False
        
        # Now try to reset with no remaining uses - should fail
        success, no_uses_reset = self.run_test(
            "Try to reset with no remaining uses (should fail)", 
            "POST", 
            f"/birth-plan/{plan_id}/reset", 
            400
        )
        
        # This test succeeds if it fails with 400
        if success:
            print("❌ FAILED: Reset should be rejected when no remaining uses")
            return False
        
        print("✅ Correctly rejected reset attempt with no remaining uses")
        
        print("=" * 50)
        print("🎉 COMPLETE EDIT FLOW TEST PASSED!")
        print("=" * 50)
        
        return True

    def run_all_tests(self):
        """Run all edit flow tests"""
        print("🧪 TESTING BIRTH PLAN EDIT FLOW")
        print("=" * 60)
        
        success = self.test_complete_edit_flow()
        
        print(f"\n📊 Tests Passed: {self.tests_passed}/{self.tests_run}")
        print(f"📈 Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        return success

def main():
    tester = EditFlowTester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())