import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import SessionManagement from '../trainer/SessionManagement';
import EventDetail from '../events/EventDetail';
import '../../styles/smartEventManagement.css';

const EnhancedFacultyDashboard = () => {
  const { user, logout } = useAuth();
  const { socket } = useSocket();

  // State management
  const [activeSection, setActiveSection] = useState('overview');
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [myEvents, setMyEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [trainers, setTrainers] = useState([]);
  
  // Event detail modal states
  const [showEventDetail, setShowEventDetail] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [stats, setStats] = useState({
    totalEvents: 0,
    pendingApproval: 0,
    approvedEvents: 0,
    totalParticipants: 0,
    upcomingSessions: 0,
    avgAttendance: 0
  });

  // Modal states
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [editingEvent, setEditingEvent] = useState(null);
  const [editingSession, setEditingSession] = useState(null);

  // Form states
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    category: '',
    type: 'academic',
    startDate: '',
    endDate: '',
    venue: '',
    capacity: '',
    prerequisites: ''
  });

  const [sessionForm, setSessionForm] = useState({
    eventId: '',
    number: 1,
    title: '',
    description: '',
    sessionType: '',
    date: '',
    startTime: '',
    endTime: '',
    duration: 60,
    trainer: {
      id: '',
      name: '',
      email: ''
    },
    venue: {
      name: '',
      isOnline: false,
      meetingLink: ''
    },
    materials: [],
    capacity: ''
  });

  // API URL
  const API_BASE = 'http://localhost:5000/api';

  // Utility functions
  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'approved': return 'status-approved';
      case 'pending': return 'status-pending';
      case 'rejected': return 'status-rejected';
      default: return 'status-draft';
    }
  };

  const getSessionStatus = (session) => {
    const sessionDate = new Date(session.date);
    const now = new Date();
    
    if (sessionDate > now) return 'upcoming';
    if (sessionDate.toDateString() === now.toDateString()) return 'ongoing';
    return 'completed';
  };

  // Event detail handlers
  const openEventDetail = (eventId) => {
    setSelectedEventId(eventId);
    setShowEventDetail(true);
  };

  const closeEventDetail = () => {
    setShowEventDetail(false);
    setSelectedEventId(null);
  };

  const calculateAverageAttendance = () => {
    const relevantSessions = sessions.filter(s => 
      (!selectedEvent || s.eventId === selectedEvent) && 
      new Date(s.date) < new Date()
    );
    
    if (relevantSessions.length === 0) return 0;
    
    const totalAttendancePercentage = relevantSessions.reduce((total, session) => {
      const attendance = attendanceData.find(a => a.sessionId === session._id);
      if (attendance && attendance.totalParticipants > 0) {
        return total + ((attendance.presentCount / attendance.totalParticipants) * 100);
      }
      return total;
    }, 0);
    
    return (totalAttendancePercentage / relevantSessions.length).toFixed(1);
  };

  const getTotalParticipants = () => {
    const relevantSessions = sessions.filter(s => !selectedEvent || s.eventId === selectedEvent);
    const uniqueParticipants = new Set();
    
    relevantSessions.forEach(session => {
      const attendance = attendanceData.find(a => a.sessionId === session._id);
      if (attendance && attendance.participants) {
        attendance.participants.forEach(p => uniqueParticipants.add(p.userId));
      }
    });
    
    return uniqueParticipants.size;
  };

  const fetchMyEvents = async () => {
    try {
      const response = await axios.get(`${API_BASE}/events/my-events`, getAuthHeaders());
      const eventsData = response.data?.data || response.data || [];
      setMyEvents(Array.isArray(eventsData) ? eventsData : []);
    } catch (error) {
      console.error('Error fetching my events:', error);
      setMyEvents([]);
    }
  };

  const fetchAllEvents = async () => {
    try {
      const response = await axios.get(`${API_BASE}/events`, getAuthHeaders());
      const eventsData = response.data?.data || response.data || [];
      setAllEvents(Array.isArray(eventsData) ? eventsData : []);
    } catch (error) {
      console.error('Error fetching all events:', error);
      setAllEvents([]);
    }
  };

  const fetchSessions = async () => {
    try {
      // Try different endpoints for sessions
      let response;
      try {
        response = await axios.get(`${API_BASE}/sessions`, getAuthHeaders());
      } catch (sessionError) {
        if (sessionError.response?.status === 403) {
          // Try coordinator endpoint if regular sessions endpoint is forbidden
          response = await axios.get(`${API_BASE}/sessions/coordinator`, getAuthHeaders());
        } else {
          throw sessionError;
        }
      }
      const sessionsData = response.data?.data || response.data || [];
      setSessions(Array.isArray(sessionsData) ? sessionsData : []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setSessions([]);
    }
  };

  const fetchAttendanceData = async () => {
    try {
      // Try different endpoints for attendance
      let response;
      try {
        response = await axios.get(`${API_BASE}/attendance/faculty`, getAuthHeaders());
      } catch (attendanceError) {
        if (attendanceError.response?.status === 404) {
          // Try general attendance endpoint if faculty-specific doesn't exist
          response = await axios.get(`${API_BASE}/attendance`, getAuthHeaders());
        } else {
          throw attendanceError;
        }
      }
      const attendanceDataResponse = response.data?.data || response.data || [];
      setAttendanceData(Array.isArray(attendanceDataResponse) ? attendanceDataResponse : []);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      setAttendanceData([]);
    }
  };

  const fetchAnalytics = async () => {
    try {
      // Try different endpoints for analytics
      let response;
      try {
        response = await axios.get(`${API_BASE}/analytics/faculty`, getAuthHeaders());
      } catch (analyticsError) {
        if (analyticsError.response?.status === 404) {
          // Try general analytics endpoint if faculty-specific doesn't exist
          response = await axios.get(`${API_BASE}/analytics`, getAuthHeaders());
        } else {
          throw analyticsError;
        }
      }
      setAnalytics(response.data?.data || response.data || {});
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setAnalytics({});
    }
  };

  const fetchTrainers = async () => {
    try {
      // Try to fetch trainers, but handle gracefully if endpoint doesn't exist
      let response;
      try {
        response = await axios.get(`${API_BASE}/users/trainers`, getAuthHeaders());
      } catch (trainersError) {
        if (trainersError.response?.status === 404) {
          // If trainers endpoint doesn't exist, create a fallback with example trainers
          setTrainers([
            { _id: 'trainer1', firstName: 'John', lastName: 'Trainer', email: 'trainer1@example.com' },
            { _id: 'trainer2', firstName: 'Jane', lastName: 'Smith', email: 'trainer2@example.com' }
          ]);
          return;
        } else {
          throw trainersError;
        }
      }
      const trainersData = response.data?.data || response.data || [];
      setTrainers(Array.isArray(trainersData) ? trainersData : []);
    } catch (error) {
      console.error('Error fetching trainers:', error);
      setTrainers([]);
    }
  };

  const calculateStats = () => {
    const myEventsArray = Array.isArray(myEvents) ? myEvents : [];
    const sessionsArray = Array.isArray(sessions) ? sessions : [];
    
    const totalEvents = myEventsArray.length;
    const pendingApproval = myEventsArray.filter(e => e.status === 'pending').length;
    const approvedEvents = myEventsArray.filter(e => e.status === 'approved').length;
    const totalParticipants = myEventsArray.reduce((total, event) => 
      total + (event.registration?.currentCount || 0), 0);
    const upcomingSessions = sessionsArray.filter(s => 
      new Date(s.date) > new Date()).length;

    setStats({
      totalEvents,
      pendingApproval,
      approvedEvents,
      totalParticipants,
      upcomingSessions,
      avgAttendance: analytics.overview?.avgAttendanceRate || 0
    });
  };

  // Event handlers
  const handleEventInputChange = (e) => {
    const { name, value } = e.target;
    setEventForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSessionInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'trainerId') {
      // Handle trainer selection
      const selectedTrainer = trainers.find(trainer => trainer._id === value);
      setSessionForm(prev => ({
        ...prev,
        trainer: selectedTrainer ? {
          id: selectedTrainer._id,
          name: `${selectedTrainer.firstName} ${selectedTrainer.lastName}`,
          email: selectedTrainer.email
        } : { id: '', name: '', email: '' }
      }));
    } else if (name === 'venue.name') {
      setSessionForm(prev => ({
        ...prev,
        venue: {
          ...prev.venue,
          name: value
        }
      }));
    } else if (name === 'venue.isOnline') {
      setSessionForm(prev => ({
        ...prev,
        venue: {
          ...prev.venue,
          isOnline: value === 'true',
          meetingLink: value === 'true' ? prev.venue.meetingLink : ''
        }
      }));
    } else if (name === 'venue.meetingLink') {
      setSessionForm(prev => ({
        ...prev,
        venue: {
          ...prev.venue,
          meetingLink: value
        }
      }));
    } else {
      setSessionForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      const eventData = {
        ...eventForm,
        coordinatorId: user._id,
        facultyId: user._id
      };

      if (editingEvent) {
        await axios.put(`${API_BASE}/events/${editingEvent._id}`, eventData, getAuthHeaders());
      } else {
        await axios.post(`${API_BASE}/events`, eventData, getAuthHeaders());
      }

      setShowCreateEvent(false);
      setEditingEvent(null);
      setEventForm({
        title: '',
        description: '',
        category: '',
        type: 'academic',
        startDate: '',
        endDate: '',
        venue: '',
        capacity: '',
        prerequisites: ''
      });
      
      await fetchMyEvents();
      await fetchAllEvents();
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Error saving event. Please try again.');
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    try {
      const sessionData = {
        ...sessionForm,
        coordinatorId: user._id
      };

      if (editingSession) {
        await axios.put(`${API_BASE}/sessions/${editingSession._id}`, sessionData, getAuthHeaders());
      } else {
        await axios.post(`${API_BASE}/sessions`, sessionData, getAuthHeaders());
      }

      setShowCreateSession(false);
      setEditingSession(null);
      setSessionForm({
        eventId: '',
        number: 1,
        title: '',
        description: '',
        sessionType: '',
        date: '',
        startTime: '',
        endTime: '',
        duration: 60,
        trainer: {
          id: '',
          name: '',
          email: ''
        },
        venue: {
          name: '',
          isOnline: false,
          meetingLink: ''
        },
        materials: [],
        capacity: ''
      });
      
      await fetchSessions();
    } catch (error) {
      console.error('Error saving session:', error);
      alert('Error saving session. Please try again.');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await axios.delete(`${API_BASE}/events/${eventId}`, getAuthHeaders());
        await fetchMyEvents();
        await fetchAllEvents();
      } catch (error) {
        console.error('Error deleting event:', error);
        alert('Error deleting event.');
      }
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (window.confirm('Are you sure you want to delete this session?')) {
      try {
        await axios.delete(`${API_BASE}/sessions/${sessionId}`, getAuthHeaders());
        await fetchSessions();
      } catch (error) {
        console.error('Error deleting session:', error);
        alert('Error deleting session.');
      }
    }
  };

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchMyEvents(),
          fetchAllEvents(),
          fetchSessions(),
          fetchAttendanceData(),
          fetchAnalytics(),
          fetchTrainers()
        ]);
      } catch (error) {
        console.error('Error initializing data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      initializeData();
    }
  }, [user]);

  // Update stats when data changes
  useEffect(() => {
    if (myEvents.length > 0 || sessions.length > 0) {
      calculateStats();
    }
  }, [myEvents, sessions, analytics]);

  // Render functions
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
            onClick={() => setActiveSection('all-events')}
          >
            📋 All Events
          </button>
          <button 
            className="btn-secondary"
            onClick={() => setActiveSection('events')}
          >
            📚 My Events
          </button>
          <button 
            className="btn-secondary"
            onClick={() => setActiveSection('sessions')}
          >
            🎯 Manage Sessions
          </button>
          <button 
            className="btn-secondary"
            onClick={() => setActiveSection('attendance')}
          >
            ✅ View Attendance
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
            {Array.isArray(myEvents) && myEvents.slice(0, 3).map(event => (
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
            {(!Array.isArray(myEvents) || myEvents.length === 0) && (
              <p>No events found</p>
            )}
          </div>
        </div>

        <div className="activity-section">
          <h3>Upcoming Sessions</h3>
          <div className="sessions-preview">
            {Array.isArray(sessions) && sessions
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
            {(!Array.isArray(sessions) || sessions.filter(s => new Date(s.date) > new Date()).length === 0) && (
              <p>No upcoming sessions</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderAllEvents = () => (
    <div className="all-events-section">
      <div className="section-header">
        <h3>All Events in System</h3>
        <p>View all events and create sessions for approved events</p>
      </div>
      
      <div className="events-grid">
        {Array.isArray(allEvents) && allEvents.map(event => (
          <div key={event._id} className="event-card">
            <div className="event-header">
              <h4>{event.title}</h4>
              <div className="event-badges">
                <span className={`status-badge ${getStatusBadgeClass(event.status)}`}>
                  {event.status}
                </span>
                <span className="category-badge">{event.category}</span>
              </div>
            </div>
            
            <p className="event-description">{event.description}</p>
            
            <div className="event-details">
              <div className="detail-row">
                <span className="label">📅 Date:</span>
                <span>{new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}</span>
              </div>
              <div className="detail-row">
                <span className="label">📍 Venue:</span>
                <span>{event.venue?.name || event.venue || 'TBD'}</span>
              </div>
              <div className="detail-row">
                <span className="label">👥 Capacity:</span>
                <span>{event.registration?.currentCount || 0} / {event.capacity}</span>
              </div>
              <div className="detail-row">
                <span className="label">🎯 Sessions:</span>
                <span>{Array.isArray(sessions) ? sessions.filter(s => s.eventId === event._id).length : 0} sessions</span>
              </div>
            </div>

            <div className="event-actions">
              {event.status === 'approved' && (
                <button 
                  className="btn-primary"
                  onClick={() => {
                    setSelectedEvent(event._id);
                    setSessionForm(prev => ({ ...prev, eventId: event._id }));
                    setShowCreateSession(true);
                  }}
                >
                  📅 Create Session
                </button>
              )}
              <button 
                className="btn-outline"
                onClick={() => {
                  setSelectedEvent(event._id);
                  setActiveSection('sessions');
                }}
              >
                🎯 View Sessions
              </button>
              <button 
                className="btn-outline"
                onClick={() => {
                  setSelectedEvent(event._id);
                  setActiveSection('attendance');
                }}
              >
                ✅ View Attendance
              </button>
            </div>
          </div>
        ))}
        {(!Array.isArray(allEvents) || allEvents.length === 0) && (
          <p>No events found</p>
        )}
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
                <span>{event.venue?.name || event.venue || 'TBD'}</span>
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
        <h3>Smart Session Management</h3>
        <p>Create and manage training sessions for events</p>
      </div>
      
      <SessionManagement 
        onClose={() => setActiveSection('overview')}
        facultyMode={true}
      />
    </div>
  );

  const renderAttendance = () => (
    <div className="attendance-section">
      <div className="section-header">
        <h3>Attendance Management</h3>
        <div className="header-actions">
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="event-filter"
          >
            <option value="">All Events</option>
            {allEvents
              .filter(event => event.status === 'approved')
              .map(event => (
                <option key={event._id} value={event._id}>{event.title}</option>
              ))}
          </select>
          <button 
            className="btn-secondary"
            onClick={() => fetchAttendanceData()}
          >
            🔄 Refresh Data
          </button>
        </div>
      </div>
      
      <div className="attendance-overview">
        <div className="stats-row">
          <div className="stat-card">
            <h4>Total Sessions</h4>
            <p>{sessions.filter(s => !selectedEvent || s.eventId === selectedEvent).length}</p>
          </div>
          <div className="stat-card">
            <h4>Sessions Conducted</h4>
            <p>{sessions.filter(s => 
              (!selectedEvent || s.eventId === selectedEvent) && 
              new Date(s.date) < new Date()
            ).length}</p>
          </div>
          <div className="stat-card">
            <h4>Average Attendance</h4>
            <p>{calculateAverageAttendance()}%</p>
          </div>
          <div className="stat-card">
            <h4>Total Participants</h4>
            <p>{getTotalParticipants()}</p>
          </div>
        </div>
      </div>

      <div className="sessions-attendance-list">
        {sessions
          .filter(session => !selectedEvent || session.eventId === selectedEvent)
          .map(session => {
            const event = allEvents.find(e => e._id === session.eventId);
            const attendance = attendanceData.find(a => a.sessionId === session._id) || {};
            const attendancePercentage = attendance.totalParticipants > 0 
              ? ((attendance.presentCount / attendance.totalParticipants) * 100).toFixed(1)
              : 0;

            return (
              <div key={session._id} className="session-attendance-card">
                <div className="session-header">
                  <div className="session-info">
                    <h4>{session.title}</h4>
                    <p className="session-event">Event: {event?.title}</p>
                    <p className="session-date">
                      {new Date(session.date).toLocaleDateString()} at {session.startTime} - {session.endTime}
                    </p>
                  </div>
                  <div className="attendance-status">
                    <div className="attendance-percentage">
                      <span className="percentage-number">{attendancePercentage}%</span>
                      <span className="percentage-label">Attendance</span>
                    </div>
                    <span className={`session-status ${getSessionStatus(session)}`}>
                      {getSessionStatus(session)}
                    </span>
                  </div>
                </div>

                <div className="attendance-details">
                  <div className="attendance-stats">
                    <div className="stat">
                      <span className="stat-label">Present:</span>
                      <span className="stat-value present">{attendance.presentCount || 0}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Absent:</span>
                      <span className="stat-value absent">{attendance.absentCount || 0}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Total:</span>
                      <span className="stat-value">{attendance.totalParticipants || 0}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Venue:</span>
                      <span className="stat-value">{
                        typeof session.venue === 'object' 
                          ? session.venue?.name || 'TBD'
                          : session.venue || 'TBD'
                      }</span>
                    </div>
                  </div>

                  {attendance.participants && attendance.participants.length > 0 && (
                    <div className="participants-list">
                      <h5>Participants ({attendance.participants.length})</h5>
                      <div className="participants-grid">
                        {attendance.participants.map(participant => (
                          <div key={participant.userId} className={`participant-item ${participant.status}`}>
                            <div className="participant-info">
                              <span className="participant-name">{participant.name}</span>
                              <span className="participant-email">{participant.email}</span>
                            </div>
                            <span className={`attendance-badge ${participant.status}`}>
                              {participant.status === 'present' ? '✅' : '❌'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="session-actions">
                  <button className="btn-outline">
                    📊 View Details
                  </button>
                  <button className="btn-outline">
                    📧 Send Reminder
                  </button>
                  <button className="btn-outline">
                    📄 Export Report
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
          className={`nav-button ${activeSection === 'all-events' ? 'active' : ''}`}
          onClick={() => setActiveSection('all-events')}
        >
          📋 All Events
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
          className={`nav-button ${activeSection === 'attendance' ? 'active' : ''}`}
          onClick={() => setActiveSection('attendance')}
        >
          ✅ Attendance
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
        {activeSection === 'all-events' && renderAllEvents()}
        {activeSection === 'events' && renderEvents()}
        {activeSection === 'sessions' && renderSessions()}
        {activeSection === 'attendance' && renderAttendance()}
        {activeSection === 'analytics' && renderAnalytics()}
      </div>

      {/* Create Event Modal */}
      {showCreateEvent && (
        <div className="modal-overlay" onClick={() => setShowCreateEvent(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingEvent ? 'Edit Event' : 'Create New Event'}</h3>
              <button 
                className="modal-close"
                onClick={() => setShowCreateEvent(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleCreateEvent} className="event-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Event Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={eventForm.title}
                    onChange={handleEventInputChange}
                    required
                    placeholder="Enter event title"
                  />
                </div>
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    name="category"
                    value={eventForm.category}
                    onChange={handleEventInputChange}
                    required
                  >
                    <option value="">Select Category</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Seminar">Seminar</option>
                    <option value="Conference">Conference</option>
                    <option value="Training">Training</option>
                    <option value="Competition">Competition</option>
                    <option value="Cultural">Cultural</option>
                    <option value="Sports">Sports</option>
                    <option value="Academic">Academic</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Event Type *</label>
                  <select
                    name="type"
                    value={eventForm.type}
                    onChange={handleEventInputChange}
                    required
                  >
                    <option value="academic">Academic</option>
                    <option value="training">Training</option>
                    <option value="cultural">Cultural</option>
                    <option value="sports">Sports</option>
                    <option value="technical">Technical</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  name="description"
                  value={eventForm.description}
                  onChange={handleEventInputChange}
                  required
                  rows="4"
                  placeholder="Describe the event, its objectives, and what participants can expect..."
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Date *</label>
                  <input
                    type="date"
                    name="startDate"
                    value={eventForm.startDate}
                    onChange={handleEventInputChange}
                    required
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="form-group">
                  <label>End Date *</label>
                  <input
                    type="date"
                    name="endDate"
                    value={eventForm.endDate}
                    onChange={handleEventInputChange}
                    required
                    min={eventForm.startDate}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Venue</label>
                  <input
                    type="text"
                    name="venue"
                    value={eventForm.venue}
                    onChange={handleEventInputChange}
                    placeholder="Event venue (optional)"
                  />
                </div>
                <div className="form-group">
                  <label>Max Participants</label>
                  <input
                    type="number"
                    name="capacity"
                    value={eventForm.capacity}
                    onChange={handleEventInputChange}
                    min="1"
                    placeholder="Maximum participants"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Prerequisites</label>
                <input
                  type="text"
                  name="prerequisites"
                  value={eventForm.prerequisites}
                  onChange={handleEventInputChange}
                  placeholder="Any prerequisites for participants (optional)"
                />
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-outline"
                  onClick={() => setShowCreateEvent(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingEvent ? 'Update Event' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Session Modal */}
      {showCreateSession && (
        <div className="modal-overlay" onClick={() => setShowCreateSession(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingSession ? 'Edit Session' : 'Create New Session'}</h3>
              <button 
                className="modal-close"
                onClick={() => setShowCreateSession(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleCreateSession} className="session-form">
              <div className="form-group">
                <label>Event *</label>
                <select
                  name="eventId"
                  value={sessionForm.eventId}
                  onChange={handleSessionInputChange}
                  required
                >
                  <option value="">Select Event</option>
                  {allEvents
                    .filter(event => event.status === 'approved')
                    .map(event => (
                      <option key={event._id} value={event._id}>
                        {event.title}
                      </option>
                    ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Session Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={sessionForm.title}
                    onChange={handleSessionInputChange}
                    required
                    placeholder="Session title"
                  />
                </div>
                <div className="form-group">
                  <label>Session Type *</label>
                  <select
                    name="sessionType"
                    value={sessionForm.sessionType}
                    onChange={handleSessionInputChange}
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="lecture">Lecture</option>
                    <option value="workshop">Workshop</option>
                    <option value="practical">Practical</option>
                    <option value="discussion">Discussion</option>
                    <option value="presentation">Presentation</option>
                    <option value="assessment">Assessment</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Assign Trainer</label>
                  <select
                    name="trainerId"
                    value={sessionForm.trainer.id}
                    onChange={handleSessionInputChange}
                  >
                    <option value="">Select Trainer (Optional)</option>
                    {trainers.map(trainer => (
                      <option key={trainer._id} value={trainer._id}>
                        {trainer.firstName} {trainer.lastName} ({trainer.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={sessionForm.description}
                  onChange={handleSessionInputChange}
                  rows="3"
                  placeholder="Session description and objectives..."
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Date *</label>
                  <input
                    type="date"
                    name="date"
                    value={sessionForm.date}
                    onChange={handleSessionInputChange}
                    required
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="form-group">
                  <label>Venue</label>
                  <input
                    type="text"
                    name="venue.name"
                    value={sessionForm.venue.name}
                    onChange={handleSessionInputChange}
                    placeholder="Session venue name"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Venue Type</label>
                  <select
                    name="venue.isOnline"
                    value={sessionForm.venue.isOnline.toString()}
                    onChange={handleSessionInputChange}
                  >
                    <option value="false">Physical Venue</option>
                    <option value="true">Online Meeting</option>
                  </select>
                </div>
                {sessionForm.venue.isOnline && (
                  <div className="form-group">
                    <label>Meeting Link</label>
                    <input
                      type="url"
                      name="venue.meetingLink"
                      value={sessionForm.venue.meetingLink}
                      onChange={handleSessionInputChange}
                      placeholder="https://meet.example.com/session"
                    />
                  </div>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Session Number</label>
                  <input
                    type="number"
                    name="number"
                    value={sessionForm.number}
                    onChange={handleSessionInputChange}
                    min="1"
                    placeholder="Session sequence number"
                  />
                </div>
                <div className="form-group">
                  <label>Duration (minutes)</label>
                  <input
                    type="number"
                    name="duration"
                    value={sessionForm.duration}
                    onChange={handleSessionInputChange}
                    min="15"
                    step="15"
                    placeholder="Session duration"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Time *</label>
                  <input
                    type="time"
                    name="startTime"
                    value={sessionForm.startTime}
                    onChange={handleSessionInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>End Time *</label>
                  <input
                    type="time"
                    name="endTime"
                    value={sessionForm.endTime}
                    onChange={handleSessionInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Capacity</label>
                <input
                  type="number"
                  name="capacity"
                  value={sessionForm.capacity}
                  onChange={handleSessionInputChange}
                  min="1"
                  placeholder="Maximum participants"
                />
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-outline"
                  onClick={() => setShowCreateSession(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingSession ? 'Update Session' : 'Create Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedFacultyDashboard;