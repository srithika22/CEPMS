import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import CompactEventCard from '../events/CompactEventCard';
import SessionManagement from '../trainer/SessionManagement';
import SmartAttendanceSystem from '../trainer/SmartAttendanceSystem';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const EnhancedTrainerDashboard = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [events, setEvents] = useState([]);
  const [myAssignedEvents, setMyAssignedEvents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOptions, setFilterOptions] = useState({
    status: 'all',
    category: 'all',
    timeframe: 'all'
  });

  // Statistics
  const [stats, setStats] = useState({
    assignedEvents: 0,
    completedEvents: 0,
    upcomingEvents: 0,
    totalParticipants: 0,
    totalSessions: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Socket.io event listeners for real-time updates
  useEffect(() => {
    if (socket) {
      console.log('Setting up socket listeners for trainer dashboard');
      
      // Listen for new events
      socket.on('new-event', (eventData) => {
        console.log('New event received in trainer dashboard:', eventData);
        if (eventData.event) {
          // Check if trainer is involved in this event
          const event = eventData.event;
          const isTrainerInvolved = event.trainers?.some(trainerId => 
            trainerId === user._id || trainerId._id === user._id
          );
          
          if (isTrainerInvolved) {
            setMyAssignedEvents(prev => [event, ...(Array.isArray(prev) ? prev : [])]);
            setStats(prev => ({
              ...prev,
              assignedEvents: prev.assignedEvents + 1
            }));
          }
          
          setEvents(prev => [event, ...(Array.isArray(prev) ? prev : [])]);
          toast.success(`New event created: ${event.title}`);
        }
      });

      // Listen for event approvals
      socket.on('event-approved', (eventData) => {
        if (eventData.event) {
          const event = eventData.event;
          setEvents(prev => (Array.isArray(prev) ? prev : []).map(e => 
            e._id === event._id ? event : e
          ));
          
          setMyAssignedEvents(prev => (Array.isArray(prev) ? prev : []).map(e => 
            e._id === event._id ? event : e
          ));
          
          toast.success(`Event "${event.title}" has been approved!`);
        }
      });

      // Listen for event updates
      socket.on('event-updated', (eventData) => {
        if (eventData.event) {
          const event = eventData.event;
          setEvents(prev => (Array.isArray(prev) ? prev : []).map(e => 
            e._id === event._id ? event : e
          ));
          
          setMyAssignedEvents(prev => (Array.isArray(prev) ? prev : []).map(e => 
            e._id === event._id ? event : e
          ));
        }
      });

      // Listen for new registrations on trainer events
      socket.on('new-registration', (registrationData) => {
        console.log('New registration received:', registrationData);
        if (registrationData.eventId) {
          // Update registration count for the event
          setEvents(prev => (Array.isArray(prev) ? prev : []).map(event => {
            if (event._id === registrationData.eventId) {
              return {
                ...event,
                registrationCount: registrationData.event.registrationCount
              };
            }
            return event;
          }));
          
          setMyAssignedEvents(prev => (Array.isArray(prev) ? prev : []).map(event => {
            if (event._id === registrationData.eventId) {
              const isTrainerEvent = event.trainers?.some(trainerId => 
                trainerId === user._id || trainerId._id === user._id
              );
              
              if (isTrainerEvent) {
                toast.info(`New registration for your event: ${registrationData.event.title}`);
              }
              
              return {
                ...event,
                registrationCount: registrationData.event.registrationCount
              };
            }
            return event;
          }));
        }
      });

      return () => {
        socket.off('new-event');
        socket.off('event-approved');
        socket.off('event-updated');
        socket.off('new-registration');
      };
    }
  }, [socket, user._id]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      // Fetch trainer dashboard stats
      const dashboardRes = await axios.get('http://localhost:5000/api/dashboard/trainer', config);
      const dashboardData = dashboardRes.data.data || dashboardRes.data;

      // Fetch all events separately (approved events only, increase limit to get all events)
      console.log('🔍 Trainer Dashboard - Fetching events...');
      const eventsRes = await axios.get('http://localhost:5000/api/events?limit=1000', config);
      
      console.log('📦 Trainer Dashboard - Full API Response:', eventsRes.data);
      
      // Handle different possible response structures
      let allEvents = [];
      if (eventsRes.data?.data?.events) {
        allEvents = eventsRes.data.data.events;
      } else if (eventsRes.data?.events) {
        allEvents = eventsRes.data.events;
      } else if (Array.isArray(eventsRes.data?.data)) {
        allEvents = eventsRes.data.data;
      } else if (Array.isArray(eventsRes.data)) {
        allEvents = eventsRes.data;
      }
      
      console.log('✅ Trainer Dashboard - Extracted events:', allEvents.length);
      console.log('📋 Trainer Dashboard - Sample event:', allEvents[0]);
      
      // Ensure we have an array
      const finalEvents = Array.isArray(allEvents) ? allEvents : [];
      console.log('🎯 Trainer Dashboard - Setting', finalEvents.length, 'events in state');
      
      setEvents(finalEvents);

      // Filter events where current user is assigned as trainer
      const trainerEvents = (Array.isArray(allEvents) ? allEvents : []).filter(event => 
        event.trainers?.some(trainer => 
          trainer.email === user.email || trainer.id === user._id
        )
      );
      setMyAssignedEvents(trainerEvents);

      setSessions(dashboardData.sessions || []);
      setAttendance(dashboardData.attendance || []);

      // Calculate statistics
      const now = new Date();
      const upcomingEvents = trainerEvents.filter(event => 
        new Date(event.startDate) > now
      ).length;

      const completedEvents = trainerEvents.filter(event => 
        new Date(event.endDate) < now
      ).length;

      setStats({
        assignedEvents: trainerEvents.length,
        completedEvents,
        upcomingEvents,
        totalParticipants: dashboardData.totalParticipants || 0,
        totalSessions: (dashboardData.sessions || []).length
      });

      setLoading(false);
    } catch (error) {
      console.error('Fetch dashboard data error:', error);
      // Fallback to individual API calls if dashboard endpoint fails
      await fetchDashboardDataFallback();
    }
  };

  // Fallback method using individual API calls
  const fetchDashboardDataFallback = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      // Fetch all events
      const eventsRes = await axios.get('http://localhost:5000/api/events', config);
      const allEvents = eventsRes.data.data || eventsRes.data;
      setEvents(allEvents);

      // Filter events where current user is assigned as trainer
      const trainerEvents = allEvents.filter(event => 
        event.trainers?.some(trainer => 
          trainer.email === user.email || trainer.id === user._id
        )
      );
      setMyAssignedEvents(trainerEvents);

      // Fetch sessions for trainer's events
      const trainerEventIds = trainerEvents.map(event => event._id);
      let trainerSessions = [];
      
      // Fetch sessions for each trainer event
      for (const eventId of trainerEventIds) {
        try {
          const sessionsRes = await axios.get(`http://localhost:5000/api/sessions/event/${eventId}`, config);
          const eventSessions = sessionsRes.data.data || sessionsRes.data;
          trainerSessions = [...trainerSessions, ...eventSessions];
        } catch (error) {
          console.log(`Could not fetch sessions for event ${eventId}:`, error.message);
        }
      }
      setSessions(trainerSessions);

      // Fetch attendance data
      try {
        // For now, we'll skip fetching all attendance since there's no general endpoint
        // Attendance will be fetched per session when needed
        setAttendance([]);
      } catch (attError) {
        console.log('Attendance endpoint might not be available yet');
        setAttendance([]);
      }

      // Calculate statistics
      const now = new Date();
      const upcomingEvents = trainerEvents.filter(event => 
        new Date(event.startDate) > now
      ).length;

      const completedEvents = trainerEvents.filter(event => 
        new Date(event.endDate) < now
      ).length;

      // Calculate unique participants across all trainer events
      let allRegistrations = [];
      for (const event of trainerEvents) {
        try {
          const regRes = await axios.get(`http://localhost:5000/api/registrations/event/${event._id}`, config);
          const eventRegistrations = regRes.data.data || regRes.data || [];
          allRegistrations = [...allRegistrations, ...eventRegistrations];
        } catch (error) {
          console.log(`Could not fetch registrations for event ${event._id}:`, error.message);
        }
      }

      const uniqueParticipants = new Set();
      allRegistrations.forEach(reg => {
        if (reg.participantId) uniqueParticipants.add(reg.participantId);
      });

      setStats({
        assignedEvents: trainerEvents.length,
        completedEvents,
        upcomingEvents,
        totalParticipants: uniqueParticipants.size,
        totalSessions: trainerSessions.length
      });

      setLoading(false);
    } catch (error) {
      console.error('Fetch dashboard data fallback error:', error);
      setError('Failed to fetch dashboard data');
      setLoading(false);
    }
  };

  const handleUpdateAvailability = async (availability) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `http://localhost:5000/api/users/${user._id}/availability`,
        { availability },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      toast.success('Availability updated successfully!');
    } catch (error) {
      console.error('Update availability error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update availability';
      toast.error(errorMessage);
    }
  };

  const handleMarkAttendance = async (sessionId, participantId, status) => {
    try {
      const token = localStorage.getItem('token');
      const attendanceData = {
        sessionId,
        participantId,
        status,
        markedBy: user._id,
        markedAt: new Date()
      };

      await axios.post('http://localhost:5000/api/attendance', attendanceData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Refresh attendance data
      fetchDashboardData();
      toast.success('Attendance marked successfully!');
    } catch (error) {
      console.error('Mark attendance error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to mark attendance';
      toast.error(errorMessage);
    }
  };

  const filteredEvents = myAssignedEvents.filter(event => {
    const matchesSearch = event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.category?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterOptions.status === 'all' || event.status === filterOptions.status;
    const matchesCategory = filterOptions.category === 'all' || event.category === filterOptions.category;
    
    let matchesTimeframe = true;
    if (filterOptions.timeframe !== 'all') {
      const now = new Date();
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      
      switch (filterOptions.timeframe) {
        case 'upcoming':
          matchesTimeframe = eventStart > now;
          break;
        case 'ongoing':
          matchesTimeframe = eventStart <= now && eventEnd >= now;
          break;
        case 'completed':
          matchesTimeframe = eventEnd < now;
          break;
        default:
          matchesTimeframe = true;
      }
    }
    
    return matchesSearch && matchesStatus && matchesCategory && matchesTimeframe;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const renderOverview = () => (
    <div className="overview-section">
      {/* Welcome Section */}
      <div className="welcome-section theme-orange">
        <div className="welcome-inner">
          <div className="welcome-text">
            <h2>Welcome back, {user.name}! 🎓</h2>
            <p className="muted">Trainer Dashboard</p>
            {user.trainer && (
              <div className="trainer-info">
                <p>{user.trainer.organization}</p>
                <p>{user.trainer.experience} years of experience</p>
                {user.trainer.expertise.length > 0 && (
                  <div className="skills-tags">
                    {user.trainer.expertise.slice(0, 3).map((skill, index) => (
                      <span key={index} className="skill-tag">
                        {skill}
                      </span>
                    ))}
                    {user.trainer.expertise.length > 3 && (
                      <span className="skill-tag more">
                        +{user.trainer.expertise.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="welcome-emoji">🎓</div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid trainer-stats">
        <div className="stat-card card-purple">
          <div className="stat-inner">
            <div>
              <p className="stat-label">Assigned Events</p>
              <p className="stat-value">{stats.assignedEvents}</p>
            </div>
            <div className="stat-icon">📅</div>
          </div>
        </div>
        
        <div className="stat-card card-green">
          <div className="stat-inner">
            <div>
              <p className="stat-label">Completed Events</p>
              <p className="stat-value">{stats.completedEvents}</p>
            </div>
            <div className="stat-icon">✅</div>
          </div>
        </div>
        
        <div className="stat-card card-blue">
          <div className="stat-inner">
            <div>
              <p className="stat-label">Total Participants</p>
              <p className="stat-value">{stats.totalParticipants}</p>
            </div>
            <div className="stat-icon">👥</div>
          </div>
        </div>
        
        <div className="stat-card card-orange">
          <div className="stat-inner">
            <div>
              <p className="stat-label">Total Sessions</p>
              <p className="stat-value">{stats.totalSessions}</p>
            </div>
            <div className="stat-icon">🎯</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card actions-card">
        <h3>Quick Actions</h3>
        <div className="actions-grid trainer-actions">
          <button onClick={() => setActiveTab('events')} className="btn-primary">View My Events</button>
          <button onClick={() => setActiveTab('sessions')} className="btn-primary alt">Manage Sessions</button>
          <button onClick={() => setActiveTab('attendance')} className="btn-primary alt-2">Mark Attendance</button>
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="card">
        <h3>Upcoming Events</h3>
        <div className="upcoming-list">
          {myAssignedEvents.filter(event => new Date(event.startDate) > new Date()).slice(0, 5).map(event => (
            <div key={event._id} className="upcoming-item">
              <div>
                <h4 className="semi">{event.title}</h4>
                <p className="event-meta">
                  <span className="event-category">{event.category}</span> • <span className="event-date">{new Date(event.startDate).toLocaleDateString()}</span>
                </p>
                <p className="muted small">Venue: {event.venue?.name}</p>
              </div>
              <span className={`badge ${
                event.status === 'approved' ? 'badge-green' :
                event.status === 'pending' ? 'badge-yellow' :
                'badge-gray'
              }`}>
                {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
              </span>
            </div>
          ))}
          {myAssignedEvents.filter(event => new Date(event.startDate) > new Date()).length === 0 && (
            <p className="muted center">No upcoming events assigned.</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderEvents = () => (
    <div className="events-section">
      <h2>My Assigned Events</h2>

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
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
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
            value={filterOptions.timeframe}
            onChange={(e) => setFilterOptions({...filterOptions, timeframe: e.target.value})}
            className="select-field"
          >
            <option value="all">All Time</option>
            <option value="upcoming">Upcoming</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Events Grid */}
      <div className="events-grid">
        {filteredEvents.map(event => (
          <CompactEventCard
            key={event._id}
            event={event}
            showActions={false}
          />
        ))}
      </div>

      {filteredEvents.length === 0 && (
        <div className="no-data">
          <p className="muted">No assigned events found matching your criteria.</p>
        </div>
      )}
    </div>
  );

  const renderSessions = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Event Sessions</h2>
      
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sessions.map(session => {
                const event = myAssignedEvents.find(e => e._id === session.eventId);
                return (
                  <tr key={session._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{event?.title || 'Unknown Event'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{session.title}</div>
                      <div className="text-sm text-gray-500">{session.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(session.startTime).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {session.duration} minutes
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        session.status === 'completed' ? 'bg-green-100 text-green-800' :
                        session.status === 'ongoing' ? 'bg-blue-100 text-blue-800' :
                        session.status === 'upcoming' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {session.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-purple-600 hover:text-purple-900 mr-4">
                        Manage
                      </button>
                      <button className="text-blue-600 hover:text-blue-900">
                        Attendance
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {sessions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No sessions found for your events.</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderAttendance = () => (
    <div className="attendance-section">
      <h2>Attendance Management</h2>
      
      <div className="card">
        <p className="muted mb-4">Select a session to mark attendance:</p>
        
        <div className="sessions-grid">
          {sessions.map(session => {
            const event = myAssignedEvents.find(e => e._id === session.eventId);
            return (
              <div key={session._id} className="session-card">
                <h4 className="semi">{session.title}</h4>
                <p className="muted small">{event?.title}</p>
                <p className="muted small">{new Date(session.startTime).toLocaleDateString()}</p>
                <button className="btn-primary full-width mt-3">
                  Mark Attendance
                </button>
              </div>
            );
          })}
        </div>
        
        {sessions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No sessions available for attendance marking.</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="trainer-dashboard-root">
      {/* Header */}
      <div className="sd-header theme-orange">
        <div className="container">
          <div className="sd-header-inner">
            <div>
              <h1>Trainer Dashboard</h1>
              <p className="subtitle">Manage training sessions and events</p>
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
              { key: 'events', label: 'My Events', icon: '📅' },
              { key: 'sessions', label: 'Sessions', icon: '🎯' },
              { key: 'attendance', label: 'Attendance', icon: '📝' }
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
        {activeTab === 'events' && renderEvents()}
        {activeTab === 'sessions' && (
          <SessionManagement 
            onClose={() => setActiveTab('overview')}
          />
        )}
        {activeTab === 'attendance' && (
          <SmartAttendanceSystem 
            onClose={() => setActiveTab('overview')}
          />
        )}
      </div>
    </div>
  );
};

export default EnhancedTrainerDashboard;