import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useRealtimeDashboard } from '../../hooks/useRealtimeDashboard';
import FileUpload, { ImageUpload, DocumentUpload } from '../FileUpload';
import SearchAndFilter from '../SearchAndFilter';
import AdminManagement from '../AdminManagement';
import SmartUserManagement from '../admin/SmartUserManagement';
import SmartEventManagement from '../admin/SmartEventManagement';
import CompactEventManagement from '../admin/CompactEventManagement';
import AttendanceAnalytics from '../admin/AttendanceAnalytics';
import { toast } from 'react-hot-toast';

const AdminDashboard = () => {
  const { emitEventCreated, emitEventUpdated, emitEventDeleted } = useSocket();
  const [stats, setStats] = useState({
    totalEvents: 0,
    activeUsers: 0,
    totalRegistrations: 0,
    departments: 0
  });
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [activeSection, setActiveSection] = useState('overview');
  const [showCompactEventManagement, setShowCompactEventManagement] = useState(false);
  const [showAttendanceAnalytics, setShowAttendanceAnalytics] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showEditEvent, setShowEditEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    type: 'academic',
    date: '',
    location: '',
    capacity: '',
    department: ''
  });
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Fetch events
      const eventsResponse = await fetch('http://localhost:5000/api/events', {
        headers
      });
      
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        const eventsList = eventsData.events || eventsData;
        setEvents(eventsList);
        setStats(prev => ({ ...prev, totalEvents: eventsList.length }));
      }

      // Fetch users
      const usersResponse = await fetch('http://localhost:5000/api/users', {
        headers
      });
      
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        const usersList = usersData.users || usersData;
        setUsers(usersList);
        setStats(prev => ({ 
          ...prev, 
          activeUsers: usersList.length,
          departments: [...new Set(usersList.map(user => user.department))].length
        }));
      }

      // Fetch registrations count (mock for now)
      setStats(prev => ({ ...prev, totalRegistrations: 42 }));
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Set up real-time dashboard updates
  useRealtimeDashboard(null, fetchDashboardData);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newEvent)
      });

      if (response.ok) {
        const eventData = await response.json();
        setEvents([...events, eventData]);
        
        // Emit real-time notification
        emitEventCreated(eventData);
        
        setNewEvent({
          title: '',
          description: '',
          type: 'academic',
          date: '',
          location: '',
          capacity: '',
          department: ''
        });
        setShowCreateEvent(false);
        fetchDashboardData(); // Refresh stats
      } else {
        const errorData = await response.json();
        console.error('Error creating event:', errorData.message);
      }
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  const handleEditEvent = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/events/${editingEvent._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editingEvent)
      });

      if (response.ok) {
        const updatedEvent = await response.json();
        setEvents(events.map(event => 
          event._id === editingEvent._id ? updatedEvent : event
        ));
        
        // Emit real-time notification
        emitEventUpdated(updatedEvent);
        
        setShowEditEvent(false);
        setEditingEvent(null);
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/events/${eventId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const deletedEvent = events.find(event => event._id === eventId);
          setEvents(events.filter(event => event._id !== eventId));
          
          // Emit real-time notification
          if (deletedEvent) {
            emitEventDeleted(deletedEvent);
          }
          
          fetchDashboardData(); // Refresh stats
        }
      } catch (error) {
        console.error('Error deleting event:', error);
      }
    }
  };

  const openEditModal = (event) => {
    setEditingEvent({ ...event });
    setShowEditEvent(true);
  };

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

  const renderOverview = () => (
    <div className="dashboard-overview">
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <h3>Total Events</h3>
            <p className="stat-number">{stats.totalEvents}</p>
          </div>
        </div>
        
        <div className="stat-card secondary">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Active Users</h3>
            <p className="stat-number">{stats.activeUsers}</p>
          </div>
        </div>
        
        <div className="stat-card success">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <h3>Registrations</h3>
            <p className="stat-number">{stats.totalRegistrations}</p>
          </div>
        </div>
        
        <div className="stat-card warning">
          <div className="stat-icon">🏢</div>
          <div className="stat-content">
            <h3>Departments</h3>
            <p className="stat-number">{stats.departments}</p>
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
            📝 Create New Event
          </button>
          <button 
            className="btn-secondary"
            onClick={() => setActiveSection('events')}
          >
            📅 Manage Events
          </button>
          <button 
            className="btn-secondary"
            onClick={() => setActiveSection('smart-events')}
          >
            🚀 Smart Event Management
          </button>
          <button 
            className="btn-secondary"
            onClick={() => setActiveSection('compact-events')}
          >
            🗂️ Compact Event View
          </button>
          <button 
            className="btn-secondary"
            onClick={() => setActiveSection('users')}
          >
            👥 Manage Users
          </button>
          <button 
            className="btn-secondary"
            onClick={() => setActiveSection('advanced-users')}
          >
            🎯 Advanced User Management
          </button>
        </div>
      </div>
    </div>
  );

  const renderEvents = () => (
    <div className="events-section">
      <div className="section-header">
        <h3>Event Management</h3>
        <button 
          className="btn-primary"
          onClick={() => setShowCreateEvent(true)}
        >
          Create New Event
        </button>
      </div>
      
      <SearchAndFilter
        data={events}
        onFilteredResults={setFilteredEvents}
        searchFields={['title', 'description', 'type', 'department', 'location']}
        filterOptions={{
          type: ['academic', 'cultural', 'sports', 'technical', 'workshop'],
          department: ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Chemical', 'Electrical', 'All Departments'],
          status: ['draft', 'pending', 'approved', 'published', 'ongoing', 'completed', 'cancelled']
        }}
        placeholder="Search events by title, description, type, department, or location..."
        className="events-search"
      />
      
      <div className="events-grid">
        {(filteredEvents.length > 0 ? filteredEvents : events).map(event => (
          <div key={event._id} className="event-card">
            <div className="event-header">
              <h4>{event.title}</h4>
              <span className={`event-type ${event.type}`}>{event.type}</span>
            </div>
            <p className="event-description">{event.description}</p>
            <div className="event-details">
              <p><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
              <p><strong>Location:</strong> {event.location}</p>
              <p><strong>Capacity:</strong> {event.capacity}</p>
              <p><strong>Department:</strong> {event.department}</p>
            </div>
            <div className="event-actions">
              <button 
                className="btn-outline"
                onClick={() => openEditModal(event)}
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

  const renderUsers = () => (
    <div className="users-section">
      <div className="section-header">
        <h3>User Management</h3>
      </div>
      
      <SearchAndFilter
        data={users}
        onFilteredResults={setFilteredUsers}
        searchFields={['name', 'email', 'role', 'department', 'studentId', 'employeeId']}
        filterOptions={{
          role: ['admin', 'faculty', 'student', 'trainer'],
          department: ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'Electrical', 'Chemical', 'Management']
        }}
        placeholder="Search users by name, email, role, or department..."
        className="users-search"
      />
      
      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Department</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(filteredUsers.length > 0 ? filteredUsers : users).map(user => (
              <tr key={user._id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td className={`role ${user.role}`}>{user.role}</td>
                <td>{user.department}</td>
                <td>
                  <button className="btn-outline small">Edit</button>
                  <button className="btn-outline error small">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderCreateEventModal = () => (
    showCreateEvent && (
      <div className="modal-overlay">
        <div className="modal-content">
          <button 
            className="modal-close"
            onClick={() => setShowCreateEvent(false)}
          >
            ×
          </button>
          
          <div className="auth-header">
            <h2>Create New Event</h2>
            <p>Add a new event to the system</p>
          </div>
          
          <form onSubmit={handleCreateEvent} className="form">
            <div className="form-group">
              <label>Event Title</label>
              <input
                type="text"
                value={newEvent.title}
                onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={newEvent.description}
                onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                rows="4"
                required
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Event Type</label>
                <select
                  value={newEvent.type}
                  onChange={(e) => setNewEvent({...newEvent, type: e.target.value})}
                  required
                >
                  <option value="academic">Academic</option>
                  <option value="cultural">Cultural</option>
                  <option value="sports">Sports</option>
                  <option value="technical">Technical</option>
                  <option value="workshop">Workshop</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Department</label>
                <select
                  value={newEvent.department}
                  onChange={(e) => setNewEvent({...newEvent, department: e.target.value})}
                  required
                >
                  <option value="">Select Department</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Mechanical">Mechanical</option>
                  <option value="Civil">Civil</option>
                  <option value="Chemical">Chemical</option>
                  <option value="Electrical">Electrical</option>
                </select>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Date</label>
                <input
                  type="datetime-local"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Capacity</label>
                <input
                  type="number"
                  value={newEvent.capacity}
                  onChange={(e) => setNewEvent({...newEvent, capacity: e.target.value})}
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Location</label>
              <input
                type="text"
                value={newEvent.location}
                onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Event Image</label>
              <ImageUpload
                uploadUrl="/api/uploads/documents"
                onUploadSuccess={(data) => {
                  if (data.files && data.files[0]) {
                    setNewEvent({...newEvent, image: data.files[0].url});
                    toast.success('Event image uploaded successfully');
                  }
                }}
                onUploadError={(error) => {
                  toast.error('Failed to upload event image');
                }}
                buttonText="Upload Event Image"
                className="mb-4"
              />
            </div>
            
            <div className="form-actions">
              <button type="submit" className="btn-primary btn-large">Create Event</button>
              <button 
                type="button" 
                className="btn-secondary"
                onClick={() => setShowCreateEvent(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  );

  const renderEditEventModal = () => (
    showEditEvent && editingEvent && (
      <div className="modal-overlay">
        <div className="modal-content">
          <button 
            className="modal-close"
            onClick={() => {
              setShowEditEvent(false);
              setEditingEvent(null);
            }}
          >
            ×
          </button>
          
          <div className="auth-header">
            <h2>Edit Event</h2>
            <p>Update event details</p>
          </div>
          
          <form onSubmit={handleEditEvent} className="form">
            <div className="form-group">
              <label>Event Title</label>
              <input
                type="text"
                value={editingEvent.title}
                onChange={(e) => setEditingEvent({...editingEvent, title: e.target.value})}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={editingEvent.description}
                onChange={(e) => setEditingEvent({...editingEvent, description: e.target.value})}
                rows="4"
                required
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Event Type</label>
                <select
                  value={editingEvent.type}
                  onChange={(e) => setEditingEvent({...editingEvent, type: e.target.value})}
                  required
                >
                  <option value="academic">Academic</option>
                  <option value="cultural">Cultural</option>
                  <option value="sports">Sports</option>
                  <option value="technical">Technical</option>
                  <option value="workshop">Workshop</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Department</label>
                <select
                  value={editingEvent.department}
                  onChange={(e) => setEditingEvent({...editingEvent, department: e.target.value})}
                  required
                >
                  <option value="">Select Department</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Mechanical">Mechanical</option>
                  <option value="Civil">Civil</option>
                  <option value="Chemical">Chemical</option>
                  <option value="Electrical">Electrical</option>
                </select>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Date</label>
                <input
                  type="datetime-local"
                  value={editingEvent.date ? new Date(editingEvent.date).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setEditingEvent({...editingEvent, date: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Capacity</label>
                <input
                  type="number"
                  value={editingEvent.capacity}
                  onChange={(e) => setEditingEvent({...editingEvent, capacity: e.target.value})}
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Location</label>
              <input
                type="text"
                value={editingEvent.location}
                onChange={(e) => setEditingEvent({...editingEvent, location: e.target.value})}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Event Image</label>
              {editingEvent.image && (
                <div className="current-image">
                  <img 
                    src={`http://localhost:5000${editingEvent.image}`} 
                    alt="Current event"
                    style={{ width: '200px', height: '120px', objectFit: 'cover', borderRadius: '8px', marginBottom: '1rem' }}
                  />
                </div>
              )}
              <ImageUpload
                uploadUrl="/api/uploads/documents"
                onUploadSuccess={(data) => {
                  if (data.files && data.files[0]) {
                    setEditingEvent({...editingEvent, image: data.files[0].url});
                    toast.success('Event image updated successfully');
                  }
                }}
                onUploadError={(error) => {
                  toast.error('Failed to upload event image');
                }}
                buttonText="Update Event Image"
                className="mb-4"
              />
            </div>
            
            <div className="form-actions">
              <button type="submit" className="btn-primary btn-large">Update Event</button>
              <button 
                type="button" 
                className="btn-secondary"
                onClick={() => {
                  setShowEditEvent(false);
                  setEditingEvent(null);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  );

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p className="dashboard-subtitle">Complete system management and oversight</p>
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
          📅 Events
        </button>
        <button 
          className={`nav-button ${activeSection === 'compact-events' ? 'active' : ''}`}
          onClick={() => setActiveSection('compact-events')}
        >
          🗂️ Compact Events
        </button>
        <button 
          className={`nav-button ${activeSection === 'users' ? 'active' : ''}`}
          onClick={() => setActiveSection('users')}
        >
          👥 Users
        </button>
        <button 
          className={`nav-button ${activeSection === 'advanced-users' ? 'active' : ''}`}
          onClick={() => setActiveSection('advanced-users')}
        >
          🎯 Advanced Users
        </button>
        <button 
          className={`nav-button ${activeSection === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveSection('analytics')}
        >
          📊 Attendance Analytics
        </button>
        <button 
          className={`nav-button ${activeSection === 'admin-management' ? 'active' : ''}`}
          onClick={() => setActiveSection('admin-management')}
        >
          🔧 Admin Management
        </button>
      </div>

      <div className="dashboard-content">
        {activeSection === 'overview' && renderOverview()}
        {activeSection === 'events' && renderEvents()}
        {activeSection === 'smart-events' && <SmartEventManagement />}
        {activeSection === 'compact-events' && (
          <CompactEventManagement 
            onClose={() => setActiveSection('overview')}
          />
        )}
        {activeSection === 'users' && renderUsers()}
        {activeSection === 'advanced-users' && (
          <SmartUserManagement />
        )}
        {activeSection === 'analytics' && (
          <AttendanceAnalytics 
            onClose={() => setActiveSection('overview')}
          />
        )}
        {activeSection === 'admin-management' && <AdminManagement />}
      </div>

      {renderCreateEventModal()}
      {renderEditEventModal()}
    </div>
  );
};

export default AdminDashboard;