// API Endpoint Testing for Smart Components
// This script tests all the API endpoints used by SmartUserManagement and SmartEventManagement

const testAPIEndpoints = async () => {
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const token = localStorage.getItem('token'); // Get auth token from localStorage
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  console.log('🧪 Starting API Endpoint Tests...\n');

  // Test results
  const results = {
    passed: 0,
    failed: 0,
    endpoints: []
  };

  const testEndpoint = async (name, method, url, data = null) => {
    try {
      let response;
      const config = { headers };
      
      switch (method.toLowerCase()) {
        case 'get':
          response = await fetch(`${baseURL}${url}`, { method: 'GET', headers });
          break;
        case 'post':
          response = await fetch(`${baseURL}${url}`, { 
            method: 'POST', 
            headers,
            body: data ? JSON.stringify(data) : undefined
          });
          break;
        case 'put':
          response = await fetch(`${baseURL}${url}`, { 
            method: 'PUT', 
            headers,
            body: data ? JSON.stringify(data) : undefined
          });
          break;
        case 'delete':
          response = await fetch(`${baseURL}${url}`, { method: 'DELETE', headers });
          break;
      }

      const responseData = await response.json();
      
      if (response.ok) {
        console.log(`✅ ${name}: PASSED (${response.status})`);
        results.passed++;
        results.endpoints.push({ name, status: 'PASSED', code: response.status });
        return responseData;
      } else {
        console.log(`❌ ${name}: FAILED (${response.status}) - ${responseData.message || 'Unknown error'}`);
        results.failed++;
        results.endpoints.push({ name, status: 'FAILED', code: response.status, error: responseData.message });
        return null;
      }
    } catch (error) {
      console.log(`❌ ${name}: ERROR - ${error.message}`);
      results.failed++;
      results.endpoints.push({ name, status: 'ERROR', error: error.message });
      return null;
    }
  };

  // Test User Management APIs
  console.log('👥 Testing User Management APIs...');
  
  // Basic user endpoints
  await testEndpoint('Get All Users', 'GET', '/users');
  await testEndpoint('Get Users with Filters', 'GET', '/users?role=student&page=1&limit=10');
  await testEndpoint('Advanced Student Filter', 'GET', '/users/students/advanced-filter?departments=CSE&years=2&page=1&limit=10');
  await testEndpoint('Get User Analytics', 'GET', '/users/analytics');
  await testEndpoint('Get User Analytics Summary', 'GET', '/users/analytics/summary');

  // Test Event Management APIs
  console.log('\n📅 Testing Event Management APIs...');
  
  // Basic event endpoints
  const eventsData = await testEndpoint('Get All Events', 'GET', '/events');
  await testEndpoint('Get Events with Filters', 'GET', '/events?status=upcoming&category=technical&page=1&limit=12');
  
  // Test event details if we have events
  if (eventsData && eventsData.length > 0) {
    const eventId = eventsData[0]._id || eventsData[0].id;
    if (eventId) {
      await testEndpoint('Get Event Details', 'GET', `/events/${eventId}`);
      await testEndpoint('Get Event Participants', 'GET', `/events/${eventId}/participants`);
      await testEndpoint('Get Event Attendance', 'GET', `/events/${eventId}/attendance`);
      await testEndpoint('Get Event Analytics', 'GET', `/events/${eventId}/analytics`);
    }
  }

  // Test Registration and Attendance APIs
  console.log('\n📊 Testing Registration & Attendance APIs...');
  await testEndpoint('Get All Registrations', 'GET', '/registrations');
  await testEndpoint('Get All Attendance Records', 'GET', '/attendance');
  await testEndpoint('Get Attendance Analytics', 'GET', '/attendance/analytics');

  // Test Analytics APIs
  console.log('\n📈 Testing Analytics APIs...');
  await testEndpoint('Get Dashboard Analytics', 'GET', '/analytics/dashboard');
  await testEndpoint('Get User Analytics', 'GET', '/analytics/users');
  await testEndpoint('Get Event Analytics', 'GET', '/analytics/events');
  await testEndpoint('Get Performance Analytics', 'GET', '/analytics/performance');

  // Test Database Health (if available)
  console.log('\n🗄️ Testing Database Health...');
  await testEndpoint('Database Health Check', 'GET', '/database/health');
  await testEndpoint('Database Stats', 'GET', '/database/stats');

  // Summary
  console.log('\n📋 Test Summary:');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📊 Total: ${results.passed + results.failed}`);
  
  if (results.failed > 0) {
    console.log('\n⚠️ Failed Endpoints:');
    results.endpoints.filter(e => e.status !== 'PASSED').forEach(endpoint => {
      console.log(`   • ${endpoint.name}: ${endpoint.error || `HTTP ${endpoint.code}`}`);
    });
  }

  return results;
};

// Auto-run the test when this script is loaded
if (typeof window !== 'undefined') {
  // Browser environment
  window.testAPI = testAPIEndpoints;
  console.log('🔧 API Test function loaded. Run testAPI() in console to test endpoints.');
} else {
  // Node environment
  testAPIEndpoints().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
  });
}
