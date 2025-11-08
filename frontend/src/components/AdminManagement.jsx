import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

const AdminManagement = () => {
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    employeeId: '',
    department: '',
    phone: ''
  });

  const departments = [
    'Administration',
    'Computer Science',
    'Information Technology', 
    'Electronics',
    'Mechanical',
    'Civil',
    'Electrical',
    'Chemical',
    'Management'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return false;
    }
    if (!formData.email.trim()) {
      toast.error('Email is required');
      return false;
    }
    if (!formData.email.includes('@')) {
      toast.error('Valid email is required');
      return false;
    }
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }
    if (!formData.employeeId.trim()) {
      toast.error('Employee ID is required');
      return false;
    }
    if (!formData.department) {
      toast.error('Department is required');
      return false;
    }
    if (!formData.phone.trim()) {
      toast.error('Phone number is required');
      return false;
    }
    return true;
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/auth/create-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          employeeId: formData.employeeId,
          department: formData.department,
          phone: formData.phone
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Admin account created successfully!');
        setFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
          employeeId: '',
          department: '',
          phone: ''
        });
        setShowCreateAdmin(false);
      } else {
        toast.error(data.message || 'Failed to create admin account');
      }
    } catch (error) {
      console.error('Admin creation error:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-management-section">
      <div className="section-header">
        <h3>Admin Management</h3>
        <p className="security-notice">
          🔒 <strong>Security Notice:</strong> Admin accounts can only be created by existing administrators.
          Regular user registration does not allow admin role selection for security purposes.
        </p>
      </div>

      <div className="admin-actions">
        <button 
          className="btn-primary"
          onClick={() => setShowCreateAdmin(true)}
          disabled={loading}
        >
          Create New Admin Account
        </button>
      </div>

      {showCreateAdmin && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button 
              className="modal-close"
              onClick={() => setShowCreateAdmin(false)}
              disabled={loading}
            >
              ×
            </button>
            
            <div className="auth-header">
              <h2>Create Admin Account</h2>
              <p>Create a new administrator account with full system access</p>
            </div>
            
            <form onSubmit={handleCreateAdmin} className="form">
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                  placeholder="Enter admin's full name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                  placeholder="admin@college.edu"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                    placeholder="Minimum 6 characters"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                    placeholder="Re-enter password"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="employeeId">Employee ID</label>
                  <input
                    type="text"
                    id="employeeId"
                    name="employeeId"
                    value={formData.employeeId}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                    placeholder="ADM001"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="department">Department</label>
                  <select
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                  placeholder="+1234567890"
                />
              </div>

              <div className="security-warning">
                <div className="warning-icon">⚠️</div>
                <div className="warning-content">
                  <strong>Important Security Notice:</strong>
                  <ul>
                    <li>Admin accounts have full system access and control</li>
                    <li>Only create admin accounts for trusted personnel</li>
                    <li>Ensure strong passwords are used</li>
                    <li>Admin accounts should be regularly audited</li>
                  </ul>
                </div>
              </div>

              <div className="form-actions">
                <button 
                  type="submit" 
                  className="btn-primary btn-large"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Admin Account'}
                </button>
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => setShowCreateAdmin(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagement;