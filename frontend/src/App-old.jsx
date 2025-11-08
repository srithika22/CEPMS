import { useState } from 'react'
// import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f0fdf4 100%)',
      padding: '2rem',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header Section */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ 
            fontSize: '3rem', 
            fontWeight: 'bold', 
            color: '#0369a1',
            marginBottom: '1rem'
          }}>
            🎓 CEPMS - VERIFICATION
          </h1>
          <p style={{ 
            fontSize: '1.25rem', 
            color: '#6b7280',
            marginBottom: '0.5rem'
          }}>
            Comprehensive College Event & Program Management System
          </p>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '0.5rem',
            fontSize: '0.875rem',
            color: '#9ca3af'
          }}>
            <span style={{ 
              width: '8px', 
              height: '8px', 
              backgroundColor: '#10b981', 
              borderRadius: '50%',
              animation: 'pulse 2s infinite'
            }}></span>
            This is the CORRECT CEPMS Project - Frontend Running
          </div>
        </div>

        {/* Test Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div style={{ 
            backgroundColor: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 2px 15px -3px rgba(0, 0, 0, 0.07)',
            border: '1px solid #e5e5e5'
          }}>
            <h3 style={{ color: '#0369a1', marginBottom: '1rem' }}>👨‍💼 Admin Portal</h3>
            <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
              Manage events, users, and system configurations
            </p>
            <button style={{
              backgroundColor: '#0ea5e9',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.75rem',
              border: 'none',
              cursor: 'pointer',
              width: '100%'
            }}>
              Access Admin Dashboard
            </button>
          </div>

          <div style={{ 
            backgroundColor: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 2px 15px -3px rgba(0, 0, 0, 0.07)',
            border: '1px solid #e5e5e5'
          }}>
            <h3 style={{ color: '#16a34a', marginBottom: '1rem' }}>�‍� Faculty Portal</h3>
            <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
              Create events, manage attendance, track feedback
            </p>
            <button style={{
              backgroundColor: '#22c55e',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.75rem',
              border: 'none',
              cursor: 'pointer',
              width: '100%'
            }}>
              Access Faculty Dashboard
            </button>
          </div>

          <div style={{ 
            backgroundColor: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 2px 15px -3px rgba(0, 0, 0, 0.07)',
            border: '1px solid #e5e5e5'
          }}>
            <h3 style={{ color: '#eab308', marginBottom: '1rem' }}>👨‍🎓 Student Portal</h3>
            <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
              Register for events, view schedules, submit feedback
            </p>
            <button style={{
              backgroundColor: 'transparent',
              color: '#0ea5e9',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.75rem',
              border: '2px solid #0ea5e9',
              cursor: 'pointer',
              width: '100%'
            }}>
              Access Student Dashboard
            </button>
          </div>
        </div>

        {/* Counter Test */}
        <div style={{ 
          backgroundColor: 'white',
          borderRadius: '1rem',
          padding: '2rem',
          boxShadow: '0 2px 15px -3px rgba(0, 0, 0, 0.07)',
          border: '1px solid #e5e5e5',
          textAlign: 'center'
        }}>
          <h3 style={{ marginBottom: '1rem', color: '#374151' }}>
            Interactive Test - Count: {count}
          </h3>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button 
              onClick={() => setCount(count + 1)}
              style={{
                backgroundColor: '#0ea5e9',
                color: 'white',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.75rem',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Increment (+)
            </button>
            <button 
              onClick={() => setCount(0)}
              style={{
                backgroundColor: 'transparent',
                color: '#0ea5e9',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.75rem',
                border: '2px solid #0ea5e9',
                cursor: 'pointer'
              }}
            >
              Reset
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{ 
          textAlign: 'center', 
          marginTop: '3rem',
          color: '#9ca3af',
          fontSize: '0.875rem'
        }}>
          <p>✅ CEPMS Project Verified - React + Vite + Aesthetic Theme</p>
          <p>If you're seeing a login page, it's from a different project on the same port</p>
        </div>
      </div>
    </div>
  )
}

export default App
