import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import ComprehensiveEventForm from '../events/ComprehensiveEventForm';
import EnhancedEventCard from '../events/CompactEventCard';
import SearchAndFilter from '../SearchAndFilter';
import AdminManagement from '../AdminManagement';
import SmartUserManagement from '../admin/SmartUserManagement';
import SmartEventManagement from '../admin/SmartEventManagement';
import APITestPanel from '../admin/APITestPanel';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const EnhancedAdminDashboard = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOptions, setFilterOptions] = useState({
    status: 'all',
    category: 'all',
    type: 'all'
  });

  // Statistics
  const [stats, setStats] = useState({
    totalEvents: 0,
    pendingApprovals: 0,
    activeUsers: 0,
    totalRegistrations: 0,
    upcomingEvents: 0,
    ongoingEvents: 0,
    avgAttendance: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      // Fetch admin dashboard data which includes stats and overview data
      const dashboardRes = await axios.get('http://localhost:5000/api/dashboard/admin', config);
      const dashboardData = dashboardRes.data.data || dashboardRes.data;

      // Fetch all events separately using admin endpoint (without pagination limit)
      const eventsRes = await axios.get('http://localhost:5000/api/events/admin?limit=1000', config);
      const allEvents = eventsRes.data.data?.events || eventsRes.data.events || eventsRes.data.data || eventsRes.data || [];

      console.log('Admin Dashboard - Fetched events:', allEvents.length, 'events');
      console.log('Admin Dashboard - Events data:', allEvents);

      // Set data from responses
      setEvents(Array.isArray(allEvents) ? allEvents : []);
      setUsers(dashboardData.users || []);
      setRegistrations(dashboardData.registrations || []);
      setSessions(dashboardData.sessions || []);

      // Calculate statistics using fetched events
      const eventsData = Array.isArray(allEvents) ? allEvents : [];
      const usersData = Array.isArray(dashboardData.users) ? dashboardData.users : [];
      const registrationsData = Array.isArray(dashboardData.registrations) ? dashboardData.registrations : [];

      const now = new Date();
      const upcomingEvents = eventsData.filter(event => 
        new Date(event.startDate) > now && event.status === 'approved'
      ).length;
      
      const ongoingEvents = eventsData.filter(event => {
        const start = new Date(event.startDate);
        const end = new Date(event.endDate);
        return start <= now && end >= now && event.status === 'approved';
      }).length;

      // Calculate average attendance
      let avgAttendance = 0;
      try {
        const attendanceRes = await axios.get('http://localhost:5000/api/attendance/', config);
        const attendanceList = attendanceRes.data.data || attendanceRes.data || [];
        setAttendanceData(Array.isArray(attendanceList) ? attendanceList : []);
        
        if (attendanceList.length > 0) {
          const totalAttendance = attendanceList.reduce((total, record) => {
            return total + (record.present ? 1 : 0);
          }, 0);
          avgAttendance = ((totalAttendance / attendanceList.length) * 100).toFixed(1);
        }
      } catch (attendanceError) {
        console.error('Failed to fetch attendance data:', attendanceError);
        setAttendanceData([]);
      }

      setStats({
        totalEvents: eventsData.length,
        pendingApprovals: eventsData.filter(event => event.status === 'pending').length,
        activeUsers: usersData.length,
        totalRegistrations: registrationsData.length,
        upcomingEvents,
        ongoingEvents,
        avgAttendance: parseFloat(avgAttendance)
      });

      setLoading(false);
    } catch (error) {
      console.error('Fetch dashboard data error:', error);
      setError('Failed to fetch dashboard data');
      setLoading(false);
    }
  };

  const handleCreateEvent = async (eventData) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Prepare event data for backend
      const eventPayload = {
        title: eventData.title,
        description: eventData.description,
        category: eventData.category,
        type: eventData.type,
        startDate: eventData.startDate,
        endDate: eventData.endDate,
        registration: {
          required: eventData.registration?.required ?? true,
          startDate: eventData.registration?.startDate,
          endDate: eventData.registration?.endDate,
          maxParticipants: eventData.registration?.maxParticipants || 100,
          isOpen: eventData.registration?.isOpen ?? false
        },
        eligibility: {
          departments: eventData.eligibility?.departments || ['All Departments'],
          programs: eventData.eligibility?.programs || [],
          years: eventData.eligibility?.years || [],
          sections: eventData.eligibility?.sections || []
        },
        venue: {
          name: eventData.venue?.name || '',
          type: eventData.venue?.type || 'seminar_hall',
          isOnline: eventData.venue?.isOnline || false,
          meetingLink: eventData.venue?.meetingLink || ''
        },
        trainers: eventData.trainers || [],
        status: 'pending' // Events start as pending for admin approval
      };

      console.log('Creating event with payload:', eventPayload);
      
      const response = await axios.post('http://localhost:5000/api/events', eventPayload, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const newEvent = response.data.data || response.data;
      console.log('Event created successfully:', newEvent);
      
      // Add to events list
      setEvents(prev => [newEvent, ...(Array.isArray(prev) ? prev : [])]);
      setShowEventForm(false);
      setEditingEvent(null);
      setError('');
      toast.success('Event created successfully!');
      
      // Update stats
      setStats(prev => ({
        ...prev,
        totalEvents: prev.totalEvents + 1,
        pendingApprovals: newEvent.status === 'pending' ? prev.pendingApprovals + 1 : prev.pendingApprovals
      }));

      // Emit real-time notification via Socket.io
      const socket = app?.get?.('socketio');
      if (socket) {
        socket.emit('event-created', {
          event: newEvent,
          creator: user.name,
          department: newEvent.eligibility?.departments || ['All Departments']
        });
      }
      
    } catch (error) {
      console.error('Create event error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create event';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEditEvent = async (eventData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `http://localhost:5000/api/events/${editingEvent._id}`,
        eventData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      const updatedEvent = response.data.data || response.data;
      setEvents((Array.isArray(events) ? events : []).map(event => 
        event._id === editingEvent._id ? updatedEvent : event
      ));
      setEditingEvent(null);
      setShowEventForm(false);
      setError('');
      toast.success('Event updated successfully!');
    } catch (error) {
      console.error('Edit event error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update event';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleDeleteEvent = async (event) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/events/${event._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setEvents((Array.isArray(events) ? events : []).filter(e => e._id !== event._id));
      setError('');
      toast.success('Event deleted successfully!');
      
      // Update stats
      setStats(prev => ({
        ...prev,
        totalEvents: prev.totalEvents - 1,
        pendingApprovals: event.status === 'pending' ? prev.pendingApprovals - 1 : prev.pendingApprovals
      }));
    } catch (error) {
      console.error('Delete event error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete event';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleApproveEvent = async (event) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `http://localhost:5000/api/events/${event._id}/approve`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setEvents((Array.isArray(events) ? events : []).map(e => 
        e._id === event._id ? { ...e, status: 'approved' } : e
      ));
      setError('');
      toast.success('Event approved successfully!');
      
      // Update stats
      setStats(prev => ({
        ...prev,
        pendingApprovals: prev.pendingApprovals - 1
      }));
    } catch (error) {
      console.error('Approve event error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to approve event';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleRejectEvent = async (event) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `http://localhost:5000/api/events/${event._id}/reject`,
        { reason },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setEvents((Array.isArray(events) ? events : []).map(e => 
        e._id === event._id ? { ...e, status: 'rejected' } : e
      ));
      setError('');
      toast.success('Event rejected successfully!');
      
      // Update stats
      setStats(prev => ({
        ...prev,
        pendingApprovals: prev.pendingApprovals - 1
      }));
    } catch (error) {
      console.error('Reject event error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to reject event';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const openEditForm = (event) => {
    setEditingEvent(event);
    setShowEventForm(true);
  };

  const filteredEvents = (Array.isArray(events) ? events : []).filter(event => {
    const matchesSearch = event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.coordinator?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterOptions.status === 'all' || event.status === filterOptions.status;
    const matchesCategory = filterOptions.category === 'all' || event.category === filterOptions.category;
    const matchesType = filterOptions.type === 'all' || event.type === filterOptions.type;
    
    return matchesSearch && matchesStatus && matchesCategory && matchesType;
  });

  if (loading) {
    return (
      <div className="admin-dashboard-root">
        <div className="container py-8">
          <div className="loading-container">
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p className="loading-text">Loading dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderOverview = () => (
    <div className="overview-section">
      {/* Welcome Section */}
      <div className="welcome-section theme-red">
        <div className="welcome-inner">
          <div className="welcome-text">
            <h2>Welcome, {user?.name || 'Admin'}! 👑</h2>
            <p className="muted">Admin Dashboard - System Management</p>
          </div>
          <div className="welcome-emoji">👑</div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid admin-stats">
        <div className="stat-card card-blue">
          <div className="stat-inner">
            <div>
              <p className="stat-label">Total Events</p>
              <p className="stat-value">{stats.totalEvents}</p>
              <p className="stat-note">All events in system</p>
            </div>
            <div className="stat-icon">📅</div>
          </div>
        </div>
        
        <div className="stat-card card-yellow">
          <div className="stat-inner">
            <div>
              <p className="stat-label">Pending Approvals</p>
              <p className="stat-value">{stats.pendingApprovals}</p>
              <p className="stat-note">Events awaiting approval</p>
            </div>
            <div className="stat-icon">⏳</div>
          </div>
        </div>
        
        <div className="stat-card card-green">
          <div className="stat-inner">
            <div>
              <p className="stat-label">Active Users</p>
              <p className="stat-value">{stats.activeUsers}</p>
              <p className="stat-note">Registered users</p>
            </div>
            <div className="stat-icon">👥</div>
          </div>
        </div>
        
        <div className="stat-card card-purple">
          <div className="stat-inner">
            <div>
              <p className="stat-label">Total Registrations</p>
              <p className="stat-value">{stats.totalRegistrations}</p>
              <p className="stat-note">Event registrations</p>
            </div>
            <div className="stat-icon">📝</div>
          </div>
        </div>
        
        <div className="stat-card card-indigo">
          <div className="stat-inner">
            <div>
              <p className="stat-label">Upcoming Events</p>
              <p className="stat-value">{stats.upcomingEvents}</p>
              <p className="stat-note">Future events</p>
            </div>
            <div className="stat-icon">⏰</div>
          </div>
        </div>
        
        <div className="stat-card card-orange">
          <div className="stat-inner">
            <div>
              <p className="stat-label">Ongoing Events</p>
              <p className="stat-value">{stats.ongoingEvents}</p>
              <p className="stat-note">Currently running</p>
            </div>
            <div className="stat-icon">▶️</div>
          </div>
        </div>
        
        <div className="stat-card card-teal">
          <div className="stat-inner">
            <div>
              <p className="stat-label">Avg Attendance</p>
              <p className="stat-value">{stats.avgAttendance}%</p>
              <p className="stat-note">Overall attendance rate</p>
            </div>
            <div className="stat-icon">📊</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card actions-card">
        <h3>Quick Actions</h3>
        <div className="actions-grid admin-actions">
          <button onClick={() => setShowEventForm(true)} className="btn-primary">Create Event</button>
          <button onClick={() => setActiveTab('events')} className="btn-primary alt">Manage Events</button>
          <button onClick={() => setActiveTab('users')} className="btn-primary alt-2">Manage Users</button>
          <button onClick={() => setActiveTab('admin-management')} className="btn-primary alt-3">Admin Settings</button>
        </div>
      </div>

      {/* Recent Events */}
      <div className="card">
        <h3>Recent Events</h3>
        <div className="upcoming-list">
          {events.slice(0, 5).map(event => (
            <div key={event._id} className="upcoming-item">
              <div>
                <h4 className="semi">{event.title}</h4>
                <p className="event-meta">
                  <span className="event-category">{event.category}</span> • <span className="event-date">{new Date(event.startDate).toLocaleDateString()}</span>
                </p>
                <div className="badges">
                  <span className={`badge ${
                    event.status === 'approved' ? 'badge-green' :
                    event.status === 'pending' ? 'badge-yellow' :
                    event.status === 'rejected' ? 'badge-red' :
                    'badge-gray'
                  }`}>
                    {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                  </span>
                </div>
              </div>
              {event.status === 'pending' && (
                <div className="admin-event-actions">
                  <button onClick={() => handleApproveEvent(event)} className="btn-small approve">Approve</button>
                  <button onClick={() => handleRejectEvent(event)} className="btn-small reject">Reject</button>
                </div>
              )}
            </div>
          ))}
          {events.length === 0 && (
            <p className="muted center">No events in system.</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderEvents = () => (
    <div className="events-section">
      {/* Header with Create Button */}
      <div className="section-header">
        <h2>Event Management</h2>
        <button onClick={() => setShowEventForm(true)} className="btn-primary">
          Create New Event
        </button>
      </div>

      {/* Search and Filters */}
      <div className="card filters-card">
        <div className="filters-grid">
          <div>
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field"
            />
          </div>
          
          <select
            value={filterOptions.status}
            onChange={(e) => setFilterOptions({...filterOptions, status: e.target.value})}
            className="select-field"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          
          <select
            value={filterOptions.category}
            onChange={(e) => setFilterOptions({...filterOptions, category: e.target.value})}
            className="select-field"
          >
            <option value="all">All Categories</option>
            <option value="CRT">Campus Recruitment Training</option>
            <option value="FDP">Faculty Development Program</option>
            <option value="Workshop">Workshop</option>
            <option value="Cultural">Cultural</option>
            <option value="Sports">Sports</option>
            <option value="Seminar">Seminar</option>
            <option value="Conference">Conference</option>
            <option value="Other">Other</option>
          </select>
          
          <select
            value={filterOptions.type}
            onChange={(e) => setFilterOptions({...filterOptions, type: e.target.value})}
            className="select-field"
          >
            <option value="all">All Types</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>
      </div>

      {/* Events Grid */}
      <div className="events-grid">
        {filteredEvents.map(event => (
          <EnhancedEventCard
            key={event._id}
            event={event}
            onEdit={openEditForm}
            onDelete={handleDeleteEvent}
            onApprove={handleApproveEvent}
            onReject={handleRejectEvent}
          />
        ))}
      </div>

      {filteredEvents.length === 0 && (
        <div className="no-data">
          <p className="muted">No events found matching your criteria.</p>
        </div>
      )}
    </div>
  );

  const renderUsers = () => (
    <div className="users-section">
      <h2>User Management</h2>
      
      <div className="table-card">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Department</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id}>
                  <td>
                    <div>
                      <div className="semi">{user.name}</div>
                      <div className="muted small">{user.email}</div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${
                      user.role === 'admin' ? 'badge-red' :
                      user.role === 'faculty' ? 'badge-blue' :
                      user.role === 'student' ? 'badge-green' :
                      'badge-purple'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    {user.department || 'N/A'}
                  </td>
                  <td className="muted">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <button className="btn-small link-blue">Edit</button>
                    <button className="btn-small link-red">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="admin-dashboard-root">
      {/* Header */}
      <div className="sd-header theme-red">
        <div className="container">
          <div className="sd-header-inner">
            <div>
              <h1>Admin Dashboard</h1>
              <p className="subtitle">Comprehensive event and program management</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="tabs-wrap">
        <div className="container">
          <nav className="tabs">
            {[
              { key: 'overview', label: 'Overview', icon: '🏠' },
              { key: 'events', label: 'Smart Events', icon: '📅' },
              { key: 'users', label: 'Smart Users', icon: '👥' },
              { key: 'admin-management', label: 'Admin Management', icon: '⚙️' },
              { key: 'api-tests', label: 'API Tests', icon: '🧪' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={"tab" + (activeTab === tab.key ? ' active' : '')}
              >
                <span className="tab-icon">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-8">
        {error && (
          <div className="error-banner">
            {error}
          </div>
        )}

        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'events' && <SmartEventManagement />}
        {activeTab === 'users' && <SmartUserManagement />}
        {activeTab === 'admin-management' && <AdminManagement />}
        {activeTab === 'api-tests' && <APITestPanel />}
      </div>

      {/* Event Form Modal */}
      {showEventForm && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <div className="modal-header">
              <h2 className="modal-title">
                {editingEvent ? 'Edit Event' : 'Create New Event'}
              </h2>
              <button
                onClick={() => {
                  setShowEventForm(false);
                  setEditingEvent(null);
                }}
                className="modal-close"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <ComprehensiveEventForm
                event={editingEvent}
                onSubmit={editingEvent ? handleEditEvent : handleCreateEvent}
                onCancel={() => {
                  setShowEventForm(false);
                  setEditingEvent(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedAdminDashboard;