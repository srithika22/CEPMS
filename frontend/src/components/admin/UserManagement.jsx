import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import '../../styles/dashboard.css';

const UserManagement = ({ onClose }) => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);

  // Mock users data - replace with API call
  const mockUsers = [
    {
      _id: '1',
      name: 'John Doe',
      email: 'john.doe@college.edu',
      role: 'student',
      status: 'active',
      department: 'CSE',
      program: 'B.Tech',
      year: 3,
      section: 'A',
      phone: '+91 9876543210',
      createdAt: new Date('2024-01-15'),
      lastLogin: new Date('2025-11-05')
    },
    {
      _id: '2',
      name: 'Dr. Jane Smith',
      email: 'jane.smith@college.edu',
      role: 'faculty',
      status: 'active',
      department: 'CSE',
      specialization: 'Machine Learning',
      phone: '+91 9876543211',
      createdAt: new Date('2023-08-20'),
      lastLogin: new Date('2025-11-06')
    },
    {
      _id: '3',
      name: 'Prof. Mike Wilson',
      email: 'mike.wilson@college.edu',
      role: 'trainer',
      status: 'active',
      organization: 'TechCorp Solutions',
      specialization: 'Cloud Computing',
      phone: '+91 9876543212',
      createdAt: new Date('2024-03-10'),
      lastLogin: new Date('2025-11-04')
    },
    {
      _id: '4',
      name: 'Admin User',
      email: 'admin@college.edu',
      role: 'admin',
      status: 'active',
      phone: '+91 9876543213',
      createdAt: new Date('2023-01-01'),
      lastLogin: new Date('2025-11-06')
    },
    {
      _id: '5',
      name: 'Alice Johnson',
      email: 'alice.johnson@college.edu',
      role: 'student',
      status: 'inactive',
      department: 'ECE',
      program: 'B.Tech',
      year: 2,
      section: 'B',
      phone: '+91 9876543214',
      createdAt: new Date('2024-07-12'),
      lastLogin: new Date('2025-10-15')
    }
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Replace with actual API call
      // const response = await fetch('/api/admin/users');
      // const data = await response.json();
      // setUsers(data.users);
      
      // Mock delay
      setTimeout(() => {
        setUsers(mockUsers);
        setLoading(false);
      }, 1000);
    } catch (err) {
      setError('Failed to fetch users');
      setLoading(false);
    }
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setShowUserForm(true);
  };

  const handleEditUser = (userToEdit) => {
    setEditingUser(userToEdit);
    setShowUserForm(true);
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      setLoading(true);
      // Replace with actual API call
      // await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
      
      setUsers(users.filter(u => u._id !== userId));
      setLoading(false);
    } catch (err) {
      setError('Failed to delete user');
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      // Replace with actual API call
      // await fetch(`/api/admin/users/${userId}/status`, {
      //   method: 'PUT',
      //   body: JSON.stringify({ status: newStatus })
      // });
      
      setUsers(users.map(u => 
        u._id === userId ? { ...u, status: newStatus } : u
      ));
    } catch (err) {
      setError('Failed to update user status');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRoleBadgeClass = (role) => {
    const classes = {
      admin: 'badge-red',
      faculty: 'badge-blue',
      student: 'badge-green',
      trainer: 'badge-orange'
    };
    return classes[role] || 'badge-gray';
  };

  const getStatusBadgeClass = (status) => {
    return status === 'active' ? 'badge-green' : 'badge-gray';
  };

  return (
    <div className="user-management">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="page-title">User Management</h2>
            <p className="page-subtitle">Manage all system users, roles, and permissions</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button onClick={handleCreateUser} className="btn-primary">
              ➕ Add New User
            </button>
            <button onClick={onClose} className="btn-secondary">
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            <div className="form-field">
              <label className="form-label">Search Users</label>
              <input
                type="text"
                className="form-input"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="form-field">
              <label className="form-label">Filter by Role</label>
              <select
                className="form-select"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="faculty">Faculty</option>
                <option value="student">Student</option>
                <option value="trainer">Trainer</option>
              </select>
            </div>
            
            <div className="form-field">
              <label className="form-label">Filter by Status</label>
              <select
                className="form-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="card-body">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner">
                <div className="spinner"></div>
                <p className="loading-text">Loading users...</p>
              </div>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#dc2626' }}>
              <p>{error}</p>
              <button onClick={fetchUsers} className="btn-primary" style={{ marginTop: '1rem' }}>
                Retry
              </button>
            </div>
          ) : (
            <>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>User Details</th>
                      <th>Role</th>
                      <th>Department/Info</th>
                      <th>Status</th>
                      <th>Last Login</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentUsers.map(user => (
                      <tr key={user._id}>
                        <td>
                          <div>
                            <div style={{ fontWeight: '600', color: '#1e293b' }}>{user.name}</div>
                            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>{user.email}</div>
                            {user.phone && (
                              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{user.phone}</div>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${getRoleBadgeClass(user.role)}`}>
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.875rem' }}>
                            {user.role === 'student' && (
                              <>
                                <div>{user.department} - {user.program}</div>
                                <div style={{ color: '#64748b' }}>Year {user.year}, Section {user.section}</div>
                              </>
                            )}
                            {user.role === 'faculty' && (
                              <>
                                <div>{user.department}</div>
                                {user.specialization && (
                                  <div style={{ color: '#64748b' }}>{user.specialization}</div>
                                )}
                              </>
                            )}
                            {user.role === 'trainer' && (
                              <>
                                {user.organization && <div>{user.organization}</div>}
                                {user.specialization && (
                                  <div style={{ color: '#64748b' }}>{user.specialization}</div>
                                )}
                              </>
                            )}
                            {user.role === 'admin' && (
                              <div style={{ color: '#64748b' }}>System Administrator</div>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${getStatusBadgeClass(user.status)}`}>
                            {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.875rem', color: '#64748b' }}>
                          {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => handleEditUser(user)}
                              className="btn-sm btn-secondary"
                              title="Edit User"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleToggleStatus(user._id, user.status)}
                              className={`btn-sm ${user.status === 'active' ? 'btn-warning' : 'btn-success'}`}
                              title={user.status === 'active' ? 'Deactivate' : 'Activate'}
                            >
                              {user.status === 'active' ? '⏸️' : '▶️'}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user._id)}
                              className="btn-sm btn-danger"
                              title="Delete User"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  marginTop: '1.5rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid #e2e8f0'
                }}>
                  <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                    Showing {indexOfFirstUser + 1} to {Math.min(indexOfLastUser, filteredUsers.length)} of {filteredUsers.length} users
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="btn-sm btn-secondary"
                    >
                      ← Previous
                    </button>
                    <span style={{ 
                      padding: '0.375rem 0.75rem', 
                      background: '#f1f5f9', 
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      color: '#475569'
                    }}>
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="btn-sm btn-secondary"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* User Form Modal */}
      {showUserForm && (
        <UserForm
          user={editingUser}
          onClose={() => {
            setShowUserForm(false);
            setEditingUser(null);
          }}
          onSuccess={() => {
            setShowUserForm(false);
            setEditingUser(null);
            fetchUsers();
          }}
        />
      )}
    </div>
  );
};

// User Form Component
const UserForm = ({ user, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || 'student',
    status: user?.status || 'active',
    department: user?.department || '',
    program: user?.program || '',
    year: user?.year || 1,
    section: user?.section || '',
    phone: user?.phone || '',
    specialization: user?.specialization || '',
    organization: user?.organization || ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      // Validation
      const newErrors = {};
      if (!formData.name.trim()) newErrors.name = 'Name is required';
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      if (!formData.role) newErrors.role = 'Role is required';

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        setLoading(false);
        return;
      }

      // Replace with actual API call
      if (user) {
        // await fetch(`/api/admin/users/${user._id}`, {
        //   method: 'PUT',
        //   body: JSON.stringify(formData)
        // });
      } else {
        // await fetch('/api/admin/users', {
        //   method: 'POST',
        //   body: JSON.stringify(formData)
        // });
      }

      onSuccess();
    } catch (err) {
      setErrors({ submit: 'Failed to save user' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  return (
    <div className="form-modal">
      <div className="form-container">
        <div className="form-header">
          <h3 className="form-title">
            {user ? 'Edit User' : 'Create New User'}
          </h3>
          <button onClick={onClose} className="form-close">×</button>
        </div>

        <form id="userForm" onSubmit={handleSubmit} className="form-body">
          <div className="form-section">
            <h4>Basic Information</h4>
            
            <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
              <div className="form-field">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`form-input ${errors.name ? 'error' : ''}`}
                  placeholder="Enter full name"
                />
                {errors.name && <span className="error-text">{errors.name}</span>}
              </div>

              <div className="form-field">
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`form-input ${errors.email ? 'error' : ''}`}
                  placeholder="Enter email address"
                />
                {errors.email && <span className="error-text">{errors.email}</span>}
              </div>

              <div className="form-field">
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter phone number"
                />
              </div>

              <div className="form-field">
                <label className="form-label">Role *</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className={`form-select ${errors.role ? 'error' : ''}`}
                >
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                  <option value="trainer">Trainer</option>
                  <option value="admin">Admin</option>
                </select>
                {errors.role && <span className="error-text">{errors.role}</span>}
              </div>

              <div className="form-field">
                <label className="form-label">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Role-specific fields */}
          {(formData.role === 'student' || formData.role === 'faculty') && (
            <div className="form-section">
              <h4>Academic Information</h4>
              
              <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <div className="form-field">
                  <label className="form-label">Department</label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="form-select"
                  >
                    <option value="">Select Department</option>
                    <option value="CSE">Computer Science & Engineering</option>
                    <option value="ECE">Electronics & Communication</option>
                    <option value="EEE">Electrical & Electronics</option>
                    <option value="MECH">Mechanical Engineering</option>
                    <option value="CIVIL">Civil Engineering</option>
                  </select>
                </div>

                {formData.role === 'student' && (
                  <>
                    <div className="form-field">
                      <label className="form-label">Program</label>
                      <select
                        name="program"
                        value={formData.program}
                        onChange={handleChange}
                        className="form-select"
                      >
                        <option value="">Select Program</option>
                        <option value="B.Tech">B.Tech</option>
                        <option value="M.Tech">M.Tech</option>
                        <option value="MBA">MBA</option>
                        <option value="MCA">MCA</option>
                      </select>
                    </div>

                    <div className="form-field">
                      <label className="form-label">Year</label>
                      <select
                        name="year"
                        value={formData.year}
                        onChange={handleChange}
                        className="form-select"
                      >
                        <option value={1}>1st Year</option>
                        <option value={2}>2nd Year</option>
                        <option value={3}>3rd Year</option>
                        <option value={4}>4th Year</option>
                      </select>
                    </div>

                    <div className="form-field">
                      <label className="form-label">Section</label>
                      <select
                        name="section"
                        value={formData.section}
                        onChange={handleChange}
                        className="form-select"
                      >
                        <option value="">Select Section</option>
                        <option value="A">Section A</option>
                        <option value="B">Section B</option>
                        <option value="C">Section C</option>
                      </select>
                    </div>
                  </>
                )}

                {formData.role === 'faculty' && (
                  <div className="form-field">
                    <label className="form-label">Specialization</label>
                    <input
                      type="text"
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Enter specialization"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {formData.role === 'trainer' && (
            <div className="form-section">
              <h4>Trainer Information</h4>
              
              <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
                <div className="form-field">
                  <label className="form-label">Organization</label>
                  <input
                    type="text"
                    name="organization"
                    value={formData.organization}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Enter organization name"
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">Specialization</label>
                  <input
                    type="text"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Enter specialization"
                  />
                </div>
              </div>
            </div>
          )}

          {errors.submit && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '1rem' }}>
              <p style={{ color: '#dc2626', fontSize: '0.875rem', margin: 0 }}>{errors.submit}</p>
            </div>
          )}
        </form>

        <div className="form-footer">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" form="userForm" disabled={loading} className="btn-primary">
            {loading ? 'Saving...' : (user ? 'Update User' : 'Create User')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;