import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import '../../styles/smartUserManagement.css';

const SmartUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    role: '',
    department: '',
    year: '',
    section: '',
    isActive: '',
    search: '',
    hasEvents: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // table, cards, analytics
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [analytics, setAnalytics] = useState(null);

  // Department and year options
  const departments = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AIDS', 'CSBS'];
  const years = [1, 2, 3, 4];
  const sections = ['A', 'B', 'C', 'D'];
  const roles = ['student', 'faculty', 'trainer', 'admin'];

  // Fetch users with advanced filtering
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Build query parameters
      const params = new URLSearchParams();
      if (filters.role) params.append('role', filters.role);
      if (filters.department) params.append('department', filters.department);
      if (filters.year) params.append('year', filters.year);
      if (filters.section) params.append('section', filters.section);
      if (filters.isActive !== '') params.append('isActive', filters.isActive);
      if (filters.search) params.append('search', filters.search);
      if (filters.hasEvents !== '') params.append('hasEvents', filters.hasEvents);
      params.append('page', pagination.page);
      params.append('limit', pagination.limit);

      let endpoint = '/api/users';
      if (filters.role === 'student' && (filters.department || filters.year || filters.section || filters.hasEvents)) {
        endpoint = '/api/users/students/advanced-filter';
        
        // Format multi-value filters
        if (filters.department) {
          params.delete('department');
          params.append('departments', filters.department);
        }
        if (filters.year) {
          params.delete('year');
          params.append('years', filters.year);
        }
        if (filters.section) {
          params.delete('section');
          params.append('sections', filters.section);
        }
      }

      const response = await axios.get(`${endpoint}?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const data = response.data.data;
        setUsers(data.users || data.students || []);
        setPagination(prev => ({
          ...prev,
          total: data.pagination?.total || 0,
          pages: data.pagination?.pages || 0
        }));
      }
    } catch (error) {
      console.error('Fetch users error:', error);
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  // Fetch analytics data
  const fetchAnalytics = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/dashboard/analytics/overview', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setAnalytics(response.data.data);
      }
    } catch (error) {
      console.error('Fetch analytics error:', error);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (viewMode === 'analytics') {
      fetchAnalytics();
    }
  }, [viewMode, fetchAnalytics]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      role: '',
      department: '',
      year: '',
      section: '',
      isActive: '',
      search: '',
      hasEvents: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle user selection
  const handleUserSelect = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Select all users on current page
  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user._id));
    }
  };

  // Handle bulk actions
  const handleBulkAction = async () => {
    if (!bulkAction || selectedUsers.length === 0) return;

    try {
      const token = localStorage.getItem('token');
      
      const requestData = {
        userIds: selectedUsers,
        action: bulkAction
      };

      await axios.post('/api/users/bulk-update', requestData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSelectedUsers([]);
      setBulkAction('');
      setShowBulkModal(false);
      fetchUsers();
    } catch (error) {
      console.error('Bulk action error:', error);
      setError('Failed to perform bulk action');
    }
  };

  // Export users
  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      params.append('format', 'csv');

      const response = await axios.get(`/api/users/bulk-export?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        // Convert to CSV and download
        const csvData = response.data.data;
        const csv = convertToCSV(csvData);
        downloadCSV(csv, 'users_export.csv');
      }
    } catch (error) {
      console.error('Export error:', error);
      setError('Failed to export users');
    }
  };

  // Utility functions
  const convertToCSV = (data) => {
    if (!data.length) return '';
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => `"${row[header] || ''}"`).join(',')
      )
    ].join('\n');
    
    return csvContent;
  };

  const downloadCSV = (csv, filename) => {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Render user card
  const renderUserCard = (user) => (
    <div key={user._id} className="user-card">
      <div className="user-card-header">
        <input
          type="checkbox"
          checked={selectedUsers.includes(user._id)}
          onChange={() => handleUserSelect(user._id)}
        />
        <div className="user-avatar">
          {user.profilePicture ? (
            <img src={user.profilePicture} alt={user.firstName} />
          ) : (
            <div className="avatar-initials">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </div>
          )}
        </div>
        <div className={`user-status ${user.isActive ? 'active' : 'inactive'}`}>
          {user.isActive ? 'Active' : 'Inactive'}
        </div>
      </div>
      
      <div className="user-card-body">
        <h3>{user.firstName} {user.lastName}</h3>
        <p className="user-email">{user.email}</p>
        <div className="user-details">
          <span className={`role-badge ${user.role}`}>{user.role}</span>
          {user.student && (
            <div className="student-info">
              <span>Roll: {user.student.rollNumber}</span>
              <span>{user.student.department} - {user.student.year}th Year</span>
              <span>Section: {user.student.section}</span>
            </div>
          )}
          {user.faculty && (
            <div className="faculty-info">
              <span>{user.faculty.department}</span>
              <span>{user.faculty.designation}</span>
            </div>
          )}
        </div>
        
        {user.analytics && (
          <div className="user-analytics">
            <div className="metric">
              <label>Events</label>
              <span>{user.analytics.totalEventsRegistered}</span>
            </div>
            <div className="metric">
              <label>Attendance</label>
              <span>{user.analytics.avgAttendanceRate?.toFixed(1)}%</span>
            </div>
            <div className="metric">
              <label>Certificates</label>
              <span>{user.analytics.certificatesEarned}</span>
            </div>
          </div>
        )}
      </div>
      
      <div className="user-card-actions">
        <button className="btn-secondary btn-sm">Edit</button>
        <button className="btn-danger btn-sm">Delete</button>
      </div>
    </div>
  );

  // Render analytics view
  const renderAnalytics = () => (
    <div className="analytics-overview">
      <div className="analytics-grid">
        <div className="analytics-card">
          <h3>User Statistics</h3>
          {analytics?.overview?.users && (
            <div className="stats-grid">
              <div className="stat">
                <label>Total Users</label>
                <span className="stat-value">{analytics.overview.users.total}</span>
              </div>
              <div className="stat">
                <label>Active Users</label>
                <span className="stat-value">{analytics.overview.users.active}</span>
              </div>
              <div className="stat">
                <label>New This Month</label>
                <span className="stat-value">{analytics.overview.users.new}</span>
              </div>
              <div className="stat">
                <label>Growth Rate</label>
                <span className="stat-value">{analytics.overview.users.growth}%</span>
              </div>
            </div>
          )}
        </div>

        <div className="analytics-card">
          <h3>Department Performance</h3>
          {analytics?.departmentStats && (
            <div className="department-stats">
              {analytics.departmentStats.slice(0, 5).map(dept => (
                <div key={dept._id} className="department-stat">
                  <span className="dept-name">{dept._id}</span>
                  <span className="dept-registrations">{dept.registrations} registrations</span>
                  <span className="dept-attendance">{dept.avgAttendance?.toFixed(1)}% avg attendance</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="analytics-card">
          <h3>Top Performing Events</h3>
          {analytics?.topEvents && (
            <div className="top-events">
              {analytics.topEvents.slice(0, 5).map(event => (
                <div key={event._id._id} className="event-stat">
                  <span className="event-title">{event._id.title}</span>
                  <span className="event-participants">{event.participants} participants</span>
                  <span className="event-attendance">{event.avgAttendance?.toFixed(1)}% attendance</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="smart-user-management">
      <div className="page-header">
        <div className="header-left">
          <h1>Smart User Management</h1>
          <p>Manage users with intelligent filtering and analytics</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn-primary"
            onClick={() => setShowCreateForm(true)}
          >
            Add User
          </button>
          <button 
            className="btn-secondary"
            onClick={handleExport}
          >
            Export Users
          </button>
        </div>
      </div>

      {/* View Mode Selector */}
      <div className="view-mode-selector">
        <button 
          className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
          onClick={() => setViewMode('table')}
        >
          Table View
        </button>
        <button 
          className={`view-btn ${viewMode === 'cards' ? 'active' : ''}`}
          onClick={() => setViewMode('cards')}
        >
          Card View
        </button>
        <button 
          className={`view-btn ${viewMode === 'analytics' ? 'active' : ''}`}
          onClick={() => setViewMode('analytics')}
        >
          Analytics
        </button>
      </div>

      {/* Advanced Filters */}
      <div className="advanced-filters">
        <div className="filter-row">
          <div className="filter-group">
            <label>Role</label>
            <select 
              value={filters.role} 
              onChange={(e) => handleFilterChange('role', e.target.value)}
            >
              <option value="">All Roles</option>
              {roles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Department</label>
            <select 
              value={filters.department} 
              onChange={(e) => handleFilterChange('department', e.target.value)}
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Year</label>
            <select 
              value={filters.year} 
              onChange={(e) => handleFilterChange('year', e.target.value)}
            >
              <option value="">All Years</option>
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Section</label>
            <select 
              value={filters.section} 
              onChange={(e) => handleFilterChange('section', e.target.value)}
            >
              <option value="">All Sections</option>
              {sections.map(section => (
                <option key={section} value={section}>{section}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Status</label>
            <select 
              value={filters.isActive} 
              onChange={(e) => handleFilterChange('isActive', e.target.value)}
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Has Events</label>
            <select 
              value={filters.hasEvents} 
              onChange={(e) => handleFilterChange('hasEvents', e.target.value)}
            >
              <option value="">Any</option>
              <option value="true">With Events</option>
              <option value="false">Without Events</option>
            </select>
          </div>
        </div>

        <div className="filter-row">
          <div className="search-group">
            <input
              type="text"
              placeholder="Search by name, email, or roll number..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="search-input"
            />
          </div>
          <button className="btn-secondary" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <div className="bulk-actions">
          <span>{selectedUsers.length} user(s) selected</span>
          <select 
            value={bulkAction} 
            onChange={(e) => setBulkAction(e.target.value)}
          >
            <option value="">Choose Action</option>
            <option value="activate">Activate</option>
            <option value="deactivate">Deactivate</option>
            <option value="delete">Delete</option>
          </select>
          <button 
            className="btn-primary"
            onClick={() => setShowBulkModal(true)}
            disabled={!bulkAction}
          >
            Apply Action
          </button>
        </div>
      )}

      {/* Content based on view mode */}
      {loading ? (
        <div className="loading">Loading users...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : viewMode === 'analytics' ? (
        renderAnalytics()
      ) : viewMode === 'cards' ? (
        <div className="users-grid">
          {users.map(renderUserCard)}
        </div>
      ) : (
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === users.length && users.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th>User</th>
                <th>Role</th>
                <th>Department</th>
                <th>Details</th>
                <th>Performance</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user._id)}
                      onChange={() => handleUserSelect(user._id)}
                    />
                  </td>
                  <td>
                    <div className="user-info">
                      <div className="user-avatar-sm">
                        {user.profilePicture ? (
                          <img src={user.profilePicture} alt={user.firstName} />
                        ) : (
                          <div className="avatar-initials-sm">
                            {user.firstName?.[0]}{user.lastName?.[0]}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="user-name">{user.firstName} {user.lastName}</div>
                        <div className="user-email">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`role-badge ${user.role}`}>{user.role}</span>
                  </td>
                  <td>
                    {user.student?.department || user.faculty?.department || 'N/A'}
                  </td>
                  <td>
                    {user.student && (
                      <div className="student-details">
                        <div>Roll: {user.student.rollNumber}</div>
                        <div>Year: {user.student.year}, Section: {user.student.section}</div>
                      </div>
                    )}
                    {user.faculty && (
                      <div className="faculty-details">
                        <div>{user.faculty.designation}</div>
                        <div>Can Coordinate: {user.faculty.canCoordinate ? 'Yes' : 'No'}</div>
                      </div>
                    )}
                  </td>
                  <td>
                    {user.analytics && (
                      <div className="performance-metrics">
                        <div>Events: {user.analytics.totalEventsRegistered}</div>
                        <div>Attendance: {user.analytics.avgAttendanceRate?.toFixed(1)}%</div>
                        <div>Certificates: {user.analytics.certificatesEarned}</div>
                      </div>
                    )}
                  </td>
                  <td>
                    <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-secondary btn-sm">Edit</button>
                      <button className="btn-danger btn-sm">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="pagination">
          <button 
            disabled={pagination.page === 1}
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
          >
            Previous
          </button>
          <span>Page {pagination.page} of {pagination.pages}</span>
          <button 
            disabled={pagination.page === pagination.pages}
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
          >
            Next
          </button>
        </div>
      )}

      {/* Bulk Action Confirmation Modal */}
      {showBulkModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Confirm Bulk Action</h3>
            <p>
              Are you sure you want to {bulkAction} {selectedUsers.length} user(s)?
            </p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowBulkModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleBulkAction}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartUserManagement;