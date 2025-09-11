// Quick test to verify frontend API calls work
const testFrontendAPI = async () => {
  console.log('🧪 Testing Frontend API Integration...');
  
  // Simulate the API calls the frontend makes
  const baseURL = 'https://api.paulstropicalfitness.fit';
  
  const tests = [
    { name: 'All members page 1', url: `${baseURL}/all/?page=1&limit=20` },
    { name: 'All members page 2', url: `${baseURL}/all/?page=2&limit=20` },
    { name: 'Search members', url: `${baseURL}/all/?page=1&limit=20&q=test` },
    { name: 'Indoor members', url: `${baseURL}/indoor/?page=1&limit=20` },
    { name: 'Outdoor members', url: `${baseURL}/outdoor/?page=1&limit=20` },
  ];
  
  for (const test of tests) {
    const start = Date.now();
    try {
      const response = await fetch(test.url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // No auth token for this test
      });
      
      const duration = Date.now() - start;
      
      if (response.status === 401) {
        console.log(`✅ ${test.name}: ${duration}ms (Auth required - expected)`);
      } else if (response.ok) {
        console.log(`✅ ${test.name}: ${duration}ms (Success)`);
      } else {
        console.log(`⚠️  ${test.name}: ${duration}ms (HTTP ${response.status})`);
      }
    } catch (error) {
      const duration = Date.now() - start;
      if (error.name === 'AbortError' || error.message.includes('timeout')) {
        console.log(`❌ ${test.name}: TIMEOUT after ${duration}ms`);
      } else {
        console.log(`❌ ${test.name}: ${duration}ms - ${error.message}`);
      }
    }
  }
  
  console.log('\n🎯 Frontend Integration Test Complete!');
};

// Run the test
testFrontendAPI();