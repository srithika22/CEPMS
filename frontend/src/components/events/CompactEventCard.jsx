import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import '../../styles/dashboard.css';

const CompactEventCard = ({ event, onEdit, onDelete, onApprove, onReject, onRegister, showActions = true, compact = true }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isRegistrationOpen = () => {
    if (!event.registration?.required) return false;
    const now = new Date();
    const startDate = new Date(event.registration.startDate);
    const endDate = new Date(event.registration.endDate);
    return now >= startDate && now <= endDate && event.registration.isOpen;
  };

  const getRegistrationStatus = () => {
    if (!event.registration?.required) return 'No Registration Required';
    if (isRegistrationOpen()) return 'Registration Open';
    
    const now = new Date();
    const startDate = new Date(event.registration.startDate);
    const endDate = new Date(event.registration.endDate);
    
    if (now < startDate) return 'Registration Not Started';
    if (now > endDate) return 'Registration Closed';
    if (!event.registration.isOpen) return 'Registration Paused';
    
    return 'Registration Closed';
  };

  const handleActionClick = async (action) => {
    setLoading(true);
    try {
      await action();
    } finally {
      setLoading(false);
    }
  };

  const canUserEdit = () => {
    return user?.role === 'admin' || 
           (user?.role === 'faculty' && event.coordinator?.id === user._id);
  };

  const canUserApprove = () => {
    return user?.role === 'admin' && event.status === 'pending';
  };

  const canUserRegister = () => {
    return user?.role === 'student' && 
           event.status === 'approved' && 
           isRegistrationOpen() &&
           !isUserRegistered();
  };

  const isUserRegistered = () => {
    return event.registrations?.some(reg => reg.userId === user?._id);
  };

  const handleRegister = async () => {
    if (!onRegister) return;
    setRegistering(true);
    try {
      await onRegister(event._id);
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className={`event-card ${compact && !showDetails ? 'compact' : 'expanded'}`}>
      {/* Header with Status and Category */}
      <div className={`event-card-header ${compact && !showDetails ? 'compact' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <h3 className={`event-card-title ${compact && !showDetails ? 'compact' : ''}`}>{event.title}</h3>
            <p className={`event-card-description ${compact && !showDetails ? 'compact' : ''}`}>{event.description}</p>
            
            <div className={`event-badges ${compact && !showDetails ? 'compact' : ''}`}>
              <span className={`event-badge ${compact && !showDetails ? 'compact' : ''} status-${event.status}`}>
                {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
              </span>
              <span className={`event-badge ${compact && !showDetails ? 'compact' : ''} category-${event.category.toLowerCase()}`}>
                {event.category}
              </span>
              <span className={`event-badge ${compact && !showDetails ? 'compact' : ''} type`}>
                {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
              </span>
            </div>
          </div>
          
          {event.eventId && (
            <div className="event-id">
              <p className="event-id-label">Event ID</p>
              <p className="event-id-value">{event.eventId}</p>
            </div>
          )}
        </div>
      </div>

      {/* Event Details */}
      <div className="event-card-body">
        {/* Basic Info - Always shown */}
        <div className="event-details-grid">
          <div className="event-detail-item">
            <p className="event-detail-label">📅 Duration</p>
            <p className="event-detail-value">
              {formatDate(event.startDate)}
              {event.startDate !== event.endDate && ` - ${formatDate(event.endDate)}`}
            </p>
          </div>
          
          <div className="event-detail-item">
            <p className="event-detail-label">📍 Venue</p>
            <p className="event-detail-value">{event.venue?.name}</p>
          </div>
        </div>

        {/* More Details Button for compact mode */}
        {compact && (
          <button 
            className={`more-details-btn ${compact ? 'compact' : ''}`}
            onClick={() => setShowDetails(!showDetails)}
          >
            <span>{showDetails ? 'Less Details' : 'More Details'}</span>
            <span style={{ transform: showDetails ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
              ▼
            </span>
          </button>
        )}

        {/* Extended Details - shown when not compact or when details are expanded */}
        {(!compact || showDetails) && (
          <div style={{ marginTop: '1rem' }}>
            {/* Registration Info */}
            {event.registration?.required && (
              <div className="event-registration-section">
                <div className="registration-status">
                  <p className="registration-label">Registration</p>
                  <span className={`registration-badge ${
                    isRegistrationOpen() 
                      ? 'open' 
                      : getRegistrationStatus() === 'Registration Not Started'
                      ? 'not-started'
                      : 'closed'
                  }`}>
                    {getRegistrationStatus()}
                  </span>
                </div>
                
                <div className="registration-details">
                  <div className="registration-detail">
                    <p className="registration-detail-label">Period</p>
                    <p className="registration-detail-value">
                      {formatDate(event.registration.startDate)} - {formatDate(event.registration.endDate)}
                    </p>
                  </div>
                  <div className="registration-detail">
                    <p className="registration-detail-label">Capacity</p>
                    <p className="registration-detail-value">
                      {event.registration.currentCount || 0} / {event.registration.maxParticipants}
                    </p>
                  </div>
                </div>
                
                {/* Registration Button for Students */}
                {user?.role === 'student' && (
                  <div style={{ 
                    marginTop: '1rem', 
                    paddingTop: '0.75rem', 
                    borderTop: '1px solid #e2e8f0' 
                  }}>
                    {isUserRegistered() ? (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        color: '#065f46',
                        fontSize: '0.875rem',
                        fontWeight: '500'
                      }}>
                        <span>✓ You are registered for this event</span>
                      </div>
                    ) : canUserRegister() ? (
                      <button
                        onClick={handleRegister}
                        disabled={registering}
                        className="event-action-btn register"
                        style={{ width: '100%' }}
                      >
                        {registering ? 'Registering...' : 'Register for Event'}
                      </button>
                    ) : (
                      <div style={{ 
                        textAlign: 'center', 
                        color: '#6b7280', 
                        fontSize: '0.875rem' 
                      }}>
                        {event.status !== 'approved' ? 'Event not approved yet' :
                         !isRegistrationOpen() ? 'Registration not open' :
                         'Registration not available'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Eligibility */}
            {(event.eligibility?.departments?.length > 0 || 
              event.eligibility?.programs?.length > 0 || 
              event.eligibility?.years?.length > 0) && (
              <div className="event-detail-item">
                <p className="event-detail-label">🎯 Eligibility</p>
                <div className="event-detail-value" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {event.eligibility.departments?.length > 0 && (
                    <p><span style={{ fontWeight: '500' }}>Departments:</span> {event.eligibility.departments.join(', ')}</p>
                  )}
                  {event.eligibility.programs?.length > 0 && (
                    <p><span style={{ fontWeight: '500' }}>Programs:</span> {event.eligibility.programs.join(', ')}</p>
                  )}
                  {event.eligibility.years?.length > 0 && (
                    <p><span style={{ fontWeight: '500' }}>Years:</span> {event.eligibility.years.join(', ')}</p>
                  )}
                </div>
              </div>
            )}

            {/* Trainers */}
            {event.trainers?.length > 0 && (
              <div className="event-detail-item">
                <p className="event-detail-label">👨‍🏫 Trainers</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {event.trainers.map((trainer, index) => (
                    <span 
                      key={index}
                      className="event-badge category-crt"
                      style={{ fontSize: '0.75rem' }}
                    >
                      {trainer.name}
                      {trainer.organization && (
                        <span style={{ marginLeft: '0.25rem', color: '#3b82f6' }}>({trainer.organization})</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Features */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {event.certificate?.enabled && (
                <span className="event-badge category-fdp" style={{ fontSize: '0.75rem' }}>
                  🏆 Certificate Available
                </span>
              )}
              {event.feedback?.enabled && (
                <span className="event-badge category-workshop" style={{ fontSize: '0.75rem' }}>
                  💬 Feedback Collection
                </span>
              )}
              {event.venue?.isOnline && (
                <span className="event-badge category-crt" style={{ fontSize: '0.75rem' }}>
                  🌐 Online Event
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer with Coordinator and Actions */}
      <div className="event-card-footer">
        {/* Coordinator */}
        {event.coordinator && (
          <div style={{ flex: 1 }}>
            <p className="event-detail-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Event Coordinator</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#475569', margin: 0 }}>{event.coordinator.name}</p>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>{event.coordinator.email}</p>
              </div>
              {event.coordinator.department && (
                <span className="event-badge type" style={{ fontSize: '0.75rem' }}>
                  {event.coordinator.department}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {showActions && (
          <div className="event-actions">
            {canUserEdit() && (
              <button
                onClick={() => handleActionClick(() => onEdit(event))}
                disabled={loading}
                className="event-action-btn edit"
              >
                ✏️ Edit
              </button>
            )}
            
            {canUserApprove() && (
              <>
                <button
                  onClick={() => handleActionClick(() => onApprove(event))}
                  disabled={loading}
                  className="event-action-btn approve"
                >
                  ✅ Approve
                </button>
                <button
                  onClick={() => handleActionClick(() => onReject(event))}
                  disabled={loading}
                  className="event-action-btn reject"
                >
                  ❌ Reject
                </button>
              </>
            )}
            
            {canUserEdit() && (
              <button
                onClick={() => handleActionClick(() => onDelete(event))}
                disabled={loading}
                className="event-action-btn delete"
              >
                🗑️ Delete
              </button>
            )}
          </div>
        )}

        {/* Event Meta Information */}
        <div className="event-meta">
          <div className="event-meta-item">
            <span>📅</span>
            <span>Created {formatDateTime(event.createdAt)}</span>
          </div>
          {event.updatedAt && event.updatedAt !== event.createdAt && (
            <div className="event-meta-item">
              <span>📝</span>
              <span>Updated {formatDateTime(event.updatedAt)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompactEventCard;