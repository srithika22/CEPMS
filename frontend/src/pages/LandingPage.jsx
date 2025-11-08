import React, { useState } from 'react';
import AuthModal from '../components/auth/AuthModal';

const LandingPage = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  const handleGetStarted = () => {
    setAuthMode('register');
    setShowAuthModal(true);
  };

  const handleSignIn = () => {
    setAuthMode('login');
    setShowAuthModal(true);
  };

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Comprehensive Event & Program Management
          </h1>
          <p className="hero-description">
            Streamline your college events with our modern, intuitive platform. 
            Manage registrations, track attendance, and engage with your community 
            seamlessly across all departments and roles.
          </p>
          <div className="hero-actions">
            <button className="btn-primary btn-large" onClick={handleGetStarted}>
              Get Started Today
            </button>
            <button className="btn-secondary btn-large" onClick={handleSignIn}>
              Sign In
            </button>
          </div>
        </div>
        
        <div className="hero-graphic">
          <div className="graphic-card">
            <h3>🎓 For Students</h3>
            <p>Discover events, register instantly, and track your participation</p>
          </div>
          <div className="graphic-card">
            <h3>👨‍🏫 For Faculty</h3>
            <p>Create events, manage attendance, and gather valuable feedback</p>
          </div>
          <div className="graphic-card">
            <h3>👨‍💼 For Admins</h3>
            <p>Comprehensive oversight with analytics and reporting tools</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <h2>Everything you need to manage events effectively</h2>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📅</div>
              <h3>Event Management</h3>
              <p>Create, schedule, and manage events with intuitive tools. Set capacity limits, track registrations, and manage attendance seamlessly.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <h3>Role-Based Access</h3>
              <p>Tailored experiences for Students, Faculty, Trainers, and Administrators. Each role has specific permissions and features.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Analytics & Reports</h3>
              <p>Comprehensive reporting tools to track engagement, attendance patterns, and event success metrics across departments.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🔔</div>
              <h3>Smart Notifications</h3>
              <p>Automated reminders, updates, and announcements keep everyone informed about upcoming events and important changes.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Registration Management</h3>
              <p>Streamlined registration process with capacity management, waitlists, and automated confirmation systems.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">💬</div>
              <h3>Feedback Collection</h3>
              <p>Gather valuable feedback from participants to continuously improve event quality and participant satisfaction.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="cta-section">
        <div className="container">
          <h2>Ready to transform your event management?</h2>
          <p>Join hundreds of educational institutions already using CEPMS to create better event experiences.</p>
          <button className="btn-primary btn-large" onClick={handleGetStarted}>
            Start Your Journey
          </button>
        </div>
      </section>

      {/* Authentication Modal */}
      {showAuthModal && (
        <AuthModal 
          mode={authMode} 
          onClose={() => setShowAuthModal(false)} 
        />
      )}
    </div>
  );
};

export default LandingPage;