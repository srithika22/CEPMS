import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import axios from 'axios';
import '../../styles/facultyDashboard.css';

const FacultyDashboard = () => {
  const { user } = useAuth();
  const { emitEventCreated, emitEventUpdated, emitEventDeleted } = useSocket();
  const [activeSection, setActiveSection] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Data states
  const [myEvents, setMyEvents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [analytics, setAnalytics] = useState({});
  
  // Modal states
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [editingSession, setEditingSession] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState('');
  
  // Form states
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    category: 'workshop',
    type: 'Technical',
    startDate: '',
    endDate: '',
    venue: '',
    capacity: '',
    department: user?.faculty?.department || 'Computer Science',
    materials: '',
    prerequisites: '',
    registration: {
      required: true,
      startDate: '',
      endDate: '',
      maxParticipants: ''
    }
  });

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

  // Stats state
  const [stats, setStats] = useState({
    totalEvents: 0,
    pendingApproval: 0,
    approvedEvents: 0,
    totalParticipants: 0,
    avgAttendance: 0,
    upcomingSessions: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchMyEvents(),
        fetchSessions(),
        fetchAnalytics()
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyEvents = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      // Fetch events where user is coordinator
      const response = await axios.get('http://localhost:5000/api/events/my-events', config);
      const events = response.data?.data || response.data || [];
      setMyEvents(events);

      // Calculate stats
      const pendingCount = events.filter(e => e.status === 'pending').length;
      const approvedCount = events.filter(e => e.status === 'approved').length;
      const totalParticipants = events.reduce((sum, e) => sum + (e.registration?.currentCount || 0), 0);

      setStats(prev => ({
        ...prev,
        totalEvents: events.length,
        pendingApproval: pendingCount,
        approvedEvents: approvedCount,
        totalParticipants
      }));
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const fetchSessions = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      let allSessions = [];
      for (const event of myEvents) {
        try {
          const response = await axios.get(`http://localhost:5000/api/sessions/event/${event._id}`, config);
          const eventSessions = response.data?.data || response.data || [];
          allSessions = [...allSessions, ...eventSessions];
        } catch (err) {
          console.warn(`No sessions found for event ${event._id}`);
        }
      }
      
      setSessions(allSessions);
      
      const upcomingCount = allSessions.filter(s => 
        new Date(s.date) > new Date() && s.status !== 'cancelled'
      ).length;

      setStats(prev => ({ ...prev, upcomingSessions: upcomingCount }));
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      // Fetch department analytics
      const response = await axios.get(`http://localhost:5000/api/events/analytics/department/${user.faculty?.department}`, config);
      setAnalytics(response.data?.data || {});
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const eventData = {
        ...eventForm,
        coordinator: {
          id: user._id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          phone: user.phone,
          department: user.faculty?.department
        }
      };

      const response = await axios.post('http://localhost:5000/api/events', eventData, config);
      
      if (response.data) {
        emitEventCreated(response.data);
        setShowCreateEvent(false);
        resetEventForm();
        fetchMyEvents();
        alert('Event created successfully! It is pending admin approval.');
      }
    } catch (error) {
      console.error('Error creating event:', error);
      setError(error.response?.data?.message || 'Failed to create event');
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Auto-calculate session number
      const eventSessions = sessions.filter(s => s.eventId === sessionForm.eventId);
      const sessionNumber = eventSessions.length + 1;

      const sessionData = {
        ...sessionForm,
        number: sessionNumber,
        capacity: parseInt(sessionForm.capacity) || 50,
        trainer: {
          id: user._id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email
        }
      };

      const response = await axios.post('http://localhost:5000/api/sessions', sessionData, config);
      
      if (response.data) {
        setShowCreateSession(false);
        resetSessionForm();
        fetchSessions();
        alert('Session created successfully!');
      }
    } catch (error) {
      console.error('Error creating session:', error);
      setError(error.response?.data?.message || 'Failed to create session');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      await axios.delete(`http://localhost:5000/api/events/${eventId}`, config);
      fetchMyEvents();
      alert('Event deleted successfully!');
    } catch (error) {
      console.error('Error deleting event:', error);
      setError(error.response?.data?.message || 'Failed to delete event');
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to delete this session?')) return;

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      await axios.delete(`http://localhost:5000/api/sessions/${sessionId}`, config);
      fetchSessions();
      alert('Session deleted successfully!');
    } catch (error) {
      console.error('Error deleting session:', error);
      setError(error.response?.data?.message || 'Failed to delete session');
    }
  };

  const resetEventForm = () => {
    setEventForm({
      title: '',
      description: '',
      category: 'workshop',
      type: 'Technical',
      startDate: '',
      endDate: '',
      venue: '',
      capacity: '',
      department: user?.faculty?.department || 'Computer Science',
      materials: '',
      prerequisites: '',
      registration: {
        required: true,
        startDate: '',
        endDate: '',
        maxParticipants: ''
      }
    });
    setEditingEvent(null);
  };

  const resetSessionForm = () => {
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
    setEditingSession(null);
  };

  const getStatusBadgeClass = (status) => {
    const classes = {
      pending: 'status-pending',
      approved: 'status-approved',
      ongoing: 'status-ongoing',
      completed: 'status-completed',
      cancelled: 'status-cancelled',
      rejected: 'status-rejected'
    };
    return classes[status] || 'status-default';
  };

  const renderOverview = () => (
    <div className="faculty-overview">
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon">📚</div>
          <div className="stat-content">
            <h3>Total Events</h3>
            <p className="stat-number">{stats.totalEvents}</p>
            <span className="stat-trend">Your organized events</span>
          </div>
        </div>
        
        <div className="stat-card warning">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>Pending Approval</h3>
            <p className="stat-number">{stats.pendingApproval}</p>
            <span className="stat-trend">Awaiting admin approval</span>
          </div>
        </div>
        
        <div className="stat-card success">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>Approved Events</h3>
            <p className="stat-number">{stats.approvedEvents}</p>
            <span className="stat-trend">Ready for registration</span>
          </div>
        </div>
        
        <div className="stat-card info">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Total Participants</h3>
            <p className="stat-number">{stats.totalParticipants}</p>
            <span className="stat-trend">Across all events</span>
          </div>
        </div>

        <div className="stat-card secondary">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <h3>Upcoming Sessions</h3>
            <p className="stat-number">{stats.upcomingSessions}</p>
            <span className="stat-trend">Sessions to conduct</span>
          </div>
        </div>
        
        <div className="stat-card accent">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>Avg Attendance</h3>
            <p className="stat-number">{stats.avgAttendance || 0}%</p>
            <span className="stat-trend">Department average</span>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="action-buttons">
          <button 
            className="btn-primary"
            onClick={() => setShowCreateEvent(true)}
          >
            📝 Create Event
          </button>
          <button 
            className="btn-secondary"
            onClick={() => setActiveSection('events')}
          >
            📚 Manage Events
          </button>
          <button 
            className="btn-secondary"
            onClick={() => setActiveSection('sessions')}
          >
            🎯 Manage Sessions
          </button>
          <button 
            className="btn-secondary"
            onClick={() => setActiveSection('participants')}
          >
            👥 View Participants
          </button>
          <button 
            className="btn-secondary"
            onClick={() => setActiveSection('analytics')}
          >
            📊 View Analytics
          </button>
        </div>
      </div>

      <div className="recent-activity">
        <div className="activity-section">
          <h3>Recent Events</h3>
          <div className="events-preview">
            {myEvents.slice(0, 3).map(event => (
              <div key={event._id} className="event-preview">
                <div className="event-info">
                  <h4>{event.title}</h4>
                  <p>{new Date(event.startDate).toLocaleDateString()}</p>
                  <span className={`status-badge ${getStatusBadgeClass(event.status)}`}>
                    {event.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="activity-section">
          <h3>Upcoming Sessions</h3>
          <div className="sessions-preview">
            {sessions
              .filter(s => new Date(s.date) > new Date())
              .slice(0, 3)
              .map(session => (
                <div key={session._id} className="session-preview">
                  <div className="session-info">
                    <h4>{session.title}</h4>
                    <p>{new Date(session.date).toLocaleDateString()} at {session.startTime}</p>
                    <span className="session-type">{session.sessionType}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderEvents = () => (
    <div className="events-section">
      <div className="section-header">
        <h3>My Events</h3>
        <button 
          className="btn-primary"
          onClick={() => setShowCreateEvent(true)}
        >
          Create New Event
        </button>
      </div>
      
      <div className="events-grid">
        {myEvents.map(event => (
          <div key={event._id} className="event-card">
            <div className="event-header">
              <h4>{event.title}</h4>
              <span className={`status-badge ${getStatusBadgeClass(event.status)}`}>
                {event.status}
              </span>
            </div>
            <p className="event-description">{event.description}</p>
            
            <div className="event-details">
              <div className="detail-row">
                <span className="label">Start Date:</span>
                <span>{new Date(event.startDate).toLocaleDateString()}</span>
              </div>
              <div className="detail-row">
                <span className="label">End Date:</span>
                <span>{new Date(event.endDate).toLocaleDateString()}</span>
              </div>
              <div className="detail-row">
                <span className="label">Venue:</span>
                <span>{event.venue || 'TBD'}</span>
              </div>
              <div className="detail-row">
                <span className="label">Participants:</span>
                <span>{event.registration?.currentCount || 0} / {event.registration?.maxParticipants || event.capacity}</span>
              </div>
            </div>

            <div className="event-actions">
              <button 
                className="btn-outline"
                onClick={() => {
                  setSelectedEvent(event._id);
                  setActiveSection('sessions');
                }}
              >
                Manage Sessions
              </button>
              <button 
                className="btn-outline"
                onClick={() => {
                  setEditingEvent(event);
                  setEventForm({
                    ...event,
                    startDate: new Date(event.startDate).toISOString().split('T')[0],
                    endDate: new Date(event.endDate).toISOString().split('T')[0]
                  });
                  setShowCreateEvent(true);
                }}
              >
                Edit
              </button>
              <button 
                className="btn-outline error"
                onClick={() => handleDeleteEvent(event._id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSessions = () => (
    <div className="sessions-section">
      <div className="section-header">
        <h3>Session Management</h3>
        <div className="header-actions">
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="event-filter"
          >
            <option value="">All Events</option>
            {myEvents.map(event => (
              <option key={event._id} value={event._id}>{event.title}</option>
            ))}
          </select>
          <button 
            className="btn-primary"
            onClick={() => setShowCreateSession(true)}
            disabled={myEvents.filter(e => e.status === 'approved').length === 0}
          >
            Create Session
          </button>
        </div>
      </div>
      
      <div className="sessions-grid">
        {sessions
          .filter(session => !selectedEvent || session.eventId === selectedEvent)
          .map(session => {
            const event = myEvents.find(e => e._id === session.eventId);
            return (
              <div key={session._id} className="session-card">
                <div className="session-header">
                  <h4>{session.title}</h4>
                  <span className={`session-type ${session.sessionType}`}>
                    {session.sessionType}
                  </span>
                </div>
                
                <div className="session-info">
                  <p className="event-name">Event: {event?.title}</p>
                  <p className="session-description">{session.description}</p>
                </div>
                
                <div className="session-details">
                  <div className="detail-row">
                    <span className="label">Date:</span>
                    <span>{new Date(session.date).toLocaleDateString()}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Time:</span>
                    <span>{session.startTime} - {session.endTime}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Venue:</span>
                    <span>{session.venue || 'TBD'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Capacity:</span>
                    <span>{session.capacity}</span>
                  </div>
                </div>

                <div className="session-actions">
                  <button 
                    className="btn-outline"
                    onClick={() => {
                      setEditingSession(session);
                      setSessionForm({
                        ...session,
                        date: new Date(session.date).toISOString().split('T')[0]
                      });
                      setShowCreateSession(true);
                    }}
                  >
                    Edit
                  </button>
                  <button 
                    className="btn-outline error"
                    onClick={() => handleDeleteSession(session._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="analytics-section">
      <h3>Faculty Analytics</h3>
      <div className="analytics-grid">
        <div className="analytics-card">
          <h4>Department Performance</h4>
          <div className="analytics-content">
            <p>Participation Rate: {analytics.overview?.participationRate || 0}%</p>
            <p>Average Attendance: {analytics.overview?.avgAttendanceRate || 0}%</p>
            <p>Total Events: {analytics.overview?.totalEvents || 0}</p>
          </div>
        </div>
        
        <div className="analytics-card">
          <h4>Top Performing Events</h4>
          <div className="analytics-content">
            {analytics.topEvents?.slice(0, 3).map((event, index) => (
              <div key={index} className="top-event">
                <p>{event._id?.title}</p>
                <span>{event.participantCount} participants</span>
              </div>
            )) || <p>No data available</p>}
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading faculty dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="faculty-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Faculty Dashboard</h1>
          <p className="dashboard-subtitle">
            Welcome, {user.firstName} {user.lastName} | {user.faculty?.department} Department
          </p>
        </div>
      </div>

      <div className="dashboard-nav">
        <button 
          className={`nav-button ${activeSection === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveSection('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={`nav-button ${activeSection === 'events' ? 'active' : ''}`}
          onClick={() => setActiveSection('events')}
        >
          📚 My Events
        </button>
        <button 
          className={`nav-button ${activeSection === 'sessions' ? 'active' : ''}`}
          onClick={() => setActiveSection('sessions')}
        >
          🎯 Sessions
        </button>
        <button 
          className={`nav-button ${activeSection === 'participants' ? 'active' : ''}`}
          onClick={() => setActiveSection('participants')}
        >
          👥 Participants
        </button>
        <button 
          className={`nav-button ${activeSection === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveSection('analytics')}
        >
          📊 Analytics
        </button>
      </div>

      <div className="dashboard-content">
        {activeSection === 'overview' && renderOverview()}
        {activeSection === 'events' && renderEvents()}
        {activeSection === 'sessions' && renderSessions()}
        {activeSection === 'participants' && <div>Participants management coming soon...</div>}
        {activeSection === 'analytics' && renderAnalytics()}
      </div>
            <h3>Upcoming Events</h3>
            <p className="count">
              {myEvents.filter(e => new Date(e.startDate) > new Date()).length}
            </p>
            <span>Future events</span>
          </div>
          <div className="overview-card">
            <h3>Draft Events</h3>
            <p className="count">
              {myEvents.filter(e => e.status === 'draft').length}
            </p>
            <span>Pending publication</span>
          </div>
        </div>
      </div>

      <div className="main-actions">
        <div className="action-header">
          <h2>Event Management</h2>
          <button className="btn-primary">
            <span>+</span> Create New Event
          </button>
        </div>

        <div className="events-section">
          <h3>My Recent Events</h3>
          {myEvents.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📅</div>
              <h3>No events created yet</h3>
              <p>Create your first event to start managing programs</p>
              <button className="btn-primary">Create Event</button>
            </div>
          ) : (
            <div className="events-list">
              {myEvents.map(event => (
                <div key={event._id} className="event-item">
                  <div className="event-info">
                    <h4>{event.title}</h4>
                    <p className="event-meta">
                      {new Date(event.startDate).toLocaleDateString()} • {event.venue}
                    </p>
                    <span className={`status-badge ${event.status}`}>
                      {event.status}
                    </span>
                  </div>
                  
                  <div className="event-stats">
                    <div className="stat">
                      <span className="count">{event.registrations?.length || 0}</span>
                      <span className="label">Registered</span>
                    </div>
                    <div className="stat">
                      <span className="count">{event.maxParticipants || '∞'}</span>
                      <span className="label">Capacity</span>
                    </div>
                  </div>
                  
                  <div className="event-actions">
                    <button className="btn-outline">Edit</button>
                    <button className="btn-outline">View</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="faculty-tools">
        <h2>Faculty Tools</h2>
        <div className="tools-grid">
          <div className="tool-card">
            <div className="tool-icon">📊</div>
            <h3>Event Analytics</h3>
            <p>View detailed analytics and reports for your events</p>
            <button className="btn-outline">View Analytics</button>
          </div>
          
          <div className="tool-card">
            <div className="tool-icon">👥</div>
            <h3>Participant Management</h3>
            <p>Manage registrations and participant communications</p>
            <button className="btn-outline">Manage Participants</button>
          </div>
          
          <div className="tool-card">
            <div className="tool-icon">📋</div>
            <h3>Attendance Tracking</h3>
            <p>Track and manage event attendance records</p>
            <button className="btn-outline">Track Attendance</button>
          </div>
          
          <div className="tool-card">
            <div className="tool-icon">💬</div>
            <h3>Feedback Management</h3>
            <p>Collect and analyze participant feedback</p>
            <button className="btn-outline">View Feedback</button>
          </div>
          
          <div className="tool-card">
            <div className="tool-icon">📧</div>
            <h3>Communication Hub</h3>
            <p>Send announcements and updates to participants</p>
            <button className="btn-outline">Send Messages</button>
          </div>
          
          <div className="tool-card">
            <div className="tool-icon">📅</div>
            <h3>Calendar Integration</h3>
            <p>Sync events with external calendar systems</p>
            <button className="btn-outline">Sync Calendar</button>
          </div>
        </div>
      </div>

      <div className="recent-activity">
        <h2>Recent Activity</h2>
        <div className="activity-list">
          <div className="activity-item">
            <div className="activity-icon">✅</div>
            <div className="activity-content">
              <p><strong>Event Published:</strong> "Machine Learning Workshop"</p>
              <span className="activity-time">2 hours ago</span>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon">👤</div>
            <div className="activity-content">
              <p><strong>New Registration:</strong> John Doe joined "Web Development Seminar"</p>
              <span className="activity-time">5 hours ago</span>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon">📝</div>
            <div className="activity-content">
              <p><strong>Event Updated:</strong> "Database Design Course" details modified</p>
              <span className="activity-time">1 day ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboard;