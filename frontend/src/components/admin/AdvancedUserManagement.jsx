import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import '../../styles/dashboard.css';

const AdvancedUserManagement = ({ onClose }) => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Advanced filtering states
  const [activeView, setActiveView] = useState('overview');
  const [filters, setFilters] = useState({
    role: 'all',
    department: 'all',
    program: 'all',
    year: 'all',
    section: 'all',
    status: 'all',
    registeredEvent: 'all'
  });
  
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [events, setEvents] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(15);

  // Mock data - replace with actual API calls
  const mockUsers = [
    {
      _id: '1',
      name: 'John Doe',
      email: 'john.doe@college.edu',
      role: 'student',
      status: 'active',
      department: 'CSE',
      program: 'B.Tech',
      year: 1,
      section: 'A',
      rollNo: 'CSE21001',
      phone: '+91 9876543210',
      registeredEvents: ['evt1', 'evt2'],
      attendanceRate: 85,
      cgpa: 8.5,
      createdAt: new Date('2024-01-15'),
      lastLogin: new Date('2025-11-05')
    },
    {
      _id: '2',
      name: 'Jane Smith',
      email: 'jane.smith@college.edu',
      role: 'student',
      status: 'active',
      department: 'CSE',
      program: 'B.Tech',
      year: 2,
      section: 'B',
      rollNo: 'CSE23045',
      phone: '+91 9876543211',
      registeredEvents: ['evt1'],
      attendanceRate: 92,
      cgpa: 9.1,
      createdAt: new Date('2023-01-15'),
      lastLogin: new Date('2025-11-06')
    },
    {
      _id: '3',
      name: 'Dr. Mike Wilson',
      email: 'mike.wilson@college.edu',
      role: 'faculty',
      status: 'active',
      department: 'CSE',
      specialization: 'Machine Learning',
      experience: 8,
      eventsAssigned: ['evt1', 'evt3'],
      phone: '+91 9876543212',
      createdAt: new Date('2020-03-10'),
      lastLogin: new Date('2025-11-06')
    },
    {
      _id: '4',
      name: 'Prof. Sarah Johnson',
      email: 'sarah.johnson@college.edu',
      role: 'trainer',
      status: 'active',
      organization: 'TechCorp Solutions',
      specialization: 'Cloud Computing',
      eventsAssigned: ['evt2'],
      phone: '+91 9876543213',
      createdAt: new Date('2023-06-01'),
      lastLogin: new Date('2025-11-04')
    }
  ];

  const mockEvents = [
    { _id: 'evt1', title: 'AI Workshop', registrations: ['1', '2'] },
    { _id: 'evt2', title: 'Cloud Computing Seminar', registrations: ['1'] },
    { _id: 'evt3', title: 'Web Development Bootcamp', registrations: [] }
  ];

  useEffect(() => {
    fetchUsers();
    fetchEvents();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Replace with actual API call
      setTimeout(() => {
        setUsers(mockUsers);
        setLoading(false);
      }, 1000);
    } catch (err) {
      setError('Failed to fetch users');
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      // Replace with actual API call
      setEvents(mockEvents);
    } catch (err) {
      console.error('Failed to fetch events');
    }
  };

  // Smart filtering logic
  const getFilteredUsers = () => {
    return users.filter(user => {
      // Role filter
      if (filters.role !== 'all' && user.role !== filters.role) return false;
      
      // Department filter
      if (filters.department !== 'all' && user.department !== filters.department) return false;
      
      // Program filter (for students)
      if (filters.program !== 'all' && user.program !== filters.program) return false;
      
      // Year filter (for students)
      if (filters.year !== 'all' && user.year !== parseInt(filters.year)) return false;
      
      // Section filter (for students)
      if (filters.section !== 'all' && user.section !== filters.section) return false;
      
      // Status filter
      if (filters.status !== 'all' && user.status !== filters.status) return false;
      
      // Event registration filter
      if (filters.registeredEvent !== 'all') {
        if (!user.registeredEvents?.includes(filters.registeredEvent)) return false;
      }
      
      return true;
    });
  };

  const filteredUsers = getFilteredUsers();

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  // Quick filter presets
  const quickFilters = [
    {
      label: 'All Students',
      icon: '🎓',
      filters: { role: 'student', department: 'all', year: 'all', section: 'all' }
    },
    {
      label: '1st Year Students',
      icon: '🌟',
      filters: { role: 'student', year: '1' }
    },
    {
      label: 'CSE Faculty',
      icon: '👨‍🏫',
      filters: { role: 'faculty', department: 'CSE' }
    },
    {
      label: 'Active Trainers',
      icon: '👨‍💼',
      filters: { role: 'trainer', status: 'active' }
    },
    {
      label: 'AI Workshop Participants',
      icon: '🤖',
      filters: { registeredEvent: 'evt1' }
    }
  ];

  const applyQuickFilter = (quickFilter) => {
    setFilters(prev => ({
      ...prev,
      ...quickFilter.filters
    }));
    setCurrentPage(1);
  };

  const handleBulkAction = (action) => {
    if (selectedUsers.length === 0) {
      alert('Please select users first');
      return;
    }

    switch (action) {
      case 'export':
        exportUsers(selectedUsers);
        break;
      case 'activate':
        updateUsersStatus(selectedUsers, 'active');
        break;
      case 'deactivate':
        updateUsersStatus(selectedUsers, 'inactive');
        break;
      case 'delete':
        if (window.confirm(`Delete ${selectedUsers.length} users?`)) {
          deleteUsers(selectedUsers);
        }
        break;
    }
  };

  const exportUsers = (userIds) => {
    const exportData = users.filter(u => userIds.includes(u._id));
    const csvContent = convertToCSV(exportData);
    downloadCSV(csvContent, 'users_export.csv');
  };

  const convertToCSV = (data) => {
    const headers = ['Name', 'Email', 'Role', 'Department', 'Program', 'Year', 'Section', 'Status', 'Phone'];
    const rows = data.map(user => [
      user.name,
      user.email,
      user.role,
      user.department || '',
      user.program || '',
      user.year || '',
      user.section || '',
      user.status,
      user.phone || ''
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const downloadCSV = (content, filename) => {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const updateUsersStatus = async (userIds, status) => {
    try {
      // Replace with actual API call
      setUsers(prev => prev.map(user => 
        userIds.includes(user._id) ? { ...user, status } : user
      ));
      setSelectedUsers([]);
    } catch (err) {
      setError('Failed to update user status');
    }
  };

  const deleteUsers = async (userIds) => {
    try {
      // Replace with actual API call
      setUsers(prev => prev.filter(user => !userIds.includes(user._id)));
      setSelectedUsers([]);
    } catch (err) {
      setError('Failed to delete users');
    }
  };

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    setSelectedUsers(currentUsers.map(u => u._id));
  };

  const clearSelection = () => {
    setSelectedUsers([]);
  };

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
    <div className="advanced-user-management">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="page-title">Advanced User Management</h2>
            <p className="page-subtitle">Smart user classification, filtering, and bulk operations</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button 
              onClick={() => setShowExportOptions(!showExportOptions)} 
              className="btn-secondary"
            >
              📊 Export Data
            </button>
            <button onClick={onClose} className="btn-secondary">
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Quick Filter Presets */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-body">
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: '600' }}>Quick Filters</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {quickFilters.map((filter, index) => (
              <button
                key={index}
                onClick={() => applyQuickFilter(filter)}
                className="quick-filter-btn"
                style={{
                  padding: '0.75rem 1rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  background: '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.875rem'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#f8fafc';
                  e.target.style.borderColor = '#3b82f6';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#ffffff';
                  e.target.style.borderColor = '#e2e8f0';
                }}
              >
                <span>{filter.icon}</span>
                <span>{filter.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-body">
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: '600' }}>Advanced Filters</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="form-field">
              <label className="form-label">Role</label>
              <select
                className="form-select"
                value={filters.role}
                onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
              >
                <option value="all">All Roles</option>
                <option value="student">Students</option>
                <option value="faculty">Faculty</option>
                <option value="trainer">Trainers</option>
                <option value="admin">Admins</option>
              </select>
            </div>

            <div className="form-field">
              <label className="form-label">Department</label>
              <select
                className="form-select"
                value={filters.department}
                onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
              >
                <option value="all">All Departments</option>
                <option value="CSE">Computer Science</option>
                <option value="ECE">Electronics & Comm</option>
                <option value="EEE">Electrical</option>
                <option value="MECH">Mechanical</option>
                <option value="CIVIL">Civil</option>
              </select>
            </div>

            {filters.role === 'student' && (
              <>
                <div className="form-field">
                  <label className="form-label">Program</label>
                  <select
                    className="form-select"
                    value={filters.program}
                    onChange={(e) => setFilters(prev => ({ ...prev, program: e.target.value }))}
                  >
                    <option value="all">All Programs</option>
                    <option value="B.Tech">B.Tech</option>
                    <option value="M.Tech">M.Tech</option>
                    <option value="MBA">MBA</option>
                    <option value="MCA">MCA</option>
                  </select>
                </div>

                <div className="form-field">
                  <label className="form-label">Year</label>
                  <select
                    className="form-select"
                    value={filters.year}
                    onChange={(e) => setFilters(prev => ({ ...prev, year: e.target.value }))}
                  >
                    <option value="all">All Years</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>

                <div className="form-field">
                  <label className="form-label">Section</label>
                  <select
                    className="form-select"
                    value={filters.section}
                    onChange={(e) => setFilters(prev => ({ ...prev, section: e.target.value }))}
                  >
                    <option value="all">All Sections</option>
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                  </select>
                </div>
              </>
            )}

            <div className="form-field">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="form-field">
              <label className="form-label">Event Registration</label>
              <select
                className="form-select"
                value={filters.registeredEvent}
                onChange={(e) => setFilters(prev => ({ ...prev, registeredEvent: e.target.value }))}
              >
                <option value="all">All Events</option>
                {events.map(event => (
                  <option key={event._id} value={event._id}>{event.title}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem', background: '#f0f9ff', border: '1px solid #0ea5e9' }}>
          <div className="card-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>{selectedUsers.length} users selected</strong>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={() => handleBulkAction('export')} className="btn-sm btn-secondary">
                  📊 Export Selected
                </button>
                <button onClick={() => handleBulkAction('activate')} className="btn-sm btn-success">
                  ✅ Activate
                </button>
                <button onClick={() => handleBulkAction('deactivate')} className="btn-sm btn-warning">
                  ⏸️ Deactivate
                </button>
                <button onClick={() => handleBulkAction('delete')} className="btn-sm btn-danger">
                  🗑️ Delete
                </button>
                <button onClick={clearSelection} className="btn-sm btn-secondary">
                  ❌ Clear Selection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>Showing {currentUsers.length} of {filteredUsers.length} users</strong>
              {filteredUsers.length !== users.length && (
                <span style={{ color: '#64748b', marginLeft: '0.5rem' }}>
                  (filtered from {users.length} total)
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button onClick={selectAllUsers} className="btn-sm btn-secondary">
                ✅ Select All
              </button>
              <button onClick={() => exportUsers(filteredUsers.map(u => u._id))} className="btn-sm btn-secondary">
                📊 Export All Results
              </button>
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
                      <th style={{ width: '40px' }}>
                        <input
                          type="checkbox"
                          checked={selectedUsers.length === currentUsers.length && currentUsers.length > 0}
                          onChange={selectedUsers.length === currentUsers.length ? clearSelection : selectAllUsers}
                        />
                      </th>
                      <th>User Details</th>
                      <th>Role & Department</th>
                      <th>Academic Info</th>
                      <th>Status & Activity</th>
                      <th>Performance</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentUsers.map(user => (
                      <tr key={user._id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user._id)}
                            onChange={() => toggleUserSelection(user._id)}
                          />
                        </td>
                        <td>
                          <div>
                            <div style={{ fontWeight: '600', color: '#1e293b' }}>{user.name}</div>
                            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>{user.email}</div>
                            {user.rollNo && (
                              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Roll: {user.rollNo}</div>
                            )}
                            {user.phone && (
                              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{user.phone}</div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div>
                            <span className={`badge ${getRoleBadgeClass(user.role)}`}>
                              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                            </span>
                            {user.department && (
                              <div style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
                                {user.department}
                              </div>
                            )}
                            {user.specialization && (
                              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                {user.specialization}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          {user.role === 'student' && (
                            <div style={{ fontSize: '0.875rem' }}>
                              <div>{user.program}</div>
                              <div style={{ color: '#64748b' }}>Year {user.year}, Sec {user.section}</div>
                              {user.cgpa && (
                                <div style={{ color: '#16a34a', fontWeight: '500' }}>CGPA: {user.cgpa}</div>
                              )}
                            </div>
                          )}
                          {user.role === 'faculty' && user.experience && (
                            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                              {user.experience} years exp.
                            </div>
                          )}
                          {user.role === 'trainer' && user.organization && (
                            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                              {user.organization}
                            </div>
                          )}
                        </td>
                        <td>
                          <div>
                            <span className={`badge ${getStatusBadgeClass(user.status)}`}>
                              {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                            </span>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
                              Last login: {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                            </div>
                            {user.registeredEvents && (
                              <div style={{ fontSize: '0.8rem', color: '#3b82f6' }}>
                                {user.registeredEvents.length} events registered
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          {user.attendanceRate && (
                            <div style={{ fontSize: '0.875rem' }}>
                              <div style={{ 
                                color: user.attendanceRate >= 80 ? '#16a34a' : user.attendanceRate >= 60 ? '#f59e0b' : '#dc2626',
                                fontWeight: '500'
                              }}>
                                {user.attendanceRate}% attendance
                              </div>
                            </div>
                          )}
                          {user.eventsAssigned && (
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                              {user.eventsAssigned.length} events assigned
                            </div>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <button className="btn-sm btn-secondary" title="View Details">
                              👁️
                            </button>
                            <button className="btn-sm btn-secondary" title="Edit User">
                              ✏️
                            </button>
                            {user.role === 'student' && (
                              <button className="btn-sm btn-secondary" title="View Academic Records">
                                📚
                              </button>
                            )}
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
    </div>
  );
};

export default AdvancedUserManagement;