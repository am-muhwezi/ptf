// Test script for Outdoor Memberships API integration
import authService from './frontend/src/services/authService.js';

const testOutdoorMembershipsAPI = async () => {
  console.log('🧪 Testing Outdoor Memberships API Integration...\n');

  try {
    // Test 1: Get outdoor members
    console.log('1. Testing getOutdoorMembers...');
    const membersResponse = await authService.getOutdoorMembers();
    console.log('✅ Members loaded:', membersResponse.data.length, 'members');
    
    // Test 2: Get membership stats
    console.log('\n2. Testing getOutdoorMembershipStats...');
    const statsResponse = await authService.getOutdoorMembershipStats();
    console.log('✅ Stats loaded:', statsResponse.data);
    
    // Test 3: Search functionality
    console.log('\n3. Testing search functionality...');
    const searchResponse = await authService.getOutdoorMembers({ search: 'alex' });
    console.log('✅ Search results:', searchResponse.data.length, 'members');
    
    console.log('\n🎉 All tests passed! The Outdoor Memberships API integration is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
};

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testOutdoorMembershipsAPI();
}

export default testOutdoorMembershipsAPI;