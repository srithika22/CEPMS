import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import '../../styles/dashboard.css';

const CompactEventManagement = ({ onClose }) => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hoveredEvent, setHoveredEvent] = useState(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [viewMode, setViewMode] = useState('compact'); // compact, list, grid
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    dateRange: 'all',
    hasRegistrations: 'all'
  });
  
  const hoverTimeoutRef = useRef(null);
  const popupRef = useRef(null);

  // Mock events data with enhanced details
  const mockEvents = [
    {
      _id: 'evt1',
      title: 'AI & Machine Learning Workshop',
      description: 'Comprehensive workshop covering fundamentals of AI, machine learning algorithms, and practical implementation using Python and TensorFlow.',
      category: 'workshop',
      status: 'upcoming',
      startDate: new Date('2025-12-15T09:00:00Z'),
      endDate: new Date('2025-12-15T17:00:00Z'),
      venue: 'Main Auditorium',
      capacity: 150,
      registrations: [
        { _id: '1', name: 'John Doe', email: 'john@example.com', registeredAt: new Date('2025-11-01') },
        { _id: '2', name: 'Jane Smith', email: 'jane@example.com', registeredAt: new Date('2025-11-02') }
      ],
      waitlist: [],
      organizer: 'Dr. Mike Wilson',
      department: 'CSE',
      tags: ['AI', 'Machine Learning', 'Python'],
      prerequisites: 'Basic programming knowledge',
      certificateOffered: true,
      fee: 500,
      resources: ['Laptop required', 'Software will be provided'],
      agenda: [
        { time: '09:00-10:30', topic: 'Introduction to AI' },
        { time: '11:00-12:30', topic: 'Machine Learning Basics' },
        { time: '14:00-15:30', topic: 'Hands-on with Python' },
        { time: '16:00-17:00', topic: 'Project Implementation' }
      ],
      feedback: { average: 4.5, count: 12 },
      createdAt: new Date('2025-10-15'),
      lastUpdated: new Date('2025-11-05')
    },
    {
      _id: 'evt2',
      title: 'Cloud Computing Seminar',
      description: 'Industry experts discussing latest trends in cloud computing, AWS services, and cloud architecture best practices.',
      category: 'seminar',
      status: 'ongoing',
      startDate: new Date('2025-11-10T14:00:00Z'),
      endDate: new Date('2025-11-10T16:00:00Z'),
      venue: 'Conference Hall B',
      capacity: 100,
      registrations: [
        { _id: '1', name: 'John Doe', email: 'john@example.com', registeredAt: new Date('2025-10-25') }
      ],
      waitlist: [],
      organizer: 'Prof. Sarah Johnson',
      department: 'CSE',
      tags: ['Cloud Computing', 'AWS', 'Architecture'],
      prerequisites: 'None',
      certificateOffered: false,
      fee: 0,
      resources: ['Presentation slides will be shared'],
      agenda: [
        { time: '14:00-14:30', topic: 'Cloud Computing Overview' },
        { time: '14:30-15:30', topic: 'AWS Services Deep Dive' },
        { time: '15:30-16:00', topic: 'Q&A Session' }
      ],
      feedback: { average: 4.2, count: 8 },
      createdAt: new Date('2025-10-01'),
      lastUpdated: new Date('2025-11-03')
    },
    {
      _id: 'evt3',
      title: 'Web Development Bootcamp',
      description: 'Intensive 3-day bootcamp covering HTML5, CSS3, JavaScript, React, and Node.js for full-stack web development.',
      category: 'bootcamp',
      status: 'completed',
      startDate: new Date('2025-10-20T09:00:00Z'),
      endDate: new Date('2025-10-22T17:00:00Z'),
      venue: 'Computer Lab 1',
      capacity: 30,
      registrations: [
        { _id: '3', name: 'Alice Johnson', email: 'alice@example.com', registeredAt: new Date('2025-10-01') },
        { _id: '4', name: 'Bob Wilson', email: 'bob@example.com', registeredAt: new Date('2025-10-02') }
      ],
      waitlist: [],
      organizer: 'Mr. Tech Trainer',
      department: 'CSE',
      tags: ['Web Development', 'React', 'Node.js', 'Full Stack'],
      prerequisites: 'Basic HTML/CSS knowledge',
      certificateOffered: true,
      fee: 1500,
      resources: ['Development environment setup guide', 'Code repositories'],
      agenda: [
        { time: 'Day 1', topic: 'HTML5 & CSS3 Fundamentals' },
        { time: 'Day 2', topic: 'JavaScript & React' },
        { time: 'Day 3', topic: 'Node.js & Project Development' }
      ],
      feedback: { average: 4.8, count: 25 },
      createdAt: new Date('2025-09-15'),
      lastUpdated: new Date('2025-10-25')
    }
  ];

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      // Replace with actual API call
      setTimeout(() => {
        setEvents(mockEvents);
        setLoading(false);
      }, 1000);
    } catch (err) {
      setError('Failed to fetch events');
      setLoading(false);
    }
  };

  const handleMouseEnter = (event, mouseEvent) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    setHoverPosition({
      x: mouseEvent.clientX + 10,
      y: mouseEvent.clientY + 10
    });
    
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredEvent(event);
    }, 300);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    setTimeout(() => {
      if (!popupRef.current?.matches(':hover')) {
        setHoveredEvent(null);
      }
    }, 100);
  };

  const handlePopupMouseLeave = () => {
    setHoveredEvent(null);
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

  const getStatusIcon = (status) => {
    const icons = {
      upcoming: '🗓️',
      ongoing: '🔴',
      completed: '✅',
      cancelled: '❌'
    };
    return icons[status] || '📅';
  };

  const getCategoryColor = (category) => {
    const colors = {
      workshop: '#8b5cf6',
      seminar: '#06b6d4',
      bootcamp: '#f59e0b',
      conference: '#ef4444',
      training: '#10b981'
    };
    return colors[category] || '#6b7280';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getFilteredEvents = () => {
    return events.filter(event => {
      if (filters.status !== 'all' && event.status !== filters.status) return false;
      if (filters.category !== 'all' && event.category !== filters.category) return false;
      if (filters.hasRegistrations !== 'all') {
        const hasRegs = event.registrations.length > 0;
        if (filters.hasRegistrations === 'yes' && !hasRegs) return false;
        if (filters.hasRegistrations === 'no' && hasRegs) return false;
      }
      return true;
    });
  };

  const filteredEvents = getFilteredEvents();

  const toggleEventSelection = (eventId) => {
    setSelectedEvents(prev => 
      prev.includes(eventId) 
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    );
  };

  const handleBulkAction = (action) => {
    if (selectedEvents.length === 0) {
      alert('Please select events first');
      return;
    }

    switch (action) {
      case 'export':
        exportEvents(selectedEvents);
        break;
      case 'duplicate':
        duplicateEvents(selectedEvents);
        break;
      case 'cancel':
        if (window.confirm(`Cancel ${selectedEvents.length} events?`)) {
          cancelEvents(selectedEvents);
        }
        break;
      case 'delete':
        if (window.confirm(`Delete ${selectedEvents.length} events?`)) {
          deleteEvents(selectedEvents);
        }
        break;
    }
  };

  const exportEvents = (eventIds) => {
    const exportData = events.filter(e => eventIds.includes(e._id));
    const csvContent = convertEventsToCSV(exportData);
    downloadCSV(csvContent, 'events_export.csv');
  };

  const convertEventsToCSV = (data) => {
    const headers = ['Title', 'Category', 'Status', 'Start Date', 'End Date', 'Venue', 'Capacity', 'Registrations', 'Organizer'];
    const rows = data.map(event => [
      event.title,
      event.category,
      event.status,
      formatDate(event.startDate),
      formatDate(event.endDate),
      event.venue,
      event.capacity,
      event.registrations.length,
      event.organizer
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const downloadCSV = (content, filename) => {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const duplicateEvents = (eventIds) => {
    // Implementation for duplicating events
    console.log('Duplicating events:', eventIds);
  };

  const cancelEvents = (eventIds) => {
    setEvents(prev => prev.map(event => 
      eventIds.includes(event._id) ? { ...event, status: 'cancelled' } : event
    ));
    setSelectedEvents([]);
  };

  const deleteEvents = (eventIds) => {
    setEvents(prev => prev.filter(event => !eventIds.includes(event._id)));
    setSelectedEvents([]);
  };

  return (
    <div className="compact-event-management">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="page-title">Compact Event Management</h2>
            <p className="page-subtitle">Efficient event overview with hover details and participant management</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '8px', padding: '4px' }}>
              <button
                onClick={() => setViewMode('compact')}
                className={viewMode === 'compact' ? 'view-mode-btn active' : 'view-mode-btn'}
              >
                📋 Compact
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? 'view-mode-btn active' : 'view-mode-btn'}
              >
                📝 List
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={viewMode === 'grid' ? 'view-mode-btn active' : 'view-mode-btn'}
              >
                🔲 Grid
              </button>
            </div>
            <button onClick={onClose} className="btn-secondary">
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-body">
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="form-field" style={{ minWidth: '150px' }}>
              <select
                className="form-select"
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="all">All Status</option>
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="form-field" style={{ minWidth: '150px' }}>
              <select
                className="form-select"
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              >
                <option value="all">All Categories</option>
                <option value="workshop">Workshop</option>
                <option value="seminar">Seminar</option>
                <option value="bootcamp">Bootcamp</option>
                <option value="conference">Conference</option>
                <option value="training">Training</option>
              </select>
            </div>

            <div className="form-field" style={{ minWidth: '150px' }}>
              <select
                className="form-select"
                value={filters.hasRegistrations}
                onChange={(e) => setFilters(prev => ({ ...prev, hasRegistrations: e.target.value }))}
              >
                <option value="all">All Events</option>
                <option value="yes">With Registrations</option>
                <option value="no">No Registrations</option>
              </select>
            </div>

            <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.875rem', color: '#64748b', padding: '0.5rem 0' }}>
                {filteredEvents.length} events
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedEvents.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem', background: '#f0f9ff', border: '1px solid #0ea5e9' }}>
          <div className="card-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>{selectedEvents.length} events selected</strong>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={() => handleBulkAction('export')} className="btn-sm btn-secondary">
                  📊 Export
                </button>
                <button onClick={() => handleBulkAction('duplicate')} className="btn-sm btn-secondary">
                  📋 Duplicate
                </button>
                <button onClick={() => handleBulkAction('cancel')} className="btn-sm btn-warning">
                  ❌ Cancel
                </button>
                <button onClick={() => handleBulkAction('delete')} className="btn-sm btn-danger">
                  🗑️ Delete
                </button>
                <button onClick={() => setSelectedEvents([])} className="btn-sm btn-secondary">
                  Clear Selection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Events Display */}
      <div className="card">
        <div className="card-body">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner">
                <div className="spinner"></div>
                <p className="loading-text">Loading events...</p>
              </div>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#dc2626' }}>
              <p>{error}</p>
              <button onClick={fetchEvents} className="btn-primary" style={{ marginTop: '1rem' }}>
                Retry
              </button>
            </div>
          ) : (
            <div className={`events-${viewMode}`}>
              {filteredEvents.map(event => (
                <div
                  key={event._id}
                  className={`event-card-${viewMode} ${selectedEvents.includes(event._id) ? 'selected' : ''}`}
                  onMouseEnter={(e) => handleMouseEnter(event, e)}
                  onMouseLeave={handleMouseLeave}
                  style={{ cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <input
                      type="checkbox"
                      checked={selectedEvents.includes(event._id)}
                      onChange={() => toggleEventSelection(event._id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '1.1rem' }}>
                          {getStatusIcon(event.status)}
                        </span>
                        <h4 style={{ 
                          margin: 0, 
                          fontSize: viewMode === 'compact' ? '0.95rem' : '1.1rem',
                          fontWeight: '600',
                          color: '#1e293b',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {event.title}
                        </h4>
                        <span 
                          className="badge"
                          style={{ 
                            background: getCategoryColor(event.category),
                            color: 'white',
                            fontSize: '0.75rem'
                          }}
                        >
                          {event.category}
                        </span>
                      </div>
                      
                      <div style={{ 
                        display: 'flex', 
                        gap: '1rem', 
                        fontSize: '0.8rem', 
                        color: '#64748b',
                        flexWrap: viewMode === 'compact' ? 'nowrap' : 'wrap'
                      }}>
                        <span>📅 {formatDate(event.startDate)}</span>
                        <span>📍 {event.venue}</span>
                        <span>👥 {event.registrations.length}/{event.capacity}</span>
                        <span 
                          style={{ 
                            color: getStatusColor(event.status),
                            fontWeight: '500'
                          }}
                        >
                          ● {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn-sm btn-secondary" title="Edit Event">
                        ✏️
                      </button>
                      <button className="btn-sm btn-secondary" title="View Participants">
                        👥
                      </button>
                      <button className="btn-sm btn-secondary" title="More Actions">
                        ⋮
                      </button>
                    </div>
                  </div>

                  {/* Progress bar for capacity */}
                  {viewMode !== 'compact' && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: '0.25rem'
                      }}>
                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          Registration Progress
                        </span>
                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          {((event.registrations.length / event.capacity) * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div style={{ 
                        width: '100%', 
                        height: '4px', 
                        background: '#f1f5f9', 
                        borderRadius: '2px',
                        overflow: 'hidden'
                      }}>
                        <div style={{ 
                          width: `${(event.registrations.length / event.capacity) * 100}%`,
                          height: '100%',
                          background: event.registrations.length >= event.capacity ? '#ef4444' : '#3b82f6',
                          borderRadius: '2px',
                          transition: 'width 0.3s ease'
                        }}></div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Hover Details Popup */}
      {hoveredEvent && (
        <div
          ref={popupRef}
          className="event-hover-popup"
          style={{
            position: 'fixed',
            left: hoverPosition.x,
            top: hoverPosition.y,
            zIndex: 1000,
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            maxWidth: '400px',
            width: 'max-content'
          }}
          onMouseLeave={handlePopupMouseLeave}
        >
          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', fontWeight: '600', color: '#1e293b' }}>
              {hoveredEvent.title}
            </h3>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b', lineHeight: '1.4' }}>
              {hoveredEvent.description}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>Date & Time</div>
              <div style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                {formatDate(hoveredEvent.startDate)}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                {formatTime(hoveredEvent.startDate)} - {formatTime(hoveredEvent.endDate)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>Venue</div>
              <div style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                {hoveredEvent.venue}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>Organizer</div>
              <div style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                {hoveredEvent.organizer}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                {hoveredEvent.department}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>Fee</div>
              <div style={{ fontSize: '0.9rem', fontWeight: '500', color: hoveredEvent.fee === 0 ? '#10b981' : '#1e293b' }}>
                {hoveredEvent.fee === 0 ? 'Free' : `₹${hoveredEvent.fee}`}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem' }}>Registration Status</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ 
                flex: 1, 
                height: '6px', 
                background: '#f1f5f9', 
                borderRadius: '3px',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  width: `${(hoveredEvent.registrations.length / hoveredEvent.capacity) * 100}%`,
                  height: '100%',
                  background: hoveredEvent.registrations.length >= hoveredEvent.capacity ? '#ef4444' : '#3b82f6',
                  borderRadius: '3px'
                }}></div>
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>
                {hoveredEvent.registrations.length}/{hoveredEvent.capacity}
              </span>
            </div>
          </div>

          {hoveredEvent.tags && hoveredEvent.tags.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem' }}>Tags</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {hoveredEvent.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="badge"
                    style={{ 
                      background: '#f1f5f9',
                      color: '#475569',
                      fontSize: '0.75rem'
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {hoveredEvent.feedback && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Rating</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                    {hoveredEvent.feedback.average}/5
                  </span>
                  <span style={{ color: '#f59e0b' }}>⭐</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Reviews</div>
                <div style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                  {hoveredEvent.feedback.count}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CompactEventManagement;