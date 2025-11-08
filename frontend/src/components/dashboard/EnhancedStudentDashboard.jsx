import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import EnhancedEventCard from '../events/CompactEventCard';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const EnhancedStudentDashboard = () => {
  // API URL from environment variable
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  
  const { user } = useAuth();
  const { socket, emitRegistrationCreated } = useSocket();
  const [events, setEvents] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOptions, setFilterOptions] = useState({
    category: 'all',
    status: 'all',
    timeframe: 'all',
    eligibility: 'all' // Show all events by default so students can see everything
  });

  // Modal states
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);

  // Statistics
  const [stats, setStats] = useState({
    availableEvents: 0,
    myRegistrations: 0,
    attendedEvents: 0,
    certificatesEarned: 0,
    upcomingEvents: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Compute robust registration state from event + registration window
  const computeRegistrationState = (event) => {
    const reg = event?.registration || {};

    // Defaults: registration required and allowed unless explicitly closed
    const required = reg.required !== false;

    const now = new Date();
    const start = reg.startDate ? new Date(reg.startDate) : (event.startDate ? new Date(event.startDate) : null);
    const endRaw = reg.endDate ? new Date(reg.endDate) : (event.endDate ? new Date(event.endDate) : null);

    // Treat end date as inclusive end-of-day to avoid timezone off-by-one closures
    let end = endRaw ? new Date(endRaw) : null;
    if (end) {
      end.setHours(23, 59, 59, 999);
    }

    const withinWindow = (!start || now >= start) && (!end || now <= end);
    const capacity = typeof reg.maxParticipants === 'number'
      ? (reg.currentCount || 0) < reg.maxParticipants
      : true;

    const explicitClosed = reg.isOpen === false;
    const explicitOpen = reg.isOpen === true;

    // Open if explicitly open OR (within window and capacity), unless explicitly closed
    const isOpen = (explicitOpen || (withinWindow && capacity)) && !explicitClosed;

    let reason = '';
    if (!withinWindow) {
      if (start && now < start) reason = 'Registration not started yet';
      else if (end && now > end) reason = 'Registration period ended';
    } else if (!capacity) {
      reason = 'Event is full';
    } else if (explicitClosed) {
      reason = 'Registration closed by admin';
    }

    return { isOpen, required, withinWindow, capacity, reason, start, end };
  };

  // Socket.io event listeners for real-time updates
  useEffect(() => {
    if (socket) {
      console.log('Setting up socket listeners for student dashboard');
      
      // Listen for new events
      socket.on('new-event', (eventData) => {
        console.log('New event received:', eventData);
        if (eventData.event) {
          const event = eventData.event;
          
          // Add all approved events to state, eligibility filtering happens in UI
          if (event.status === 'approved') {
            setEvents(prev => [event, ...(Array.isArray(prev) ? prev : [])]);
            setStats(prev => ({
              ...prev,
              availableEvents: prev.availableEvents + 1
            }));
            
            toast.success(`New event available: ${event.title}`);
          }
        }
      });

      // Listen for event updates
      socket.on('event-updated', (eventData) => {
        if (eventData.event) {
          setEvents(prev => (Array.isArray(prev) ? prev : []).map(event => 
            event._id === eventData.event._id ? eventData.event : event
          ));
        }
      });

      // Listen for event approvals
      socket.on('event-approved', (eventData) => {
        console.log('Event approved:', eventData);
        if (eventData.event) {
          const event = eventData.event;
          
          // Add all approved events to state, eligibility filtering happens in UI
          setEvents(prev => {
            const existingEventIndex = (Array.isArray(prev) ? prev : []).findIndex(e => e._id === event._id);
            if (existingEventIndex >= 0) {
              // Update existing event
              return prev.map(e => e._id === event._id ? event : e);
            } else {
              // Add new approved event
              return [event, ...prev];
            }
          });
          
          toast.success(`Event "${event.title}" has been approved and is now available!`);
        }
      });

      // Listen for event deletions
      socket.on('event-deleted', (eventData) => {
        if (eventData.event) {
          setEvents(prev => (Array.isArray(prev) ? prev : []).filter(event => 
            event._id !== eventData.event._id
          ));
          setStats(prev => ({
            ...prev,
            availableEvents: Math.max(0, prev.availableEvents - 1)
          }));
        }
      });

      // Listen for registration updates
      socket.on('new-registration', (registrationData) => {
        console.log('New registration notification:', registrationData);
        if (registrationData.event) {
          setEvents(prev => (Array.isArray(prev) ? prev : []).map(event => 
            event._id === registrationData.event._id 
              ? { ...event, registration: { ...event.registration, currentCount: registrationData.event.registrationCount } }
              : event
          ));
        }
      });

      socket.on('registration-cancelled', (cancellationData) => {
        console.log('Registration cancelled notification:', cancellationData);
        if (cancellationData.event) {
          setEvents(prev => (Array.isArray(prev) ? prev : []).map(event => 
            event._id === cancellationData.event._id 
              ? { ...event, registration: { ...event.registration, currentCount: cancellationData.event.registrationCount } }
              : event
          ));
        }
      });

      socket.on('registration-promoted', (promotionData) => {
        console.log('Registration promoted notification:', promotionData);
        if (promotionData.registration && promotionData.registration.userEmail === user.email) {
          toast.success(`You've been promoted from waitlist for "${promotionData.event.title}"!`);
          // Refresh registration data
          fetchMyRegistrations();
        }
        
        if (promotionData.event) {
          setEvents(prev => (Array.isArray(prev) ? prev : []).map(event => 
            event._id === promotionData.event._id 
              ? { ...event, registration: { ...event.registration, currentCount: promotionData.event.registrationCount } }
              : event
          ));
        }
      });

      return () => {
        socket.off('new-event');
        socket.off('event-updated');
        socket.off('event-approved');
        socket.off('event-deleted');
        socket.off('new-registration');
        socket.off('registration-cancelled');
        socket.off('registration-promoted');
      };
    }
  }, [socket]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(''); // Clear any previous errors
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to view dashboard');
        setLoading(false);
        return;
      }
      
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      console.log('🔍 Student Dashboard - Starting data fetch...');

      // Set default values first
      setStats({
        availableEvents: 0,
        myRegistrations: 0,
        attendedEvents: 0,
        certificatesEarned: 0,
        upcomingEvents: 0
      });

      try {
        // Fetch all available events (approved events)
        console.log('📡 Student Dashboard - Fetching events from /api/events...');
        const eventsRes = await axios.get(`${API_URL}/events?limit=1000`, config);
        
        console.log('📦 Student Dashboard - Events API Response:', eventsRes.data);
        
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
        
        console.log('✅ Student Dashboard - Extracted events:', allEvents.length);
        
        // Only show approved events
        const approvedEvents = Array.isArray(allEvents) ? allEvents.filter(event => event.status === 'approved') : [];
        console.log('🎯 Student Dashboard - Approved events:', approvedEvents.length);
        
        setEvents(approvedEvents);
        
        // Update stats
        setStats(prev => ({
          ...prev,
          availableEvents: approvedEvents.length,
          upcomingEvents: approvedEvents.filter(event => new Date(event.startDate) > new Date()).length
        }));
      } catch (eventsError) {
        console.warn('Events fetch failed:', eventsError.message);
        setEvents([]);
      }

      // Try to fetch other data but don't fail if it doesn't work
      try {
        const registrationsRes = await axios.get(`${API_URL}/registrations/my-registrations`, config);
        const userRegistrations = Array.isArray(registrationsRes.data.data) ? registrationsRes.data.data : [];
        setMyRegistrations(userRegistrations);
        
        setStats(prev => ({
          ...prev,
          myRegistrations: userRegistrations.length
        }));
      } catch (regError) {
        console.warn('Registrations fetch failed:', regError.message);
        setMyRegistrations([]);
      }

      try {
        const certificatesRes = await axios.get(`${API_URL}/certificates/user/my-certificates`, config);
        const userCertificates = Array.isArray(certificatesRes.data.data) ? certificatesRes.data.data : [];
        setCertificates(userCertificates);
        
        setStats(prev => ({
          ...prev,
          certificatesEarned: userCertificates.length
        }));
      } catch (certError) {
        console.warn('Certificates fetch failed:', certError.message);
        setCertificates([]);
      }

      console.log('✨ Student Dashboard - Data fetch completed successfully');
      setLoading(false);
    } catch (error) {
      console.error('❌ Student Dashboard - Fetch error:', error);
      setError('Failed to load dashboard data - showing with default values');
      setLoading(false);
    }
  };

  // Check if student is eligible for an event
  const checkEventEligibility = (event) => {
    if (!event?.eligibility || !user?.student) {
      // If no eligibility criteria or user is not a student, assume eligible
      return true;
    }

    const eligibility = event.eligibility;
    const student = user.student;

    // Check department eligibility
    if (eligibility.departments && eligibility.departments.length > 0) {
      if (!eligibility.departments.includes(student.department) && 
          !eligibility.departments.includes('All Departments')) {
        console.log(`Event "${event.title}" - Department filter failed:`, {
          required: eligibility.departments,
          userDepartment: student.department
        });
        return false;
      }
    }

    // Check program eligibility
    if (eligibility.programs && eligibility.programs.length > 0) {
      if (!eligibility.programs.includes(student.program) && 
          !eligibility.programs.includes('All Programs')) {
        console.log(`Event "${event.title}" - Program filter failed:`, {
          required: eligibility.programs,
          userProgram: student.program
        });
        return false;
      }
    }

    // Check year eligibility
    if (eligibility.years && eligibility.years.length > 0) {
      if (!eligibility.years.includes(student.year)) {
        console.log(`Event "${event.title}" - Year filter failed:`, {
          required: eligibility.years,
          userYear: student.year
        });
        return false;
      }
    }

    // Check section eligibility
    if (eligibility.sections && eligibility.sections.length > 0) {
      if (!eligibility.sections.includes(student.section) && 
          !eligibility.sections.includes('All Sections')) {
        console.log(`Event "${event.title}" - Section filter failed:`, {
          required: eligibility.sections,
          userSection: student.section
        });
        return false;
      }
    }

    console.log(`Event "${event.title}" - Eligibility check passed for student:`, {
      department: student.department,
      program: student.program,
      year: student.year,
      section: student.section
    });

    return true;
  };

  const handleRegisterForEvent = async (event) => {
    try {
      const token = localStorage.getItem('token');
      
      // Use unified registration state logic
      const regState = computeRegistrationState(event);
      if (!regState.isOpen) {
        toast.error(regState.reason || 'Registration is closed');
        return;
      }

      // Check if already registered
      const existingRegistration = myRegistrations.find(reg => reg.eventId === event._id);
      if (existingRegistration) {
        toast.error('You are already registered for this event');
        return;
      }

      const registrationData = {
        eventId: event._id,
        participantId: user._id,
        participantName: user.name,
        participantEmail: user.email,
        participantRole: user.role,
        participantDetails: user.student || user.faculty || user.trainer
      };

      const response = await axios.post(`${API_URL}/registrations`, registrationData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const newRegistration = response.data.data || response.data;
      setMyRegistrations([...myRegistrations, newRegistration]);
      
      // Update event's current count
      setEvents(events.map(e => 
        e._id === event._id 
          ? { ...e, registration: { ...e.registration, currentCount: (e.registration.currentCount || 0) + 1 } }
          : e
      ));

      toast.success('Successfully registered for the event!');
      
      // Update stats
      setStats(prev => ({
        ...prev,
        myRegistrations: prev.myRegistrations + 1
      }));

    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to register for event';
      toast.error(errorMessage);
    }
  };

  const handleViewEventDetails = (event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const handleCancelRegistration = async (registration) => {
    if (!window.confirm('Are you sure you want to cancel your registration?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/registrations/${registration._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMyRegistrations(myRegistrations.filter(reg => reg._id !== registration._id));
      
      // Update event's current count
      const event = events.find(e => e._id === registration.eventId);
      if (event) {
        setEvents(events.map(e => 
          e._id === registration.eventId 
            ? { ...e, registration: { ...e.registration, currentCount: Math.max(0, (e.registration.currentCount || 1) - 1) } }
            : e
        ));
      }

      toast.success('Registration cancelled successfully');
      
      // Update stats
      setStats(prev => ({
        ...prev,
        myRegistrations: Math.max(0, prev.myRegistrations - 1)
      }));

    } catch (error) {
      console.error('Cancel registration error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to cancel registration';
      toast.error(errorMessage);
    }
  };

  const filteredEvents = (Array.isArray(events) ? events : []).filter(event => {
    const matchesSearch = event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.category?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterOptions.category === 'all' || event.category === filterOptions.category;
    
    const matchesStatus = filterOptions.status === 'all' || event.status === filterOptions.status;
    
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

    const matchesEligibility = filterOptions.eligibility === 'all' || 
                              (filterOptions.eligibility === 'eligible' && checkEventEligibility(event)) ||
                              (filterOptions.eligibility === 'not-eligible' && !checkEventEligibility(event));
    
    return matchesSearch && matchesCategory && matchesStatus && matchesTimeframe && matchesEligibility;
  });

  if (loading) {
    return (
      <div className="dashboard-root student-theme">
        <div className="dashboard-header">
          <div className="dashboard-header-inner">
            <div>
              <h1>Student Dashboard</h1>
              <p className="dashboard-subtitle">Discover and register for exciting events</p>
            </div>
          </div>
        </div>

        <div className="dashboard-content">
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
    <div className="dashboard-section">
      {/* Welcome Section */}
      <div className="welcome-section">
        <div className="welcome-inner">
          <div className="welcome-text">
            <h2>Welcome back, {user?.name || 'Student'}! 🎓</h2>
            <p className="welcome-subtitle">Student Dashboard</p>
            {user?.student && (
              <div className="welcome-details">
                <p className="semi">{user.student.department} • {user.student.program} • Year {user.student.year}</p>
                <p>Roll Number: {user.student.rollNumber} • Section: {user.student.section}</p>
              </div>
            )}
          </div>
          <div className="welcome-emoji">🎓</div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card card-blue">
          <div className="stat-inner">
            <div>
              <p className="stat-label">Available Events</p>
              <p className="stat-value">{stats?.availableEvents || 0}</p>
              <p className="stat-note">Events you can register for</p>
            </div>
            <div className="stat-icon">📅</div>
          </div>
        </div>

        <div className="stat-card card-green">
          <div className="stat-inner">
            <div>
              <p className="stat-label">My Registrations</p>
              <p className="stat-value">{stats?.myRegistrations || 0}</p>
              <p className="stat-note">Events you've registered for</p>
            </div>
            <div className="stat-icon">📝</div>
          </div>
        </div>

        <div className="stat-card card-purple">
          <div className="stat-inner">
            <div>
              <p className="stat-label">Events Attended</p>
              <p className="stat-value">{stats?.attendedEvents || 0}</p>
              <p className="stat-note">Successfully completed events</p>
            </div>
            <div className="stat-icon">🎯</div>
          </div>
        </div>

        <div className="stat-card card-orange">
          <div className="stat-inner">
            <div>
              <p className="stat-label">Certificates Earned</p>
              <p className="stat-value">{stats?.certificatesEarned || 0}</p>
              <p className="stat-note">Achievement certificates</p>
            </div>
            <div className="stat-icon">🏆</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="dashboard-card">
        <h3>Quick Actions</h3>
        <div className="actions-grid">
          <button onClick={() => setActiveTab('events')} className="btn-primary">Browse Events</button>
          <button onClick={() => setActiveTab('registrations')} className="btn-primary">My Registrations</button>
          <button onClick={() => setActiveTab('certificates')} className="btn-primary">My Certificates</button>
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="dashboard-card">
        <h3>Upcoming Events</h3>
        <div className="upcoming-list">
          {(Array.isArray(events) ? events : []).filter(event => new Date(event.startDate) > new Date()).slice(0, 5).map(event => {
            const isEligible = checkEventEligibility(event);
            const isRegistered = myRegistrations.some(reg => reg.eventId === event._id);
            const regState = computeRegistrationState(event);
            
            return (
              <div key={event._id} className="upcoming-item">
                <div>
                  <h4 className="semi">{event.title}</h4>
                  <p className="event-meta">
                    <span className="event-category">{event.category}</span> • <span className="event-date">{new Date(event.startDate).toLocaleDateString()}</span>
                  </p>
                  <div className="badges">
                    {isEligible ? (
                      <span className="badge badge-green">Eligible</span>
                    ) : (
                      <span className="badge badge-red">Not Eligible</span>
                    )}
                    {isRegistered && (
                      <span className="badge badge-blue">Registered</span>
                    )}
                  </div>
                </div>
                {isEligible && !isRegistered && (
                  <button onClick={() => handleRegisterForEvent(event)} className="btn-primary small" disabled={!regState.isOpen}>
                    {regState.isOpen ? '📝 Register' : '⏰ Closed'}
                  </button>
                )}
              </div>
            );
          })}
          {(Array.isArray(events) ? events : []).filter(event => new Date(event.startDate) > new Date()).length === 0 && (
            <p className="muted center">No upcoming events available.</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderEvents = () => (
    <div className="dashboard-section">
      <h2 className="section-title">Available Events</h2>

      {/* Search and Filters */}
      <div className="dashboard-card">
        <div className="filters-grid">
          <div className="filter-group">
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
            />
          </div>
          
          <div className="filter-group">
            <select
              value={filterOptions.category}
              onChange={(e) => setFilterOptions({...filterOptions, category: e.target.value})}
              className="form-select"
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
          </div>
          
          <div className="filter-group">
            <select
              value={filterOptions.timeframe}
              onChange={(e) => setFilterOptions({...filterOptions, timeframe: e.target.value})}
              className="form-select"
            >
              <option value="all">All Time</option>
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="filter-group">
            <select
              value={filterOptions.eligibility}
              onChange={(e) => setFilterOptions({...filterOptions, eligibility: e.target.value})}
              className="form-select"
            >
              <option value="all">All Events</option>
              <option value="eligible">Eligible for Me</option>
              <option value="not-eligible">Not Eligible</option>
            </select>
          </div>
        </div>
      </div>

      {/* Events Grid */}
      <div className="events-grid">
        {filteredEvents.map(event => {
          const isEligible = checkEventEligibility(event);
          const isRegistered = myRegistrations.some(reg => reg.eventId === event._id);
          const regState = computeRegistrationState(event);
          
          return (
            <div key={event._id} className="event-card">
              <div className="event-header">
                <h4>{event.title}</h4>
                <span className={`event-type ${event.category?.toLowerCase()}`}>{event.category}</span>
              </div>
              
              <p className="event-description">{event.description}</p>
              
              <div className="event-details">
                <p><strong>Date:</strong> {new Date(event.startDate).toLocaleDateString()}</p>
                <p><strong>Time:</strong> {new Date(event.startDate).toLocaleTimeString()}</p>
                <p><strong>Location:</strong> {event.location}</p>
                {event.registration?.required && (
                  <p><strong>Registration:</strong> {event.registration.currentCount || 0}/{event.registration.maxParticipants}</p>
                )}
              </div>

              <div className="event-badges">
                {isEligible ? (
                  <span className="badge badge-green">✓ Eligible</span>
                ) : (
                  <span className="badge badge-red">✗ Not Eligible</span>
                )}
                
                {isRegistered && (
                  <span className="badge badge-blue">📝 Registered</span>
                )}
              </div>

              <div className="event-actions">
                {isEligible && !isRegistered && (
                  <button 
                    onClick={() => handleRegisterForEvent(event)} 
                    className="registration-button"
                    disabled={!regState.isOpen}
                  >
                    {regState.isOpen ? '📝 Register Now' : `⏰ ${regState.reason || 'Registration Closed'}`}
                  </button>
                )}
                {isRegistered && (
                  <div className="registration-status registered">
                    ✓ You are registered
                  </div>
                )}
                {!isEligible && (
                  <div className="registration-status not-available">
                    Not eligible for this event
                  </div>
                )}
                
                {/* Always show view details button */}
                <button 
                  onClick={() => handleViewEventDetails(event)} 
                  className="details-button"
                >
                  👁️ View Details
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredEvents.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📅</div>
          <h3>No events found</h3>
          <p>No events match your current search criteria.</p>
        </div>
      )}
    </div>
  );

  const renderRegistrations = () => (
    <div className="dashboard-section">
      <h2 className="section-title">My Registrations</h2>
      
      <div className="dashboard-card table-card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Date</th>
                <th>Status</th>
                <th>Registered On</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {myRegistrations.map(registration => {
                const event = events.find(e => e._id === registration.eventId);
                return (
                  <tr key={registration._id}>
                    <td>
                      <div className="table-cell-main">
                        <div className="cell-title">{event?.title || 'Unknown Event'}</div>
                        <div className="cell-subtitle">{event?.category}</div>
                      </div>
                    </td>
                    <td className="table-cell-date">
                      {event ? new Date(event.startDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td>
                      <span className={`status-badge status-${registration.status}`}>
                        {registration.status}
                      </span>
                    </td>
                    <td className="table-cell-date">
                      {new Date(registration.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <button 
                        onClick={() => handleCancelRegistration(registration)}
                        className="btn-outline btn-danger"
                        disabled={registration.status === 'cancelled'}
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {myRegistrations.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h3>No registrations yet</h3>
            <p>You haven't registered for any events yet.</p>
            <button onClick={() => setActiveTab('events')} className="btn-primary">
              Browse Events
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderCertificates = () => (
    <div className="dashboard-section">
      <h2 className="section-title">My Certificates</h2>
      
      <div className="certificates-grid">
        {certificates.map(certificate => (
          <div key={certificate._id} className="certificate-card">
            <div className="certificate-header">
              <div className="certificate-icon">🏆</div>
              <h3>{certificate.eventTitle}</h3>
            </div>
            
            <div className="certificate-details">
              <p className="issued-date">
                Issued on {new Date(certificate.issuedDate).toLocaleDateString()}
              </p>
              {certificate.verificationCode && (
                <p className="verification-code">
                  <strong>Verification:</strong> {certificate.verificationCode}
                </p>
              )}
            </div>
            
            <div className="certificate-actions">
              <button className="btn-primary">View Certificate</button>
              <button className="btn-secondary">Download PDF</button>
            </div>
          </div>
        ))}
      </div>
      
      {certificates.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🏆</div>
          <h3>No certificates earned yet</h3>
          <p>Complete events to earn certificates and showcase your achievements!</p>
          <button onClick={() => setActiveTab('events')} className="btn-primary">
            Browse Events
          </button>
        </div>
      )}
    </div>
  );

  const tabs = [
    { key: 'overview', label: 'Overview', icon: '🏠' },
    { key: 'events', label: 'Events', icon: '📅' },
    { key: 'registrations', label: 'My Registrations', icon: '📝' },
    { key: 'certificates', label: 'Certificates', icon: '🏆' }
  ];

  return (
    <div className="dashboard-root student-theme">
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-header-inner">
          <div>
            <h1>Student Dashboard</h1>
            <p className="dashboard-subtitle">Discover and register for exciting events</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="dashboard-tabs-wrap">
        <div className="dashboard-tabs">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={"dashboard-tab" + (activeTab === tab.key ? ' active' : '')}
            >
              <span className="dashboard-tab-icon">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {error && (
          <div className="error-banner">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'events' && renderEvents()}
        {activeTab === 'registrations' && renderRegistrations()}
        {activeTab === 'certificates' && renderCertificates()}
      </div>
    </div>
  );
};

export default EnhancedStudentDashboard;