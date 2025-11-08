import React, { useState } from 'react';
import axios from 'axios';

const APITestPanel = () => {
  const [testResults, setTestResults] = useState(null);
  const [testing, setTesting] = useState(false);
  const [expandedTest, setExpandedTest] = useState(null);

  const runAPITests = async () => {
    setTesting(true);
    setTestResults(null);
    
    const results = {
      passed: 0,
      failed: 0,
      tests: []
    };

    const testEndpoint = async (name, method, url, expectedStatus = 200) => {
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        };

        let response;
        switch (method.toLowerCase()) {
          case 'get':
            response = await axios.get(`http://localhost:5000/api${url}`, config);
            break;
          case 'post':
            response = await axios.post(`http://localhost:5000/api${url}`, {}, config);
            break;
          default:
            throw new Error(`Unsupported method: ${method}`);
        }

        const success = response.status === expectedStatus;
        results.tests.push({
          name,
          method,
          url,
          status: success ? 'PASSED' : 'FAILED',
          responseCode: response.status,
          dataCount: Array.isArray(response.data) ? response.data.length : 
                    response.data?.data?.length || 
                    (typeof response.data === 'object' ? Object.keys(response.data).length : 1),
          error: null
        });
        
        if (success) results.passed++;
        else results.failed++;
        
        return response.data;
      } catch (error) {
        results.tests.push({
          name,
          method,
          url,
          status: 'ERROR',
          responseCode: error.response?.status || 0,
          dataCount: 0,
          error: error.message
        });
        results.failed++;
        return null;
      }
    };

    // Test User Management APIs
    await testEndpoint('Get All Users', 'GET', '/users');
    await testEndpoint('Get Users with Pagination', 'GET', '/users?page=1&limit=10');
    await testEndpoint('Filter Users by Role', 'GET', '/users?role=student');
    await testEndpoint('Advanced Student Filter', 'GET', '/users/students/advanced-filter?page=1&limit=5');
    await testEndpoint('User Stats', 'GET', '/users/stats');

    // Test Event Management APIs
    const eventsData = await testEndpoint('Get All Events', 'GET', '/events');
    await testEndpoint('Get Events with Filters', 'GET', '/events?status=upcoming&page=1&limit=10');
    
    // Test specific event details if events exist
    if (eventsData && (eventsData.length > 0 || eventsData.data?.length > 0)) {
      const events = eventsData.data || eventsData;
      if (events.length > 0) {
        const eventId = events[0]._id;
        await testEndpoint('Get Event Details', 'GET', `/events/${eventId}`);
        // Use existing endpoints instead of non-existent ones
        await testEndpoint('Get Event Registrations', 'GET', `/registrations?event=${eventId}`);
        await testEndpoint('Get Event Stats', 'GET', `/events/${eventId}/stats`);
      }
    }

    // Test Registration and Attendance APIs
    await testEndpoint('Get Registrations', 'GET', '/registrations');
    await testEndpoint('Get Attendance Records', 'GET', '/attendance');

    // Test Analytics APIs
    await testEndpoint('Dashboard Analytics', 'GET', '/analytics/dashboard');
    await testEndpoint('User Analytics', 'GET', '/analytics/users');
    await testEndpoint('Event Analytics', 'GET', '/analytics/events');

    // Test Database APIs (if available)
    await testEndpoint('Database Health', 'GET', '/database/health');
    await testEndpoint('Database Stats', 'GET', '/database/stats');

    setTestResults(results);
    setTesting(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PASSED': return '#22543d';
      case 'FAILED': return '#c53030';
      case 'ERROR': return '#e53e3e';
      default: return '#4a5568';
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case 'PASSED': return '#c6f6d5';
      case 'FAILED': return '#fed7d7';
      case 'ERROR': return '#feb2b2';
      default: return '#e2e8f0';
    }
  };

  return (
    <div style={{ 
      padding: '2rem', 
      background: 'white', 
      borderRadius: '12px', 
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      margin: '1rem 0'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2rem' 
      }}>
        <div>
          <h2 style={{ 
            color: '#2d3748', 
            fontSize: '1.5rem', 
            fontWeight: '600', 
            marginBottom: '0.5rem' 
          }}>
            API Integration Tests
          </h2>
          <p style={{ color: '#718096' }}>
            Test all API endpoints used by Smart components
          </p>
        </div>
        <button
          onClick={runAPITests}
          disabled={testing}
          style={{
            padding: '0.75rem 1.5rem',
            background: testing ? '#cbd5e0' : '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: testing ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          {testing ? '🧪 Testing...' : '▶️ Run Tests'}
        </button>
      </div>

      {testing && (
        <div style={{ 
          textAlign: 'center', 
          padding: '2rem', 
          color: '#718096' 
        }}>
          <div style={{ marginBottom: '1rem' }}>🔄 Running API tests...</div>
          <div style={{ 
            width: '100%', 
            height: '4px', 
            background: '#e2e8f0', 
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              background: '#667eea',
              animation: 'loading 2s infinite',
              borderRadius: '2px'
            }} />
          </div>
        </div>
      )}

      {testResults && (
        <div>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: '1rem', 
            marginBottom: '2rem' 
          }}>
            <div style={{ 
              background: '#f7fafc', 
              padding: '1.5rem', 
              borderRadius: '8px', 
              textAlign: 'center' 
            }}>
              <div style={{ 
                fontSize: '2rem', 
                fontWeight: '700', 
                color: '#2d3748', 
                marginBottom: '0.5rem' 
              }}>
                {testResults.tests.length}
              </div>
              <div style={{ color: '#718096', fontSize: '0.875rem' }}>Total Tests</div>
            </div>
            <div style={{ 
              background: '#c6f6d5', 
              padding: '1.5rem', 
              borderRadius: '8px', 
              textAlign: 'center' 
            }}>
              <div style={{ 
                fontSize: '2rem', 
                fontWeight: '700', 
                color: '#22543d', 
                marginBottom: '0.5rem' 
              }}>
                {testResults.passed}
              </div>
              <div style={{ color: '#22543d', fontSize: '0.875rem' }}>Passed</div>
            </div>
            <div style={{ 
              background: '#fed7d7', 
              padding: '1.5rem', 
              borderRadius: '8px', 
              textAlign: 'center' 
            }}>
              <div style={{ 
                fontSize: '2rem', 
                fontWeight: '700', 
                color: '#c53030', 
                marginBottom: '0.5rem' 
              }}>
                {testResults.failed}
              </div>
              <div style={{ color: '#c53030', fontSize: '0.875rem' }}>Failed</div>
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ 
              color: '#2d3748', 
              fontSize: '1.25rem', 
              fontWeight: '600', 
              marginBottom: '1rem' 
            }}>
              Test Results
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {testResults.tests.map((test, index) => (
              <div 
                key={index}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}
              >
                <div 
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem',
                    background: '#f7fafc',
                    cursor: 'pointer'
                  }}
                  onClick={() => setExpandedTest(expandedTest === index ? null : index)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: getStatusColor(test.status),
                      background: getStatusBg(test.status)
                    }}>
                      {test.status}
                    </span>
                    <span style={{ fontWeight: '600', color: '#2d3748' }}>
                      {test.name}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#718096' }}>
                    <span>{test.method}</span>
                    <span>{test.responseCode}</span>
                    {test.dataCount > 0 && <span>📊 {test.dataCount} items</span>}
                    <span>{expandedTest === index ? '▼' : '▶'}</span>
                  </div>
                </div>
                {expandedTest === index && (
                  <div style={{ padding: '1rem', background: 'white' }}>
                    <div style={{ color: '#4a5568', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                      <strong>Endpoint:</strong> {test.method} {test.url}
                    </div>
                    <div style={{ color: '#4a5568', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                      <strong>Response Code:</strong> {test.responseCode}
                    </div>
                    {test.dataCount > 0 && (
                      <div style={{ color: '#4a5568', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                        <strong>Data Count:</strong> {test.dataCount} items
                      </div>
                    )}
                    {test.error && (
                      <div style={{ 
                        color: '#c53030', 
                        fontSize: '0.875rem', 
                        background: '#fed7d7', 
                        padding: '0.5rem', 
                        borderRadius: '4px' 
                      }}>
                        <strong>Error:</strong> {test.error}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default APITestPanel;