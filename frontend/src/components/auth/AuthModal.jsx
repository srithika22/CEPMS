import React, { useState, useEffect } from 'react';
import LoginForm from './LoginForm';
import NewRegisterForm from './NewRegisterForm';

const AuthModal = ({ isOpen, mode = 'login', onClose }) => {
  const [isLogin, setIsLogin] = useState(true);

  useEffect(() => {
    setIsLogin(mode === 'login');
  }, [mode]);

  if (!isOpen) return null;

  const handleSuccess = () => {
    onClose();
  };

  const toggleForm = () => {
    setIsLogin(!isLogin);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          ×
        </button>
        
        {isLogin ? (
          <LoginForm 
            onSuccess={handleSuccess}
            onToggleForm={toggleForm}
          />
        ) : (
          <NewRegisterForm 
            onSuccess={handleSuccess}
            onToggleForm={toggleForm}
          />
        )}
      </div>
    </div>
  );
};

export default AuthModal;