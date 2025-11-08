import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import '../../styles/dashboard.css';

const SessionManagement = ({ onClose, trainerMode = false, facultyMode = false }) => {
  // API URL from environment variable
  const API_URL = import.meta.env.VITE_API_URL || '${API_URL}';
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState('');
  
  const [sessionForm, setSessionForm] = useState({
    eventId: '',
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    venue: '',
    capacity: '',
    sessionType: 'lecture',
    requirements: '',
    materials: '',
    objectives: '',
    duration: ''
  });

  useEffect(() => {
    fetchEvents();
    fetchSessions();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      fetchSessions();
    }
  }, [selectedEvent]);

  const fetchEvents = async () => {
    try {
      const config = {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      };
      
      console.log('Fetching events for session management...');
      const response = await axios.get(`${API_URL}/events`, config);
      console.log('Events API response:', response.data);
      
      // Handle different response formats
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
      
      console.log('Processed events data:', eventsData);
      
      // For trainers, show all events (they can create sessions for any approved event)
      // For more restrictive access, we can filter by coordinator later
      const availableEvents = eventsData.filter(event => 
        event.status === 'approved' || event.status === 'ongoing' || user.role === 'admin'
      );
      
      console.log('Available events for trainer:', availableEvents);
      setEvents(availableEvents);
      
    } catch (err) {
      console.error('Fetch events error:', err);
      setError(`Failed to fetch events: ${err.response?.data?.message || err.message}`);
    }
  };

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const config = {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      };
      
      // If a specific event is selected, fetch sessions for that event
      if (selectedEvent) {
        const response = await axios.get(`${API_URL}/sessions/event/${selectedEvent}`, config);
        console.log('Sessions API response for event:', response.data);
        
        // Handle different response formats
        let sessionsData = [];
        if (response.data) {
          if (Array.isArray(response.data)) {
            sessionsData = response.data;
          } else if (response.data.sessions && Array.isArray(response.data.sessions)) {
            sessionsData = response.data.sessions;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            sessionsData = response.data.data;
          }
        }
        setSessions(sessionsData);
      } else {
        // Fetch all sessions for available events
        const userEvents = events.length > 0 ? events : await getUserEvents();
        let allSessions = [];
        
        for (const event of userEvents) {
          try {
            const response = await axios.get(`${API_URL}/sessions/event/${event._id}`, config);
            console.log(`Sessions for event ${event._id}:`, response.data);
            
            let sessionsData = [];
            if (response.data) {
              if (Array.isArray(response.data)) {
                sessionsData = response.data;
              } else if (response.data.sessions && Array.isArray(response.data.sessions)) {
                sessionsData = response.data.sessions;
              } else if (response.data.data && Array.isArray(response.data.data)) {
                sessionsData = response.data.data;
              }
            }
            
            allSessions = [...allSessions, ...sessionsData];
          } catch (err) {
            console.error(`Error fetching sessions for event ${event._id}:`, err);
          }
        }
        setSessions(allSessions);
      }
    } catch (err) {
      console.error('Fetch sessions error:', err);
      setError(`Failed to fetch sessions: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getUserEvents = async () => {
    try {
      const config = {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      };
      const response = await axios.get('${API_URL}/events', config);
      console.log('User events response:', response.data);
      
      // Handle different response formats
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
      
      // For trainers, show approved/ongoing events
      return eventsData.filter(event => 
        event.status === 'approved' || event.status === 'ongoing' || user.role === 'admin'
      );
    } catch (err) {
      console.error('Error fetching user events:', err);
      return [];
    }
  };

  const handleFormChange = (field, value) => {
    setSessionForm(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-calculate duration when times change
    if (field === 'startTime' || field === 'endTime') {
      const form = { ...sessionForm, [field]: value };
      if (form.startTime && form.endTime) {
        const start = new Date(`2000-01-01T${form.startTime}`);
        const end = new Date(`2000-01-01T${form.endTime}`);
        const diffMs = end - start;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        
        let duration = '';
        if (diffHours > 0) duration += `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
        if (diffMinutes > 0) duration += `${duration ? ' ' : ''}${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
        
        setSessionForm(prev => ({ ...prev, duration }));
      }
    }
  };

  const handleCreateSession = async () => {
    if (!sessionForm.eventId || !sessionForm.title || !sessionForm.date || !sessionForm.startTime || !sessionForm.endTime) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const config = {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      };

      // Get session number for this event
      const existingSessions = sessions.filter(session => session.eventId === sessionForm.eventId);
      const sessionNumber = existingSessions.length + 1;

      // Parse duration from string to minutes
      let durationInMinutes = 60; // default 1 hour
      if (sessionForm.duration) {
        const durationStr = sessionForm.duration.toLowerCase();
        if (durationStr.includes('hour')) {
          const hours = parseFloat(durationStr.match(/(\d+(?:\.\d+)?)/)?.[1] || '1');
          durationInMinutes = hours * 60;
        } else if (durationStr.includes('minute')) {
          durationInMinutes = parseFloat(durationStr.match(/(\d+(?:\.\d+)?)/)?.[1] || '60');
        } else {
          // Try to parse as number (assume minutes)
          durationInMinutes = parseFloat(sessionForm.duration) || 60;
        }
      }

      // Format materials as array of objects
      let materialsArray = [];
      if (sessionForm.materials && sessionForm.materials.trim()) {
        // Split by comma or semicolon and create material objects
        const materialNames = sessionForm.materials.split(/[,;]+/).map(m => m.trim()).filter(m => m);
        materialsArray = materialNames.map(name => ({
          name: name,
          type: 'other',
          url: '',
          uploadedAt: new Date()
        }));
      }

      const sessionData = {
        eventId: sessionForm.eventId,
        number: sessionNumber,
        title: sessionForm.title,
        description: sessionForm.description,
        date: sessionForm.date,
        startTime: sessionForm.startTime,
        endTime: sessionForm.endTime,
        venue: {
          name: sessionForm.venue || 'TBD',
          isOnline: false
        },
        duration: durationInMinutes,
        materials: materialsArray,
        trainer: {
          id: null, // Will be assigned later
          name: '',
          email: ''
        }
      };

      console.log('Creating session with data:', sessionData);
      const response = await axios.post('${API_URL}/sessions', sessionData, config);
      console.log('Create session response:', response.data);
      console.log('Create session response:', response.data);
      
      // Reset form
      setSessionForm({
        eventId: '',
        title: '',
        description: '',
        date: '',
        startTime: '',
        endTime: '',
        venue: '',
        capacity: '',
        sessionType: 'lecture',
        requirements: '',
        materials: '',
        objectives: '',
        duration: ''
      });
      
      setShowCreateSession(false);
      setError('');
      
      // Refresh sessions list
      await fetchSessions();
      alert('Session created successfully!');
    } catch (err) {
      console.error('Create session error:', err);
      setError(`Failed to create session: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleEditSession = (session) => {
    setEditingSession(session);
    setSessionForm({
      eventId: session.eventId,
      title: session.title,
      description: session.description,
      date: session.date,
      startTime: session.startTime,
      endTime: session.endTime,
      venue: typeof session.venue === 'object' ? session.venue?.name || '' : session.venue || '',
      capacity: session.capacity?.toString() || '',
      sessionType: session.sessionType,
      requirements: session.requirements || '',
      materials: Array.isArray(session.materials) 
        ? session.materials.map(m => m.name || m).join(', ')
        : session.materials || '',
      objectives: session.objectives || '',
      duration: session.duration ? `${session.duration} minutes` : ''
    });
    setShowCreateSession(true);
  };

  const handleUpdateSession = async () => {
    if (!editingSession) return;

    try {
      const config = {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      };

      const sessionData = {
        eventId: sessionForm.eventId,
        title: sessionForm.title,
        description: sessionForm.description,
        date: sessionForm.date,
        startTime: sessionForm.startTime,
        endTime: sessionForm.endTime,
        venue: sessionForm.venue,
        capacity: parseInt(sessionForm.capacity) || 0,
        sessionType: sessionForm.sessionType,
        requirements: sessionForm.requirements,
        materials: sessionForm.materials,
        objectives: sessionForm.objectives,
        duration: sessionForm.duration
      };

      console.log('Updating session with data:', sessionData);
      const response = await axios.put(`${API_URL}/sessions/${editingSession._id}`, sessionData, config);
      console.log('Update session response:', response.data);
      
      setShowCreateSession(false);
      setEditingSession(null);
      setSessionForm({
        eventId: '',
        title: '',
        description: '',
        date: '',
        startTime: '',
        endTime: '',
        venue: '',
        capacity: '',
        sessionType: 'lecture',
        requirements: '',
        materials: '',
        objectives: '',
        duration: ''
      });
      
      // Refresh sessions list
      await fetchSessions();
      alert('Session updated successfully!');
    } catch (err) {
      console.error('Update session error:', err);
      setError(`Failed to update session: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (window.confirm('Are you sure you want to delete this session?')) {
      try {
        const config = {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        };

        console.log('Deleting session:', sessionId);
        const response = await axios.delete(`${API_URL}/sessions/${sessionId}`, config);
        console.log('Delete session response:', response.data);
        
        // Refresh sessions list
        await fetchSessions();
        alert('Session deleted successfully!');
      } catch (err) {
        console.error('Delete session error:', err);
        setError(`Failed to delete session: ${err.response?.data?.message || err.message}`);
      }
    }
  };

  const getFilteredSessions = () => {
    if (!selectedEvent) return sessions;
    return sessions.filter(session => session.eventId === selectedEvent);
  };

  const getSessionTypeColor = (type) => {
    const colors = {
      lecture: '#3b82f6',
      practical: '#10b981',
      seminar: '#f59e0b',
      workshop: '#8b5cf6',
      assessment: '#ef4444'
    };
    return colors[type] || '#6b7280';
  };

  const getStatusColor = (status) => {
    const colors = {
      upcoming: '#3b82f6',
      ongoing: '#10b981',
      completed: '#6b7280',
      cancelled: '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const filteredSessions = getFilteredSessions();

  return (
    <div className="session-management">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="page-title">Session Management</h2>
            <p className="page-subtitle">Create and manage training sessions for your events</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button onClick={() => setShowCreateSession(true)} className="btn-primary">
              ➕ Create New Session
            </button>
            <button onClick={onClose} className="btn-secondary">
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#3b82f6', marginBottom: '0.5rem' }}>
              {sessions.length}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Total Sessions</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#10b981', marginBottom: '0.5rem' }}>
              {sessions.filter(s => s.status === 'upcoming').length}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Upcoming Sessions</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#f59e0b', marginBottom: '0.5rem' }}>
              {sessions.reduce((total, session) => total + (session.registrations || 0), 0)}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Total Registrations</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#8b5cf6', marginBottom: '0.5rem' }}>
              {events.length}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Active Events</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-body">
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div className="form-field" style={{ minWidth: '200px' }}>
              <label className="form-label">Filter by Event</label>
              <select
                className="form-select"
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
              >
                <option value="">All Events</option>
                {events.map(event => (
                  <option key={event._id} value={event._id}>{event.title}</option>
                ))}
              </select>
            </div>
            <div style={{ marginLeft: 'auto', fontSize: '0.875rem', color: '#64748b' }}>
              {filteredSessions.length} sessions found
            </div>
          </div>
        </div>
      </div>

      {/* Sessions List */}
      <div className="card">
        <div className="card-body">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner">
                <div className="spinner"></div>
                <p className="loading-text">Loading sessions...</p>
              </div>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
              <h3>No Sessions Found</h3>
              <p>Create your first session to get started with session management.</p>
              <button onClick={() => setShowCreateSession(true)} className="btn-primary" style={{ marginTop: '1rem' }}>
                Create First Session
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredSessions.map(session => (
                <div key={session._id} className="session-card" style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  background: '#ffffff',
                  transition: 'all 0.2s ease'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600', color: '#1e293b' }}>
                          {session.title}
                        </h3>
                        <span 
                          className="badge"
                          style={{ 
                            background: getSessionTypeColor(session.sessionType),
                            color: 'white',
                            fontSize: '0.75rem'
                          }}
                        >
                          {session.sessionType}
                        </span>
                        <span 
                          className="badge"
                          style={{ 
                            background: getStatusColor(session.status),
                            color: 'white',
                            fontSize: '0.75rem'
                          }}
                        >
                          {session.status}
                        </span>
                      </div>
                      <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: '#475569' }}>
                        {session.description}
                      </p>
                      <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.75rem' }}>
                        <strong>Event:</strong> {session.eventId && events.find(e => e._id === session.eventId)?.title || session.eventTitle || 'Unknown Event'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        onClick={() => handleEditSession(session)}
                        className="btn-sm btn-secondary"
                        title="Edit Session"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => handleDeleteSession(session._id)}
                        className="btn-sm btn-danger"
                        title="Delete Session"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>Date & Time</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                        {formatDate(session.date)}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                        {formatTime(session.startTime)} - {formatTime(session.endTime)}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        Duration: {session.duration}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>Venue & Capacity</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                        {typeof session.venue === 'object' 
                          ? session.venue?.name || 'TBD'
                          : session.venue || 'TBD'
                        }
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                        Capacity: {session.capacity}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: session.registrations >= session.capacity * 0.8 ? '#ef4444' : '#10b981' }}>
                        Registered: {session.registrations || 0}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>Requirements</div>
                      <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                        {session.requirements || 'None specified'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>Materials</div>
                      <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                        {session.materials && Array.isArray(session.materials) && session.materials.length > 0
                          ? session.materials.map(material => material.name || material).join(', ')
                          : 'None specified'}
                      </div>
                    </div>
                  </div>

                  {session.objectives && (
                    <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '6px', marginTop: '1rem' }}>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>Learning Objectives</div>
                      <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                        {session.objectives}
                      </div>
                    </div>
                  )}

                  {/* Progress bar for registrations */}
                  <div style={{ marginTop: '1rem' }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '0.5rem'
                    }}>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        Registration Progress
                      </span>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        {((session.registrations / session.capacity) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div style={{ 
                      width: '100%', 
                      height: '6px', 
                      background: '#f1f5f9', 
                      borderRadius: '3px',
                      overflow: 'hidden'
                    }}>
                      <div style={{ 
                        width: `${(session.registrations / session.capacity) * 100}%`,
                        height: '100%',
                        background: session.registrations >= session.capacity ? '#ef4444' : '#3b82f6',
                        borderRadius: '3px',
                        transition: 'width 0.3s ease'
                      }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Session Modal */}
      {showCreateSession && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '800px', maxHeight: '90vh' }}>
            <div className="modal-header">
              <h3>{editingSession ? 'Edit Session' : 'Create New Session'}</h3>
              <button 
                onClick={() => {
                  setShowCreateSession(false);
                  setEditingSession(null);
                  setSessionForm({
                    eventId: '',
                    title: '',
                    description: '',
                    date: '',
                    startTime: '',
                    endTime: '',
                    venue: '',
                    capacity: '',
                    sessionType: 'lecture',
                    requirements: '',
                    materials: '',
                    objectives: '',
                    duration: ''
                  });
                }}
                className="btn-secondary"
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-field">
                  <label className="form-label">Event *</label>
                  <select
                    className="form-select"
                    value={sessionForm.eventId}
                    onChange={(e) => handleFormChange('eventId', e.target.value)}
                    required
                  >
                    <option value="">Select Event</option>
                    {events.map(event => (
                      <option key={event._id} value={event._id}>{event.title}</option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label">Session Type</label>
                  <select
                    className="form-select"
                    value={sessionForm.sessionType}
                    onChange={(e) => handleFormChange('sessionType', e.target.value)}
                  >
                    <option value="lecture">Lecture</option>
                    <option value="practical">Practical</option>
                    <option value="seminar">Seminar</option>
                    <option value="workshop">Workshop</option>
                    <option value="assessment">Assessment</option>
                  </select>
                </div>
              </div>

              <div className="form-field" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Session Title *</label>
                <input
                  type="text"
                  className="form-input"
                  value={sessionForm.title}
                  onChange={(e) => handleFormChange('title', e.target.value)}
                  placeholder="Enter session title"
                  required
                />
              </div>

              <div className="form-field" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  value={sessionForm.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  placeholder="Enter session description"
                  rows="3"
                ></textarea>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-field">
                  <label className="form-label">Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={sessionForm.date}
                    onChange={(e) => handleFormChange('date', e.target.value)}
                    required
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Start Time *</label>
                  <input
                    type="time"
                    className="form-input"
                    value={sessionForm.startTime}
                    onChange={(e) => handleFormChange('startTime', e.target.value)}
                    required
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">End Time *</label>
                  <input
                    type="time"
                    className="form-input"
                    value={sessionForm.endTime}
                    onChange={(e) => handleFormChange('endTime', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-field">
                  <label className="form-label">Venue</label>
                  <input
                    type="text"
                    className="form-input"
                    value={sessionForm.venue}
                    onChange={(e) => handleFormChange('venue', e.target.value)}
                    placeholder="Enter venue"
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Capacity</label>
                  <input
                    type="number"
                    className="form-input"
                    value={sessionForm.capacity}
                    onChange={(e) => handleFormChange('capacity', e.target.value)}
                    placeholder="Enter capacity"
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Duration</label>
                  <input
                    type="text"
                    className="form-input"
                    value={sessionForm.duration}
                    onChange={(e) => handleFormChange('duration', e.target.value)}
                    placeholder="Auto-calculated"
                    readOnly
                  />
                </div>
              </div>

              <div className="form-field" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Requirements</label>
                <textarea
                  className="form-input"
                  value={sessionForm.requirements}
                  onChange={(e) => handleFormChange('requirements', e.target.value)}
                  placeholder="Enter prerequisites or requirements"
                  rows="2"
                ></textarea>
              </div>

              <div className="form-field" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Materials</label>
                <textarea
                  className="form-input"
                  value={sessionForm.materials}
                  onChange={(e) => handleFormChange('materials', e.target.value)}
                  placeholder="Enter required materials or resources"
                  rows="2"
                ></textarea>
              </div>

              <div className="form-field" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Learning Objectives</label>
                <textarea
                  className="form-input"
                  value={sessionForm.objectives}
                  onChange={(e) => handleFormChange('objectives', e.target.value)}
                  placeholder="Enter learning objectives for this session"
                  rows="3"
                ></textarea>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                onClick={() => {
                  setShowCreateSession(false);
                  setEditingSession(null);
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button 
                onClick={editingSession ? handleUpdateSession : handleCreateSession}
                className="btn-primary"
              >
                {editingSession ? 'Update Session' : 'Create Session'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div style={{ 
          position: 'fixed', 
          bottom: '20px', 
          right: '20px', 
          background: '#fef2f2', 
          border: '1px solid #fecaca',
          color: '#dc2626',
          padding: '1rem',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          zIndex: 1000
        }}>
          {error}
          <button 
            onClick={() => setError('')}
            style={{ marginLeft: '1rem', background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default SessionManagement;
