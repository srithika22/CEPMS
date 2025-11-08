import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import AuthModal from '../auth/AuthModal';
import ConnectionStatus from '../common/ConnectionStatus';

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  const handleLogin = () => {
    setAuthMode('login');
    setShowAuthModal(true);
  };

  const handleRegister = () => {
    setAuthMode('register');
    setShowAuthModal(true);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      <header className="header">
        <div className="container">
          <div className="header-content">
            <div className="logo">
              <h1>CEPMS</h1>
              <span>Event Management System</span>
            </div>
            
            <nav className="nav">
              {isAuthenticated && <ConnectionStatus />}
              {isAuthenticated ? (
                <div className="user-menu">
                  <div className="user-info">
                    <span className="user-name">{user?.name}</span>
                    <span className="user-role">{user?.role}</span>
                  </div>
                  <button className="btn-secondary" onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              ) : (
                <div className="auth-buttons">
                  <button className="btn-secondary" onClick={handleLogin}>
                    Sign In
                  </button>
                  <button className="btn-primary" onClick={handleRegister}>
                    Get Started
                  </button>
                </div>
              )}
            </nav>
          </div>
        </div>
      </header>

      {showAuthModal && (
        <AuthModal 
          isOpen={showAuthModal}
          mode={authMode} 
          onClose={() => setShowAuthModal(false)} 
        />
      )}
    </>
  );
};

export default Header;