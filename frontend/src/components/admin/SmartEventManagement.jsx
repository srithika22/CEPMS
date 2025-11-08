import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import '../../styles/smartEventManagement.css';

const SmartEventManagement = () => {
  // API URL from environment variable
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('cards'); // cards, table, analytics
  const [activeTab, setActiveTab] = useState('overview'); // overview, participants, attendance, sessions, analytics
  
  // Filters and Search
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    department: '',
    dateRange: '',
    search: ''
  });
  
  // Event Management States
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  
  // Participant Management States
  const [participants, setParticipants] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  
  // Analytics Data
  const [analytics, setAnalytics] = useState({
    overview: {},
    participation: {},
    attendance: {},
    performance: {}
  });

  // Modal States
  const [showAddParticipantsModal, setShowAddParticipantsModal] = useState(false);
  const [showAddSessionModal, setShowAddSessionModal] = useState(false);
  const [showBulkActionModal, setShowBulkActionModal] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);

  // Fetch Events
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = token
        ? { headers: { Authorization: `Bearer ${token}` }, params: {
            status: filters.status,
            category: filters.category,
            department: filters.department,
            search: filters.search,
            page: currentPage,
            limit: itemsPerPage
          } }
        : { params: {
            status: filters.status,
            category: filters.category,
            department: filters.department,
            search: filters.search,
            page: currentPage,
            limit: itemsPerPage
          } };

      // Try admin endpoint first, fall back to public if it fails
      let response;
      if (token) {
        try {
          response = await axios.get('${API_URL}/events/admin', config);
          console.log('Admin endpoint successful');
        } catch (adminError) {
          console.warn('Admin endpoint failed, trying public endpoint:', adminError.message);
          response = await axios.get('${API_URL}/events', { params: config.params });
        }
      } else {
        response = await axios.get('${API_URL}/events', config);
      }
      
      console.log('API Response status:', response.status);
      console.log('API Response data structure:', response.data);
      
      // Handle different response structures
      let eventsData = [];
      if (response.data) {
        if (Array.isArray(response.data)) {
          eventsData = response.data;
        } else if (response.data.events && Array.isArray(response.data.events)) {
          eventsData = response.data.events;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          eventsData = response.data.data;
        } else if (response.data.data && response.data.data.events && Array.isArray(response.data.data.events)) {
          eventsData = response.data.data.events;
        }
      }
      
      setEvents(eventsData);
      console.log('Smart Event Management - Fetched events:', eventsData.length, 'events');
    } catch (error) {
      setError('Failed to fetch events');
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, currentPage, itemsPerPage]);

  // Fetch Event Details
  const fetchEventDetails = useCallback(async (eventId) => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

      // Try public detail first; on 404 (e.g., pending events), fall back to local list item
      let eventData = null;
      try {
        const eventRes = await axios.get(`${API_URL}/events/${eventId}`, headers);
        eventData = eventRes.data?.data || eventRes.data;
      } catch (evtErr) {
        if (evtErr?.response?.status === 404) {
          console.warn('Public event detail returned 404; using locally loaded admin event data.');
          const local = Array.isArray(events) ? events.find(e => (e._id === eventId) || (e.id === eventId)) : null;
          if (local) {
            eventData = local;
          } else {
            throw evtErr;
          }
        } else {
          throw evtErr;
        }
      }

      setSelectedEvent(eventData);

      // Try to get registrations, but don't fail if endpoint doesn't exist
      let registrationsRes;
      try {
        registrationsRes = await axios.get(`${API_URL}/registrations/event/${eventId}`, headers);
      } catch (regError) {
        console.warn('Registrations endpoint failed, using empty data:', regError.message);
        registrationsRes = { data: [] };
      }

      // Unwrap response formats
      let regsArray = [];
      if (registrationsRes && registrationsRes.data) {
        if (Array.isArray(registrationsRes.data)) {
          regsArray = registrationsRes.data;
        } else if (Array.isArray(registrationsRes.data.registrations)) {
          regsArray = registrationsRes.data.registrations;
        } else if (registrationsRes.data.data) {
          if (Array.isArray(registrationsRes.data.data)) regsArray = registrationsRes.data.data;
          else if (Array.isArray(registrationsRes.data.data.registrations)) regsArray = registrationsRes.data.data.registrations;
        }
      }

      // Normalize participants to consistent shape: { id, name, email, role, department, rollNumber }
      const normalizedParticipants = regsArray.map(reg => {
        let user = null;
        if (reg.user) {
          user = reg.user;
        } else if (reg.userId && typeof reg.userId === 'object') {
          user = reg.userId;
        }
        return {
          id: user?._id || reg.userId || reg._id,
          name: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                     : (reg.userName || user?.name || 'Unknown User'),
          email: user?.email || reg.userEmail || '',
          role: user?.role || reg.userRole || '',
          department: user?.student?.department || user?.faculty?.department || reg.department || '',
          rollNumber: user?.student?.rollNumber || reg.rollNumber || '',
          status: reg.status || 'confirmed',
          registeredAt: reg.registeredAt || reg.createdAt,
          _registration: reg
        };
      });

      setParticipants(normalizedParticipants);

      // Fetch attendance via filtered endpoint and normalize for UI
      try {
        const attendanceRes = await axios.get(`${API_URL}/attendance/event/${eventId}/filtered`, headers);
        const raw = attendanceRes.data?.data?.attendance
          || attendanceRes.data?.attendance
          || attendanceRes.data
          || [];

        const normalizedAttendance = Array.isArray(raw) ? raw.map(rec => {
          const u = rec.userId || {};
          // Match UI expectation: record.participant.{...}
          return {
            _id: rec._id,
            participant: {
              id: u._id || rec.userId || rec.user,
              name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || rec.userName || 'Unknown User',
              email: u.email || rec.userEmail || '',
              role: u.role || '',
              department: u.student?.department || rec.department || ''
            },
            checkInTime: rec.markedAt || null,
            checkOutTime: null,
            status: rec.present ? 'present' : 'absent'
          };
        }) : [];

        setAttendance(normalizedAttendance);
      } catch (attError) {
        console.warn('Attendance endpoint failed:', attError.message);
        setAttendance([]);
      }

      // Fetch real analytics data
      try {
        const analyticsRes = await axios.get(`${API_URL}/events/${eventId}/analytics/detailed`, headers);
        const analyticsData = analyticsRes.data?.data || analyticsRes.data || {};
        setAnalytics({
          overview: analyticsData.overview || {
            totalParticipants: normalizedParticipants.length,
            averageAttendance: '0%',
            completionRate: '0%'
          },
          participation: analyticsData.participation || {
            byDepartment: []
          },
          attendance: analyticsData.attendance || {},
          performance: analyticsData.performance || {
            topParticipants: []
          }
        });
      } catch (analError) {
        console.warn('Analytics endpoint failed:', analError.message);
        setAnalytics({
          overview: {
            totalParticipants: normalizedParticipants.length,
            averageAttendance: '0%',
            completionRate: '0%'
          },
          participation: {
            byDepartment: normalizedParticipants.reduce((acc, p) => {
              if (p.department) {
                acc[p.department] = (acc[p.department] || 0) + 1;
              }
              return acc;
            }, {})
          },
          attendance: {},
          performance: {
            topParticipants: []
          }
        });
      }
    } catch (error) {
      console.error('Error fetching event details:', error);
      setError('Failed to fetch event details');
    }
  }, [events]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Filter and Search Functions
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleSearch = (searchTerm) => {
    setFilters(prev => ({ ...prev, search: searchTerm }));
    setCurrentPage(1);
  };

  // Event Management Functions
  const handleCreateEvent = () => {
    setEditingEvent(null);
    setShowEventForm(true);
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setShowEventForm(true);
  };

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
        await axios.delete(`${API_URL}/events/${eventId}`, headers);
        fetchEvents();
        if (selectedEvent?._id === eventId) {
          setSelectedEvent(null);
        }
      } catch (error) {
        console.error('Error deleting event:', error);
        setError('Failed to delete event');
      }
    }
  };

  // Admin Event Actions
  const handleApproveEvent = async (eventId) => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      await axios.patch(`${API_URL}/events/${eventId}/approve`, {}, headers);
      fetchEvents();
      setError('');
    } catch (error) {
      console.error('Error approving event:', error);
      setError('Failed to approve event');
    }
  };

  const handleRejectEvent = async (eventId) => {
    if (window.confirm('Are you sure you want to reject this event?')) {
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
        await axios.patch(`${API_URL}/events/${eventId}/reject`, {}, headers);
        fetchEvents();
        setError('');
      } catch (error) {
        console.error('Error rejecting event:', error);
        setError('Failed to reject event');
      }
    }
  };

  const handleToggleRegistration = async (eventId) => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      await axios.patch(`${API_URL}/events/${eventId}/toggle-registration`, {}, headers);
      fetchEvents();
      if (selectedEvent?._id === eventId) {
        fetchEventDetails(eventId);
      }
      setError('');
    } catch (error) {
      console.error('Error toggling registration:', error);
      setError('Failed to toggle registration');
    }
  };

  // Participant Management Functions
  const handleAddParticipants = async (userIds) => {
    try {
      // Use registrations endpoint to add participants
      await axios.post(`/api/registrations`, { 
        event: selectedEvent._id, 
        users: userIds 
      });
      fetchEventDetails(selectedEvent._id);
    } catch (error) {
      console.error('Error adding participants:', error);
    }
  };

  const handleRemoveParticipants = async (userIds) => {
    try {
      // Use registrations endpoint to remove participants
      for (const userId of userIds) {
        await axios.delete(`/api/registrations`, { 
          data: { event: selectedEvent._id, user: userId } 
        });
      }
      fetchEventDetails(selectedEvent._id);
    } catch (error) {
      console.error('Error removing participants:', error);
    }
  };

  // Attendance Management Functions
  const handleMarkAttendance = async (participantId, status, session = null) => {
    try {
      await axios.post(`/api/attendance/mark`, {
        user: participantId,
        event: selectedEvent._id,
        status,
        session
      });
      fetchEventDetails(selectedEvent._id);
    } catch (error) {
      console.error('Error marking attendance:', error);
    }
  };

  const handleBulkAttendance = async (participantIds, status) => {
    try {
      for (const participantId of participantIds) {
        await axios.post(`/api/attendance/mark`, {
          user: participantId,
          event: selectedEvent._id,
          status
        });
      }
      fetchEventDetails(selectedEvent._id);
    } catch (error) {
      console.error('Error updating bulk attendance:', error);
    }
  };

  // Export/Import Functions
  const handleExportParticipants = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      const response = await axios.get(`${API_URL}/registrations/event/${selectedEvent._id}/export`, headers);
      const exportData = response.data?.data || response.data || [];
      
      // Convert to CSV
      const csvContent = convertToCSV(exportData);
      downloadCSV(csvContent, `${selectedEvent.title}_participants.csv`);
    } catch (error) {
      console.error('Error exporting participants:', error);
      setError('Failed to export participants');
    }
  };

  const handleExportAttendance = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      const response = await axios.get(`${API_URL}/attendance/event/${selectedEvent._id}/export`, headers);
      const exportData = response.data?.data || response.data || [];
      
      // Convert to CSV
      const csvContent = convertToCSV(exportData);
      downloadCSV(csvContent, `${selectedEvent.title}_attendance.csv`);
    } catch (error) {
      console.error('Error exporting attendance:', error);
      setError('Failed to export attendance');
    }
  };

  const convertToCSV = (data) => {
    if (!Array.isArray(data) || data.length === 0) return '';
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row).map(value => 
        typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value
      ).join(',')
    );
    
    return [headers, ...rows].join('\n');
  };

  const downloadCSV = (csvContent, filename) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Session Management Functions
  const handleCreateSession = async (sessionData) => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      await axios.post(`${API_URL}/sessions`, {
        ...sessionData,
        eventId: selectedEvent._id
      }, headers);
      
      fetchEventDetails(selectedEvent._id);
    } catch (error) {
      console.error('Error creating session:', error);
      setError('Failed to create session');
    }
  };

  const handleUpdateSession = async (sessionId, sessionData) => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      await axios.put(`${API_URL}/sessions/${sessionId}`, sessionData, headers);
      fetchEventDetails(selectedEvent._id);
    } catch (error) {
      console.error('Error updating session:', error);
      setError('Failed to update session');
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (window.confirm('Are you sure you want to delete this session?')) {
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
        
        await axios.delete(`${API_URL}/sessions/${sessionId}`, headers);
        fetchEventDetails(selectedEvent._id);
      } catch (error) {
        console.error('Error deleting session:', error);
        setError('Failed to delete session');
      }
    }
  };

  // Render Functions
  const renderEventCard = (event) => (
    <div key={event._id} className="event-card">
      <div className="event-card-header">
        <div className="event-status">
          <span className={`status-badge ${event.status?.toLowerCase()}`}>
            {event.status}
          </span>
          <span className="event-category">{event.category}</span>
        </div>
        <div className="event-actions">
          {/* Admin approval actions for pending events */}
          {event.status === 'pending' && (
            <>
              <button 
                onClick={() => handleApproveEvent(event._id)}
                className="btn-sm btn-success"
                title="Approve Event"
              >
                Approve
              </button>
              <button 
                onClick={() => handleRejectEvent(event._id)}
                className="btn-sm btn-danger"
                title="Reject Event"
              >
                Reject
              </button>
            </>
          )}
          
          {/* Registration toggle for approved events */}
          {(event.status === 'approved' || event.status === 'ongoing') && (
            <button 
              onClick={() => handleToggleRegistration(event._id)}
              className={`btn-sm ${event.registration?.isOpen ? 'btn-warning' : 'btn-info'}`}
              title={event.registration?.isOpen ? 'Close Registration' : 'Open Registration'}
            >
              {event.registration?.isOpen ? 'Close Reg' : 'Open Reg'}
            </button>
          )}
          
          {/* Standard management actions */}
          <button 
            onClick={() => fetchEventDetails(event._id)}
            className="btn-sm btn-primary"
            title="Manage Event Details"
          >
            Manage
          </button>
          <button 
            onClick={() => handleEditEvent(event)}
            className="btn-sm btn-secondary"
            title="Edit Event"
          >
            Edit
          </button>
          <button 
            onClick={() => handleDeleteEvent(event._id)}
            className="btn-sm btn-danger"
            title="Delete Event"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="event-card-body">
        <h3>{event.title}</h3>
        <p className="event-description">{event.description}</p>
        
        <div className="event-details">
          <div className="detail-item">
            <span className="label">Date:</span>
            <span>{new Date(event.startDate || event.date).toLocaleDateString()}</span>
          </div>
          <div className="detail-item">
            <span className="label">Venue:</span>
            <span>
              {event.venue && typeof event.venue === 'object' 
                ? event.venue.name || 'Venue not specified'
                : event.venue || 'Venue not specified'}
            </span>
          </div>
          <div className="detail-item">
            <span className="label">Department:</span>
            <span>{event.department || event.eligibility?.departments?.join(', ') || 'All Departments'}</span>
          </div>
          <div className="detail-item">
            <span className="label">Registration:</span>
            <span className={`registration-status ${event.registration?.isOpen ? 'open' : 'closed'}`}>
              {event.registration?.isOpen ? 'Open' : 'Closed'}
            </span>
          </div>
        </div>

        <div className="event-stats">
          <div className="stat">
            <span className="stat-value">{event.registration?.currentCount || event.participantCount || 0}</span>
            <span className="stat-label">Participants</span>
          </div>
          <div className="stat">
            <span className="stat-value">{event.registration?.maxParticipants || 'Unlimited'}</span>
            <span className="stat-label">Capacity</span>
          </div>
          <div className="stat">
            <span className="stat-value">{event.attendanceRate || '0%'}</span>
            <span className="stat-label">Attendance</span>
          </div>
          <div className="stat">
            <span className="stat-value">{event.sessions?.length || 0}</span>
            <span className="stat-label">Sessions</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEventTable = () => (
    <div className="events-table-container">
      <table className="events-table">
        <thead>
          <tr>
            <th>Event</th>
            <th>Date</th>
            <th>Status</th>
            <th>Category</th>
            <th>Participants</th>
            <th>Attendance</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(events) && events.length > 0 ? (
            events.map(event => (
              <tr key={event._id}>
                <td>
                  <div className="event-info">
                    <h4>{event.title}</h4>
                    <p>
                      {event.venue && typeof event.venue === 'object' 
                        ? event.venue.name || 'Venue not specified'
                        : event.venue || 'Venue not specified'}
                    </p>
                  </div>
                </td>
                <td>{new Date(event.startDate || event.date).toLocaleDateString()}</td>
                <td>
                  <span className={`status-badge ${event.status?.toLowerCase()}`}>
                    {event.status}
                  </span>
                </td>
                <td>{event.category}</td>
                <td>{event.registration?.currentCount || event.participantCount || 0}</td>
                <td>{event.attendanceRate || '0%'}</td>
                <td>
                  <div className="action-buttons">
                    {/* Admin approval actions for pending events */}
                    {event.status === 'pending' && (
                      <>
                        <button 
                          onClick={() => handleApproveEvent(event._id)}
                          className="btn-sm btn-success"
                          title="Approve Event"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => handleRejectEvent(event._id)}
                          className="btn-sm btn-danger"
                          title="Reject Event"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    
                    {/* Registration toggle for approved events */}
                    {(event.status === 'approved' || event.status === 'ongoing') && (
                      <button 
                        onClick={() => handleToggleRegistration(event._id)}
                        className={`btn-sm ${event.registration?.isOpen ? 'btn-warning' : 'btn-info'}`}
                        title={event.registration?.isOpen ? 'Close Registration' : 'Open Registration'}
                      >
                        {event.registration?.isOpen ? 'Close Reg' : 'Open Reg'}
                      </button>
                    )}
                    
                    {/* Standard management actions */}
                    <button 
                      onClick={() => fetchEventDetails(event._id)}
                      className="btn-sm btn-primary"
                      title="Manage Event"
                    >
                      Manage
                    </button>
                    <button 
                      onClick={() => handleEditEvent(event)}
                      className="btn-sm btn-secondary"
                      title="Edit Event"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteEvent(event._id)}
                      className="btn-sm btn-danger"
                      title="Delete Event"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                No events found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  // Participant Selection Handlers
  const handleSelectParticipant = (participantId) => {
    setSelectedParticipants(prev => 
      prev.includes(participantId) 
        ? prev.filter(id => id !== participantId)
        : [...prev, participantId]
    );
  };

  const handleSelectAllParticipants = () => {
    if (selectedParticipants.length === participants.length) {
      setSelectedParticipants([]);
    } else {
      setSelectedParticipants(participants.map(p => p.id));
    }
  };

  const renderParticipantsTab = () => (
    <div className="participants-management">
      <div className="participants-header">
        <h3>Event Participants</h3>
        <div className="participants-actions">
          <button 
            onClick={() => setShowAddParticipantsModal(true)}
            className="btn-primary"
          >
            Add Participants
          </button>
          <button 
            onClick={() => handleRemoveParticipants(selectedParticipants)}
            className="btn-danger"
            disabled={selectedParticipants.length === 0}
          >
            Remove Selected
          </button>
          <button 
            onClick={handleExportParticipants}
            className="btn-secondary"
          >
            Export Participants
          </button>
          <button 
            onClick={handleExportAttendance}
            className="btn-secondary"
          >
            Export Attendance
          </button>
        </div>
      </div>

      <div className="participants-filters">
        <input
          type="text"
          placeholder="Search participants..."
          className="search-input"
        />
        <select>
          <option value="">All Roles</option>
          <option value="student">Students</option>
          <option value="faculty">Faculty</option>
          <option value="trainer">Trainers</option>
        </select>
        <select>
          <option value="">All Departments</option>
          <option value="CSE">Computer Science</option>
          <option value="ECE">Electronics</option>
          <option value="MECH">Mechanical</option>
        </select>
      </div>

      <div className="participants-controls">
        <div className="bulk-selection">
          <input
            type="checkbox"
            id="select-all-participants"
            checked={participants.length > 0 && selectedParticipants.length === participants.length}
            onChange={handleSelectAllParticipants}
          />
          <label htmlFor="select-all-participants">
            Select All ({selectedParticipants.length} selected)
          </label>
        </div>
      </div>

      <div className="participants-list">
        {Array.isArray(participants) && participants.length > 0 ? (
          participants.map(participant => (
            <div key={participant.id} className="participant-card">
              <div className="participant-selection">
                <input
                  type="checkbox"
                  checked={selectedParticipants.includes(participant.id)}
                  onChange={() => handleSelectParticipant(participant.id)}
                />
              </div>
              <div className="participant-info">
                <div className="participant-avatar">
                  {participant.profilePicture ? (
                    <img src={participant.profilePicture} alt={participant.name} />
                  ) : (
                    <span className="avatar-initials">
                      {participant.name?.split(' ').map(n => n[0]).join('') || '?'}
                    </span>
                  )}
                </div>
                <div className="participant-details">
                  <h4>{participant.name}</h4>
                  <p>{participant.email}</p>
                  <div className="participant-meta">
                    <span className={`role-badge ${participant.role}`}>
                      {participant.role}
                    </span>
                    {participant.department && (
                      <span className="department">{participant.department}</span>
                    )}
                    {participant.rollNumber && (
                      <span className="roll-number">{participant.rollNumber}</span>
                    )}
                    <span className={`status-badge ${participant.status}`}>
                      {participant.status}
                    </span>
                  </div>
                </div>
              </div>
              <div className="participant-status">
                <div className="attendance-summary">
                  <span>Attendance: {participant.attendanceRate || '0%'}</span>
                </div>
                <div className="participant-actions">
                  <button 
                    onClick={() => handleMarkAttendance(participant.id, 'present')}
                    className="btn-sm btn-primary"
                  >
                    Mark Present
                  </button>
                  <button 
                    onClick={() => handleMarkAttendance(participant.id, 'absent')}
                    className="btn-sm btn-secondary"
                  >
                    Mark Absent
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-participants">
            <p>No participants found for this event</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderAttendanceTab = () => (
    <div className="attendance-management">
      <div className="attendance-header">
        <h3>Attendance Management</h3>
        <div className="attendance-actions">
          <button className="btn-primary">Bulk Mark Present</button>
          <button className="btn-secondary">Bulk Mark Absent</button>
          <button className="btn-secondary">Export Attendance</button>
        </div>
      </div>

      <div className="session-selector">
        <label>Select Session:</label>
        <select>
          <option value="all">All Sessions</option>
          {Array.isArray(selectedEvent?.sessions) ? (
            selectedEvent.sessions.map(session => (
              <option key={session._id} value={session._id}>
                {session.title} - {new Date(session.date).toLocaleDateString()}
              </option>
            ))
          ) : null}
        </select>
      </div>

      <div className="attendance-table-container">
        <table className="attendance-table">
          <thead>
            <tr>
              <th>
                <input type="checkbox" />
              </th>
              <th>Participant</th>
              <th>Role</th>
              <th>Department</th>
              <th>Check-in Time</th>
              <th>Check-out Time</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(attendance) && attendance.length > 0 ? (
              attendance.map(record => (
                <tr key={record._id}>
                  <td>
                    <input type="checkbox" />
                  </td>
                  <td>
                    <div className="participant-info">
                      <div className="participant-avatar-sm">
                        {record.participant.profilePicture ? (
                          <img src={record.participant.profilePicture} alt={record.participant.name} />
                        ) : (
                          <span className="avatar-initials-sm">
                            {record.participant.name?.split(' ').map(n => n[0]).join('')}
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="participant-name">{record.participant.name}</span>
                        <span className="participant-email">{record.participant.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`role-badge ${record.participant.role}`}>
                      {record.participant.role}
                    </span>
                  </td>
                  <td>{record.participant.department}</td>
                  <td>{record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString() : '-'}</td>
                  <td>{record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString() : '-'}</td>
                  <td>
                    <span className={`status-badge ${record.status}`}>
                      {record.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        onClick={() => handleMarkAttendance(record.participant?.id || record.participant?._id || record.participantId, 'present')}
                        className="btn-sm btn-primary"
                      >
                        Present
                      </button>
                      <button 
                        onClick={() => handleMarkAttendance(record.participant?.id || record.participant?._id || record.participantId, 'absent')}
                        className="btn-sm btn-danger"
                      >
                        Absent
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>
                  No attendance records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSessionsTab = () => (
    <div className="event-sessions">
      <div className="sessions-header">
        <h3>Session Management</h3>
        <div className="sessions-actions">
          <button 
            onClick={() => setShowAddSessionModal(true)}
            className="btn-primary"
          >
            Add Session
          </button>
        </div>
      </div>

      <div className="sessions-list">
        {Array.isArray(selectedEvent?.sessions) && selectedEvent.sessions.length > 0 ? (
          selectedEvent.sessions.map(session => (
            <div key={session._id} className="session-card">
              <div className="session-header">
                <h4>{session.title}</h4>
                <div className="session-actions">
                  <button 
                    onClick={() => handleUpdateSession(session._id, session)}
                    className="btn-sm btn-secondary"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDeleteSession(session._id)}
                    className="btn-sm btn-danger"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="session-details">
                <div className="session-info">
                  <p><strong>Date:</strong> {new Date(session.date).toLocaleDateString()}</p>
                  <p><strong>Time:</strong> {session.startTime} - {session.endTime}</p>
                  <p><strong>Trainer:</strong> {session.trainer?.name || 'TBD'}</p>
                  <p><strong>Type:</strong> {session.type}</p>
                  {session.venue && (
                    <p><strong>Venue:</strong> 
                      {typeof session.venue === 'object' 
                        ? session.venue.name || 'Venue not specified'
                        : session.venue}
                    </p>
                  )}
                </div>
                <div className="session-stats">
                  <div className="stat">
                    <span className="stat-value">{session.attendanceCount || 0}</span>
                    <span className="stat-label">Attended</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">{session.maxParticipants || 'Unlimited'}</span>
                    <span className="stat-label">Capacity</span>
                  </div>
                </div>
              </div>
              {session.description && (
                <div className="session-description">
                  <p>{session.description}</p>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="no-sessions">
            <p>No sessions scheduled for this event</p>
            <button 
              onClick={() => setShowAddSessionModal(true)}
              className="btn-primary"
            >
              Add First Session
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderAnalyticsTab = () => (
    <div className="event-analytics">
      <div className="analytics-header">
        <h3>Event Analytics</h3>
        <div className="analytics-controls">
          <select>
            <option value="overview">Overview</option>
            <option value="participation">Participation</option>
            <option value="attendance">Attendance</option>
            <option value="performance">Performance</option>
          </select>
          <button className="btn-secondary">Export Report</button>
        </div>
      </div>

      <div className="analytics-grid">
        <div className="analytics-card">
          <h4>Participation Overview</h4>
          <div className="stats-grid">
            <div className="stat">
              <span className="stat-value">{analytics.overview?.totalParticipants || 0}</span>
              <span className="stat-label">Total Participants</span>
            </div>
            <div className="stat">
              <span className="stat-value">{analytics.overview?.averageAttendance || '0%'}</span>
              <span className="stat-label">Average Attendance</span>
            </div>
            <div className="stat">
              <span className="stat-value">{analytics.overview?.completionRate || '0%'}</span>
              <span className="stat-label">Completion Rate</span>
            </div>
          </div>
        </div>

        <div className="analytics-card">
          <h4>Department Breakdown</h4>
          <div className="department-stats">
            {Array.isArray(analytics.participation?.byDepartment) ? (
              analytics.participation.byDepartment.map(dept => (
                <div key={dept.department} className="department-stat">
                  <span className="dept-name">{dept.department}</span>
                  <div className="dept-metrics">
                    <span className="dept-count">{dept.count} participants</span>
                    <span className="dept-attendance">{dept.attendanceRate}% attendance</span>
                  </div>
                </div>
              ))
            ) : (
              <p>No department data available</p>
            )}
          </div>
        </div>

        <div className="analytics-card">
          <h4>Attendance Trends</h4>
          <div className="trend-chart">
            {/* Chart component would go here */}
            <p>Attendance trend chart visualization</p>
          </div>
        </div>

        <div className="analytics-card">
          <h4>Top Performers</h4>
          <div className="top-performers">
            {Array.isArray(analytics.performance?.topParticipants) ? (
              analytics.performance.topParticipants.map(participant => (
                <div key={participant.id || participant._id} className="performer-item">
                  <span className="performer-name">{participant.name}</span>
                  <span className="performer-score">{participant.score}%</span>
                </div>
              ))
            ) : (
              <p>No performance data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <div className="loading">Loading events...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="smart-event-management">
      {!selectedEvent ? (
        // Events List View
        <>
          <div className="page-header">
            <div className="header-left">
              <h1>Smart Event Management</h1>
              <p>Comprehensive event management with participant tracking and analytics</p>
            </div>
            <div className="header-actions">
              <button onClick={handleCreateEvent} className="btn-primary">
                Create Event
              </button>
              <button className="btn-secondary">Import Events</button>
              <button className="btn-secondary">Export Data</button>
            </div>
          </div>

          <div className="view-mode-selector">
            <button 
              className={`view-btn ${viewMode === 'cards' ? 'active' : ''}`}
              onClick={() => setViewMode('cards')}
            >
              Cards View
            </button>
            <button 
              className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
            >
              Table View
            </button>
            <button 
              className={`view-btn ${viewMode === 'analytics' ? 'active' : ''}`}
              onClick={() => setViewMode('analytics')}
            >
              Analytics
            </button>
          </div>

          <div className="advanced-filters">
            <div className="filter-row">
              <div className="filter-group">
                <label>Status</label>
                <select 
                  value={filters.status} 
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="">All Status</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="filter-group">
                <label>Category</label>
                <select 
                  value={filters.category} 
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                >
                  <option value="">All Categories</option>
                  <option value="technical">Technical</option>
                  <option value="workshop">Workshop</option>
                  <option value="seminar">Seminar</option>
                  <option value="cultural">Cultural</option>
                </select>
              </div>
              <div className="filter-group">
                <label>Department</label>
                <select 
                  value={filters.department} 
                  onChange={(e) => handleFilterChange('department', e.target.value)}
                >
                  <option value="">All Departments</option>
                  <option value="CSE">Computer Science</option>
                  <option value="ECE">Electronics</option>
                  <option value="MECH">Mechanical</option>
                </select>
              </div>
              <div className="search-group">
                <label>Search Events</label>
                <input
                  type="text"
                  placeholder="Search by title, description, or venue..."
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>
          </div>

          <div className="events-content">
            {viewMode === 'cards' && (
              <div className="events-grid">
                {Array.isArray(events) && events.length > 0 ? (
                  events.map(renderEventCard)
                ) : (
                  <div className="no-events">
                    <p>No events found</p>
                  </div>
                )}
              </div>
            )}
            {viewMode === 'table' && renderEventTable()}
            {viewMode === 'analytics' && (
              <div className="events-analytics">
                <p>Overall events analytics would go here</p>
              </div>
            )}
          </div>
        </>
      ) : (
        // Event Detail View
        <div className="event-detail-view">
          <div className="event-detail-header">
            <button 
              onClick={() => setSelectedEvent(null)}
              className="btn-secondary back-btn"
            >
              ← Back to Events
            </button>
            <div className="event-title-section">
              <h1>{selectedEvent.title}</h1>
              <p>{selectedEvent.description}</p>
              <div className="event-meta">
                <span className={`status-badge ${selectedEvent.status?.toLowerCase()}`}>
                  {selectedEvent.status}
                </span>
                <span className="event-date">
                  {new Date(selectedEvent.date).toLocaleDateString()}
                </span>
                <span className="event-venue">
                  {selectedEvent.venue && typeof selectedEvent.venue === 'object' 
                    ? selectedEvent.venue.name || 'Venue not specified'
                    : selectedEvent.venue || 'Venue not specified'}
                </span>
              </div>
            </div>
            <div className="event-actions">
              <button onClick={() => handleEditEvent(selectedEvent)} className="btn-primary">
                Edit Event
              </button>
              <button className="btn-secondary">Export Data</button>
            </div>
          </div>

          <div className="event-tabs">
            <button 
              className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button 
              className={`tab-btn ${activeTab === 'participants' ? 'active' : ''}`}
              onClick={() => setActiveTab('participants')}
            >
              Participants ({participants.length})
            </button>
            <button 
              className={`tab-btn ${activeTab === 'attendance' ? 'active' : ''}`}
              onClick={() => setActiveTab('attendance')}
            >
              Attendance
            </button>
            <button 
              className={`tab-btn ${activeTab === 'sessions' ? 'active' : ''}`}
              onClick={() => setActiveTab('sessions')}
            >
              Sessions ({selectedEvent?.sessions?.length || 0})
            </button>
            <button 
              className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('analytics')}
            >
              Analytics
            </button>
          </div>

          <div className="event-tab-content">
            {activeTab === 'overview' && (
              <div className="event-overview">
                <div className="overview-grid">
                  <div className="overview-card">
                    <h3>Event Details</h3>
                    <div className="detail-list">
                      <div className="detail-item">
                        <span className="label">Date:</span>
                        <span>{new Date(selectedEvent.date).toLocaleDateString()}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Time:</span>
                        <span>{selectedEvent.time}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Venue:</span>
                        <span>
                          {selectedEvent.venue && typeof selectedEvent.venue === 'object' 
                            ? selectedEvent.venue.name || 'Venue not specified'
                            : selectedEvent.venue || 'Venue not specified'}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Category:</span>
                        <span>{selectedEvent.category}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Department:</span>
                        <span>{selectedEvent.department}</span>
                      </div>
                    </div>
                  </div>

                  <div className="overview-card">
                    <h3>Quick Stats</h3>
                    <div className="stats-grid">
                      <div className="stat">
                        <span className="stat-value">{participants.length}</span>
                        <span className="stat-label">Participants</span>
                      </div>
                      <div className="stat">
                        <span className="stat-value">{selectedEvent.attendanceRate || '0%'}</span>
                        <span className="stat-label">Attendance Rate</span>
                      </div>
                      <div className="stat">
                        <span className="stat-value">{selectedEvent.sessions?.length || 0}</span>
                        <span className="stat-label">Sessions</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'participants' && renderParticipantsTab()}
            {activeTab === 'attendance' && renderAttendanceTab()}
            {activeTab === 'sessions' && renderSessionsTab()}
            {activeTab === 'analytics' && renderAnalyticsTab()}
          </div>
        </div>
      )}

      {/* Event Form Modal */}
      {showEventForm && (
        <div className="modal-overlay" onClick={() => setShowEventForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingEvent ? 'Edit Event' : 'Create New Event'}</h2>
              <button 
                className="modal-close" 
                onClick={() => setShowEventForm(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>Event form will be implemented here</p>
              <div className="form-actions">
                <button 
                  className="btn-secondary"
                  onClick={() => setShowEventForm(false)}
                >
                  Cancel
                </button>
                <button 
                  className="btn-primary"
                  onClick={() => setShowEventForm(false)}
                >
                  {editingEvent ? 'Update Event' : 'Create Event'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartEventManagement;
