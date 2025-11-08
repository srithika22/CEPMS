import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import LandingPage from './pages/LandingPage';
import AdminDashboard from './components/dashboard/AdminDashboard';
import EnhancedAdminDashboard from './components/dashboard/EnhancedAdminDashboard';
import FacultyDashboard from './components/dashboard/FacultyDashboard';
import EnhancedFacultyDashboard from './components/dashboard/EnhancedFacultyDashboard';
import EnhancedStudentDashboard from './components/dashboard/EnhancedStudentDashboard';
import TrainerDashboard from './components/dashboard/TrainerDashboard';
import EnhancedTrainerDashboard from './components/dashboard/EnhancedTrainerDashboard';
import Header from './components/layout/Header';
import NotificationCenter from './components/common/NotificationCenter';

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

// Dashboard Router Component
const DashboardRouter = () => {
  const { user } = useAuth();

  switch (user?.role) {
    case 'admin':
      return <EnhancedAdminDashboard />;
    case 'faculty':
      return <EnhancedFacultyDashboard />;
    case 'student':
      return <EnhancedStudentDashboard />;
    case 'trainer':
      return <EnhancedTrainerDashboard />;
    default:
      return <Navigate to="/" replace />;
  }
};

// Unauthorized Page Component
const UnauthorizedPage = () => (
  <div className="container main-content">
    <div className="auth-header">
      <h2>Access Denied</h2>
      <p>You don't have permission to access this page.</p>
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <div className="app">
            <Header />
            <NotificationCenter />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <DashboardRouter />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/admin" 
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <EnhancedAdminDashboard />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/faculty" 
                  element={
                    <ProtectedRoute requiredRole="faculty">
                      <EnhancedFacultyDashboard />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/student" 
                  element={
                    <ProtectedRoute requiredRole="student">
                      <EnhancedStudentDashboard />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/trainer" 
                  element={
                    <ProtectedRoute requiredRole="trainer">
                      <EnhancedTrainerDashboard />
                    </ProtectedRoute>
                  } 
                />
                
                <Route path="/unauthorized" element={<UnauthorizedPage />} />
                
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;