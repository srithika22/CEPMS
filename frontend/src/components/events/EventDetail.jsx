import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EventDetail = ({ eventId, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [event, setEvent] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({});

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📋' },
    { id: 'participants', label: 'Participants', icon: '👥' },
    { id: 'attendance', label: 'Attendance', icon: '✅' },
    { id: 'sessions', label: 'Sessions', icon: '🎯' },
    { id: 'analytics', label: 'Analytics', icon: '📊' }
  ];

  useEffect(() => {
    fetchEventDetails();
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch event details
      const eventRes = await axios.get(`/api/events/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Fetch sessions
      const sessionsRes = await axios.get(`/api/sessions/event/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Fetch participants
      const participantsRes = await axios.get(`/api/events/${eventId}/participants`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Fetch attendance data
      const attendanceRes = await axios.get(`/api/attendance/event/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setEvent(eventRes.data);
      setSessions(sessionsRes.data);
      setParticipants(participantsRes.data);
      setAttendance(attendanceRes.data);
      
      // Calculate analytics
      calculateAnalytics(sessionsRes.data, attendanceRes.data, participantsRes.data);
    } catch (error) {
      console.error('Error fetching event details:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (sessionData, attendanceData, participantData) => {
    const totalSessions = sessionData.length;
    const totalParticipants = participantData.length;
    const totalAttendanceRecords = attendanceData.length;
    
    // Calculate attendance rate
    const expectedAttendance = totalSessions * totalParticipants;
    const attendanceRate = expectedAttendance > 0 ? (totalAttendanceRecords / expectedAttendance * 100) : 0;
    
    // Session-wise attendance
    const sessionAttendance = sessionData.map(session => {
      const sessionAttendees = attendanceData.filter(att => att.session === session._id);
      return {
        sessionId: session._id,
        sessionTitle: session.title,
        attendees: sessionAttendees.length,
        rate: totalParticipants > 0 ? (sessionAttendees.length / totalParticipants * 100) : 0
      };
    });

    // Participant-wise attendance
    const participantAttendance = participantData.map(participant => {
      const participantRecords = attendanceData.filter(att => att.participant === participant._id);
      return {
        participantId: participant._id,
        participantName: participant.name || participant.email,
        sessionsAttended: participantRecords.length,
        rate: totalSessions > 0 ? (participantRecords.length / totalSessions * 100) : 0
      };
    });

    setAnalytics({
      totalSessions,
      totalParticipants,
      attendanceRate: attendanceRate.toFixed(1),
      sessionAttendance,
      participantAttendance,
      averageSessionAttendance: sessionAttendance.length > 0 ? 
        (sessionAttendance.reduce((sum, s) => sum + s.rate, 0) / sessionAttendance.length).toFixed(1) : 0
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Event Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(event.category)}`}>
                {event.category}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(event.status)}`}>
                {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{event.title}</h1>
            <p className="text-gray-600 text-lg">{event.description}</p>
          </div>
        </div>
      </div>

      {/* Event Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center mb-2">
            <span className="text-2xl mr-3">📅</span>
            <h3 className="font-semibold text-gray-900">Date & Time</h3>
          </div>
          <p className="text-gray-600">{formatDate(event.startDate)} - {formatDate(event.endDate)}</p>
          <p className="text-sm text-gray-500">{formatTime(event.startDate)} - {formatTime(event.endDate)}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center mb-2">
            <span className="text-2xl mr-3">📍</span>
            <h3 className="font-semibold text-gray-900">Venue</h3>
          </div>
          <p className="text-gray-600">
            {event.venue?.type === 'online' ? 'Online Event' : event.venue?.location || 'TBD'}
          </p>
          {event.venue?.details && (
            <p className="text-sm text-gray-500">{event.venue.details}</p>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center mb-2">
            <span className="text-2xl mr-3">👤</span>
            <h3 className="font-semibold text-gray-900">Coordinator</h3>
          </div>
          <p className="text-gray-600">{event.coordinator?.name || 'Not Assigned'}</p>
          <p className="text-sm text-gray-500">{event.coordinator?.email}</p>
        </div>
      </div>

      {/* Registration Info */}
      {event.registration?.required && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Registration Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {event.registration.currentCount || 0}
              </div>
              <div className="text-sm text-gray-600">Registered</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {event.registration.maxParticipants}
              </div>
              <div className="text-sm text-gray-600">Max Capacity</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {Math.max(0, event.registration.maxParticipants - (event.registration.currentCount || 0))}
              </div>
              <div className="text-sm text-gray-600">Available</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderParticipants = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Participants ({participants.length})</h2>
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Participant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registration Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Attendance Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {participants.map((participant) => {
                const participantAttendance = analytics.participantAttendance?.find(
                  pa => pa.participantId === participant._id
                );
                return (
                  <tr key={participant._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {participant.name || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">{participant.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {participant.role || 'Participant'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {participant.registrationDate ? formatDate(participant.registrationDate) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <div className="flex-1 mr-2">
                          <div className="text-sm font-medium">
                            {participantAttendance ? `${participantAttendance.rate}%` : '0%'}
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${participantAttendance ? participantAttendance.rate : 0}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderAttendance = () => (
    <div className="space-y-6">
      {/* Attendance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{analytics.totalSessions}</div>
          <div className="text-sm text-gray-600">Total Sessions</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{analytics.totalParticipants}</div>
          <div className="text-sm text-gray-600">Total Participants</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{analytics.attendanceRate}%</div>
          <div className="text-sm text-gray-600">Overall Attendance</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{analytics.averageSessionAttendance}%</div>
          <div className="text-sm text-gray-600">Avg Session Attendance</div>
        </div>
      </div>

      {/* Session-wise Attendance */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Session-wise Attendance</h3>
        <div className="space-y-4">
          {analytics.sessionAttendance?.map((session) => (
            <div key={session.sessionId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">{session.sessionTitle}</h4>
                <p className="text-sm text-gray-600">{session.attendees} attendees</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">{session.rate.toFixed(1)}%</div>
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${session.rate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Attendance Matrix */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Attendance Matrix</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Participant
                </th>
                {sessions.map((session) => (
                  <th key={session._id} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {session.title}
                  </th>
                ))}
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {participants.map((participant) => (
                <tr key={participant._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {participant.name || participant.email}
                  </td>
                  {sessions.map((session) => {
                    const isPresent = attendance.some(
                      att => att.participant === participant._id && att.session === session._id
                    );
                    return (
                      <td key={session._id} className="px-3 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                          isPresent ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {isPresent ? '✓' : '✗'}
                        </span>
                      </td>
                    );
                  })}
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    {attendance.filter(att => att.participant === participant._id).length} / {sessions.length}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderSessions = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Sessions ({sessions.length})</h2>
      </div>
      
      <div className="grid gap-4">
        {sessions.map((session) => {
          const sessionAttendance = analytics.sessionAttendance?.find(sa => sa.sessionId === session._id);
          return (
            <div key={session._id} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{session.title}</h3>
                  {session.description && (
                    <p className="text-gray-600 mb-4">{session.description}</p>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center text-gray-600">
                      <span className="mr-2">📅</span>
                      <span>{formatDate(session.date)}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <span className="mr-2">⏰</span>
                      <span>{formatTime(session.startTime)} - {formatTime(session.endTime)}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <span className="mr-2">👨‍🏫</span>
                      <span>{session.trainer?.name || 'TBD'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="ml-6 text-right">
                  <div className="text-sm text-gray-500 mb-1">Attendance</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {sessionAttendance ? `${sessionAttendance.rate.toFixed(1)}%` : '0%'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {sessionAttendance ? `${sessionAttendance.attendees}` : '0'} / {participants.length}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">{analytics.attendanceRate}%</div>
          <div className="text-sm text-blue-800 font-medium">Overall Attendance Rate</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">{analytics.averageSessionAttendance}%</div>
          <div className="text-sm text-green-800 font-medium">Avg Session Attendance</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 text-center">
          <div className="text-3xl font-bold text-purple-600 mb-2">{analytics.totalSessions}</div>
          <div className="text-sm text-purple-800 font-medium">Total Sessions</div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6 text-center">
          <div className="text-3xl font-bold text-orange-600 mb-2">{analytics.totalParticipants}</div>
          <div className="text-sm text-orange-800 font-medium">Total Participants</div>
        </div>
      </div>

      {/* Attendance Trends */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Attendance Trends</h3>
        <div className="space-y-3">
          {analytics.sessionAttendance?.map((session, index) => (
            <div key={session.sessionId} className="flex items-center space-x-4">
              <div className="flex-shrink-0 w-8 text-center text-sm text-gray-500">
                {index + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900">{session.sessionTitle}</span>
                  <span className="text-sm text-gray-600">{session.rate.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${session.rate}%` }}
                  ></div>
                </div>
              </div>
              <div className="flex-shrink-0 text-sm text-gray-500">
                {session.attendees}/{analytics.totalParticipants}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Performers */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Participant Performance</h3>
        <div className="space-y-3">
          {analytics.participantAttendance?.sort((a, b) => b.rate - a.rate).slice(0, 10).map((participant, index) => (
            <div key={participant.participantId} className="flex items-center space-x-4">
              <div className="flex-shrink-0 w-8 text-center">
                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                  index < 3 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'
                }`}>
                  {index + 1}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900">{participant.participantName}</span>
                  <span className="text-sm text-gray-600">{participant.rate.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      participant.rate >= 90 ? 'bg-gradient-to-r from-green-500 to-green-600' :
                      participant.rate >= 75 ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                      participant.rate >= 60 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                      'bg-gradient-to-r from-red-500 to-red-600'
                    }`}
                    style={{ width: `${participant.rate}%` }}
                  ></div>
                </div>
              </div>
              <div className="flex-shrink-0 text-sm text-gray-500">
                {participant.sessionsAttended}/{analytics.totalSessions}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-600">Loading event details...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 text-center">
          <p className="text-gray-600 mb-4">Event not found</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-7xl w-full h-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Event Details</h1>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'participants' && renderParticipants()}
          {activeTab === 'attendance' && renderAttendance()}
          {activeTab === 'sessions' && renderSessions()}
          {activeTab === 'analytics' && renderAnalytics()}
        </div>
      </div>
    </div>
  );
};

export default EventDetail;