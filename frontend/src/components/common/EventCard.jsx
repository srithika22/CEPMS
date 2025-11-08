import React from 'react';

const EventCard = ({ 
  event, 
  actions,
  showRegistrationInfo = false,
  showCoordinatorInfo = false,
  variant = 'default' // default, compact, detailed
}) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'ongoing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'CRT': return 'bg-purple-100 text-purple-800';
      case 'FDP': return 'bg-indigo-100 text-indigo-800'; 
      case 'Workshop': return 'bg-blue-100 text-blue-800';
      case 'Cultural': return 'bg-pink-100 text-pink-800';
      case 'Sports': return 'bg-orange-100 text-orange-800';
      case 'Seminar': return 'bg-teal-100 text-teal-800';
      case 'Conference': return 'bg-cyan-100 text-cyan-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short', 
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (variant === 'compact') {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900">{event.title}</h4>
            <p className="text-sm text-gray-600">{formatDate(event.startDate)}</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
              {event.status}
            </span>
            {actions}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-gray-300">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(event.category)}`}>
                {event.category}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(event.status)}`}>
                {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
              </span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{event.title}</h3>
            {event.description && (
              <p className="text-gray-600 text-sm line-clamp-2">{event.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Event Details */}
      <div className="px-6 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center text-gray-600">
            <span className="mr-2">📅</span>
            <span>{formatDate(event.startDate)} - {formatDate(event.endDate)}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <span className="mr-2">⏰</span>
            <span>{formatTime(event.startDate)} - {formatTime(event.endDate)}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <span className="mr-2">📍</span>
            <span>{event.venue?.type === 'online' ? 'Online' : event.venue?.location || 'TBD'}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <span className="mr-2">🎯</span>
            <span>{event.type || 'General'}</span>
          </div>
        </div>
      </div>

      {/* Registration Info */}
      {showRegistrationInfo && event.registration?.required && (
        <div className="px-6 pb-4">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-800 font-medium">Registration</span>
              <span className="text-blue-600">
                {event.registration.currentCount || 0} / {event.registration.maxParticipants} registered
              </span>
            </div>
            <div className="mt-2 bg-blue-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${Math.min(100, ((event.registration.currentCount || 0) / event.registration.maxParticipants) * 100)}%` 
                }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Coordinator Info */}
      {showCoordinatorInfo && event.coordinator && (
        <div className="px-6 pb-4">
          <div className="flex items-center text-sm text-gray-600">
            <span className="mr-2">👤</span>
            <span>Coordinator: {event.coordinator.name || event.coordinator.email}</span>
          </div>
        </div>
      )}

      {/* Actions */}
      {actions && (
        <div className="px-6 pb-6">
          <div className="flex items-center justify-end space-x-3">
            {actions}
          </div>
        </div>
      )}
    </div>
  );
};

export default EventCard;