import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { ProfilePictureUpload } from '../FileUpload';
import SearchAndFilter from '../SearchAndFilter';
import { toast } from 'react-hot-toast';

const StudentDashboard = () => {
  const { user } = useAuth();
  const { emitRegistrationCreated } = useSocket();
  const [activeSection, setActiveSection] = useState('overview');
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [stats, setStats] = useState({
    availableEvents: 0,
    registeredEvents: 0,
    upcomingEvents: 0,
    completedEvents: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Fetch available events
      const eventsResponse = await fetch('http://localhost:5000/api/events', {
        headers
      });
      
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        const eventsList = Array.isArray(eventsData.events) ? eventsData.events : (Array.isArray(eventsData) ? eventsData : []);
        setEvents(eventsList);
        
        // Filter events for student's department or open to all
        const availableEvents = eventsList.filter(event => 
          event.department === user?.department || event.department === 'All Departments'
        );
        
        setStats(prev => ({ 
          ...prev, 
          availableEvents: availableEvents.length,
          upcomingEvents: availableEvents.filter(e => new Date(e.date) > new Date()).length
        }));
      }

      // Mock registrations data for now
      // Fetch student's registrations so we can show registered state and counts
      try {
        const regsResponse = await fetch('http://localhost:5000/api/registrations/my-registrations', { headers });
        if (regsResponse.ok) {
          const regsData = await regsResponse.json();
          const regsList = Array.isArray(regsData.registrations) ? regsData.registrations : (Array.isArray(regsData) ? regsData : []);
          setMyRegistrations(regsList);
          setStats(prev => ({ 
            ...prev, 
            registeredEvents: regsList.length,
            completedEvents: regsList.filter(r => r.status === 'attended' || r.status === 'completed').length
          }));
        } else {
          // fallback mock values
          setStats(prev => ({ 
            ...prev, 
            registeredEvents: 0,
            completedEvents: 0
          }));
        }
      } catch (regErr) {
        console.warn('Failed to fetch my registrations:', regErr.message);
        setStats(prev => ({ 
          ...prev, 
          registeredEvents: 0,
          completedEvents: 0
        }));
      }
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterForEvent = async (eventId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/registrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ eventId })
      });

      if (response.ok) {
        const registrationData = await response.json();
        
        // Emit real-time notification
        emitRegistrationCreated({
          eventId,
          studentId: user.id,
          studentName: user.name,
          studentEmail: user.email,
          registrationId: registrationData._id
        });
        
        alert('Successfully registered for event!');
        fetchDashboardData(); // Refresh data
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Error registering for event:', error);
    }
  };

  const renderOverview = () => (
    <div className="dashboard-overview">
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <h3>Available Events</h3>
            <p className="stat-number">{stats.availableEvents}</p>
          </div>
        </div>
        
        <div className="stat-card secondary">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>Registered Events</h3>
            <p className="stat-number">{stats.registeredEvents}</p>
          </div>
        </div>
        
        <div className="stat-card success">
          <div className="stat-icon">🔜</div>
          <div className="stat-content">
            <h3>Upcoming Events</h3>
            <p className="stat-number">{stats.upcomingEvents}</p>
          </div>
        </div>
        
        <div className="stat-card warning">
          <div className="stat-icon">🎓</div>
          <div className="stat-content">
            <h3>Completed Events</h3>
            <p className="stat-number">{stats.completedEvents}</p>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="action-buttons">
          <button 
            className="btn-primary"
            onClick={() => setActiveSection('events')}
          >
            Browse Events
          </button>
          <button 
            className="btn-secondary"
            onClick={() => setActiveSection('registrations')}
          >
            My Registrations
          </button>
          <button 
            className="btn-secondary"
            onClick={() => setActiveSection('schedule')}
          >
            My Schedule
          </button>
        </div>
      </div>

      <div className="recent-events">
        <h3>Upcoming Events</h3>
        <div className="events-list">
          {(Array.isArray(events) ? events : [])
            .filter(event => new Date(event.date) > new Date())
            .slice(0, 3)
            .map(event => (
            <div key={event._id} className="event-item">
              <div className="event-info">
                <h4>{event.title}</h4>
                <p>{new Date(event.date).toLocaleDateString()} - {event.location}</p>
              </div>
              <span className={`event-status ${event.status}`}>
                {event.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderEvents = () => {
    const availableEvents = (Array.isArray(events) ? events : []).filter(event => 
      event.department === user?.department || 
      event.department === 'All Departments'
    );

    return (
      <div className="events-section">
        <div className="section-header">
          <h3>Available Events</h3>
        </div>
        
        <SearchAndFilter
          data={availableEvents}
          onFilteredResults={setFilteredEvents}
          searchFields={['title', 'description', 'type', 'location']}
          filterOptions={{
            type: ['academic', 'cultural', 'sports', 'technical', 'workshop']
          }}
          placeholder="Search available events..."
          className="events-search"
        />
        
        <div className="events-grid">
          {(filteredEvents.length > 0 ? filteredEvents : availableEvents).map(event => (
            <div key={event._id} className="event-card">
              <div className="event-header">
                <h4>{event.title}</h4>
                <span className={`event-type ${event.type}`}>{event.type}</span>
              </div>
              <p className="event-description">{event.description}</p>
              <div className="event-details">
                <p><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
                <p><strong>Time:</strong> {new Date(event.date).toLocaleTimeString()}</p>
                <p><strong>Location:</strong> {event.location}</p>
                <p><strong>Capacity:</strong> {event.capacity}</p>
                <p><strong>Department:</strong> {event.department}</p>
              </div>
                  <div className="event-actions">
                    {(() => {
                      const now = new Date();
                      const eventDate = new Date(event.date);
                      const isPast = eventDate < now;
                      // robust registered check against various response shapes
                      const isRegistered = Array.isArray(myRegistrations) && myRegistrations.some(r => {
                        const evt = r.eventId || r.event || (r.eventId && r.eventId._id);
                        const evtId = evt && (evt._id || evt);
                        return String(evtId) === String(event._id) || String(r.event) === String(event._id);
                      });
                      const regClosed = event.registration && event.registration.isOpen === false;

                      let label = 'Register';
                      if (isPast) label = 'Event Passed';
                      else if (isRegistered) label = 'Registered';
                      else if (regClosed) label = 'Registration Closed';

                      const disabled = isPast || isRegistered || regClosed;

                      return (
                        <>
                          <button 
                            className="btn-primary"
                            onClick={() => handleRegisterForEvent(event._id)}
                            disabled={disabled}
                          >
                            {label}
                          </button>
                          <button className="btn-outline" onClick={() => handleViewEventDetails(event)}>
                            View Details
                          </button>
                        </>
                      );
                    })()}
                  </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderRegistrations = () => (
    <div className="registrations-section">
      <div className="section-header">
        <h3>My Registrations</h3>
      </div>
      
      <div className="registrations-list">
        {/* Mock registrations for now */}
        <div className="registration-card">
          <h4>JavaScript Workshop</h4>
          <p>December 15, 2024 - Computer Lab 1</p>
          <span className="registration-status confirmed">Confirmed</span>
          <div className="registration-actions">
            <button className="btn-outline">View Details</button>
            <button className="btn-outline error">Cancel Registration</button>
          </div>
        </div>
        
        <div className="registration-card">
          <h4>AI and Machine Learning Seminar</h4>
          <p>December 20, 2024 - Auditorium</p>
          <span className="registration-status confirmed">Confirmed</span>
          <div className="registration-actions">
            <button className="btn-outline">View Details</button>
            <button className="btn-outline error">Cancel Registration</button>
          </div>
        </div>
        
        <div className="registration-card">
          <h4>Career Guidance Session</h4>
          <p>December 22, 2024 - Conference Hall</p>
          <span className="registration-status confirmed">Confirmed</span>
          <div className="registration-actions">
            <button className="btn-outline">View Details</button>
            <button className="btn-outline error">Cancel Registration</button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSchedule = () => (
    <div className="schedule-section">
      <div className="section-header">
        <h3>My Schedule</h3>
      </div>
      
      <div className="schedule-calendar">
        <div className="calendar-header">
          <h4>December 2024</h4>
        </div>
        
        <div className="schedule-events">
          <div className="schedule-day">
            <div className="day-header">December 15, 2024</div>
            <div className="day-events">
              <div className="schedule-event">
                <span className="event-time">10:00 AM</span>
                <span className="event-title">JavaScript Workshop</span>
                <span className="event-location">Computer Lab 1</span>
              </div>
            </div>
          </div>
          
          <div className="schedule-day">
            <div className="day-header">December 20, 2024</div>
            <div className="day-events">
              <div className="schedule-event">
                <span className="event-time">2:00 PM</span>
                <span className="event-title">AI and Machine Learning Seminar</span>
                <span className="event-location">Auditorium</span>
              </div>
            </div>
          </div>
          
          <div className="schedule-day">
            <div className="day-header">December 22, 2024</div>
            <div className="day-events">
              <div className="schedule-event">
                <span className="event-time">3:30 PM</span>
                <span className="event-title">Career Guidance Session</span>
                <span className="event-location">Conference Hall</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="section">
      <div className="section-header">
        <h2>My Profile</h2>
        <p>Manage your profile information and settings</p>
      </div>
      
      <div className="profile-content">
        <div className="profile-section">
          <h3>Profile Picture</h3>
          <div className="profile-picture-section">
            {user?.profilePicture && (
              <div className="current-profile-picture">
                <img 
                  src={`http://localhost:5000${user.profilePicture}`} 
                  alt="Profile"
                  className="profile-image"
                />
              </div>
            )}
            <ProfilePictureUpload
              onUploadSuccess={(data) => {
                // Update user context or refresh user data
                toast.success('Profile picture updated successfully');
                window.location.reload(); // Simple refresh for now
              }}
              onUploadError={(error) => {
                toast.error('Failed to update profile picture');
              }}
            />
          </div>
        </div>
        
        <div className="profile-section">
          <h3>Personal Information</h3>
          <div className="profile-info">
            <div className="info-item">
              <label>Name:</label>
              <span>{user?.name}</span>
            </div>
            <div className="info-item">
              <label>Email:</label>
              <span>{user?.email}</span>
            </div>
            <div className="info-item">
              <label>Student ID:</label>
              <span>{user?.studentId}</span>
            </div>
            <div className="info-item">
              <label>Department:</label>
              <span>{user?.department}</span>
            </div>
            <div className="info-item">
              <label>Year:</label>
              <span>{user?.year}</span>
            </div>
            <div className="info-item">
              <label>Section:</label>
              <span>{user?.section}</span>
            </div>
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
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Student Dashboard</h1>
        <p className="dashboard-subtitle">Discover and register for events in your department</p>
      </div>

      <div className="dashboard-nav">
        <button 
          className={`nav-button ${activeSection === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveSection('overview')}
        >
          Overview
        </button>
        <button 
          className={`nav-button ${activeSection === 'events' ? 'active' : ''}`}
          onClick={() => setActiveSection('events')}
        >
          Browse Events
        </button>
        <button 
          className={`nav-button ${activeSection === 'registrations' ? 'active' : ''}`}
          onClick={() => setActiveSection('registrations')}
        >
          My Registrations
        </button>
        <button 
          className={`nav-button ${activeSection === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveSection('schedule')}
        >
          My Schedule
        </button>
        <button 
          className={`nav-button ${activeSection === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveSection('profile')}
        >
          Profile
        </button>
      </div>

      <div className="dashboard-content">
        {activeSection === 'overview' && renderOverview()}
        {activeSection === 'events' && renderEvents()}
        {activeSection === 'registrations' && renderRegistrations()}
        {activeSection === 'schedule' && renderSchedule()}
        {activeSection === 'profile' && renderProfile()}
      </div>
    </div>
  );
};

export default StudentDashboard;