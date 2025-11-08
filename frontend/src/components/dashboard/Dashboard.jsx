import React from 'react';
import { useAuth } from '../../context/AuthContext';
import EnhancedAdminDashboard from './EnhancedAdminDashboard';
import EnhancedFacultyDashboard from './EnhancedFacultyDashboard';
import EnhancedStudentDashboard from './EnhancedStudentDashboard';
import EnhancedTrainerDashboard from './EnhancedTrainerDashboard';

const Dashboard = () => {
  const { user } = useAuth();

  const getDashboardComponent = () => {
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
        return <div>Invalid user role</div>;
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome back, {user?.name}!</h1>
        <p className="dashboard-subtitle">
          {user?.role === 'admin' && 'Manage the entire system and oversee all activities'}
          {user?.role === 'faculty' && 'Create and manage academic events and programs'}
          {user?.role === 'student' && 'Discover and participate in exciting events'}
          {user?.role === 'trainer' && 'Organize training sessions and skill development programs'}
        </p>
      </div>
      
      {getDashboardComponent()}
    </div>
  );
};

export default Dashboard;