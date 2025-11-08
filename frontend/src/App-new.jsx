import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import AuthModal from './components/auth/AuthModal';
import Dashboard from './components/dashboard/Dashboard';
import Header from './components/layout/Header';
import LoadingSpinner from './components/common/LoadingSpinner';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return isAuthenticated ? children : <Navigate to="/" replace />;
};

// Main App Content
const AppContent = () => {
  const { isAuthenticated, loading } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="app">
      <Header onOpenAuth={() => setAuthModalOpen(true)} />
      
      <main className="main-content">
        <Routes>
          <Route 
            path="/" 
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <LandingPage onOpenAuth={() => setAuthModalOpen(true)} />
              )
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </main>

      <AuthModal 
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </div>
  );
};

// Landing Page Component
const LandingPage = ({ onOpenAuth }) => {
  return (
    <div className="landing-page">
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Comprehensive College Event & Program Management System
          </h1>
          <p className="hero-description">
            Streamline your university events, manage programs efficiently, and enhance student engagement with our comprehensive platform.
          </p>
          <div className="hero-actions">
            <button 
              className="btn-primary btn-large"
              onClick={onOpenAuth}
            >
              Get Started
            </button>
            <button className="btn-secondary btn-large">
              Learn More
            </button>
          </div>
        </div>
        
        <div className="hero-image">
          <div className="hero-graphic">
            <div className="graphic-card">
              <h3>📚 Academic Events</h3>
              <p>Seminars, workshops, conferences</p>
            </div>
            <div className="graphic-card">
              <h3>🎭 Cultural Programs</h3>
              <p>Festivals, competitions, performances</p>
            </div>
            <div className="graphic-card">
              <h3>🏆 Sports Events</h3>
              <p>Tournaments, matches, fitness programs</p>
            </div>
          </div>
        </div>
      </div>

      <div className="features-section">
        <div className="container">
          <h2>Why Choose CEPMS?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <h3>Role-Based Access</h3>
              <p>Customized dashboards for Students, Faculty, Trainers, and Administrators with appropriate permissions.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📅</div>
              <h3>Event Management</h3>
              <p>Create, schedule, and manage all types of university events with comprehensive tracking and reporting.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Analytics & Reports</h3>
              <p>Detailed insights into event performance, attendance tracking, and engagement metrics.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔔</div>
              <h3>Real-time Updates</h3>
              <p>Instant notifications for event updates, registrations, and important announcements.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="cta-section">
        <div className="container">
          <h2>Ready to Transform Your Event Management?</h2>
          <p>Join thousands of institutions already using CEPMS to streamline their event operations.</p>
          <button 
            className="btn-primary btn-large"
            onClick={onOpenAuth}
          >
            Start Your Journey
          </button>
        </div>
      </div>
    </div>
  );
};

// Main App Component
const App = () => {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <AppContent />
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
};

export default App;