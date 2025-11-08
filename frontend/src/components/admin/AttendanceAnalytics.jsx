import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import '../../styles/dashboard.css';

const AttendanceAnalytics = ({ onClose }) => {
  const { user } = useAuth();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('30');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    department: 'all',
    year: 'all',
    eventType: 'all'
  });

  useEffect(() => {
    fetchEvents();
    fetchOverallAnalytics();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      fetchEventAnalytics(selectedEvent._id);
    }
  }, [selectedEvent]);

  const fetchEvents = async () => {
    try {
      const config = {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      };
      const response = await axios.get('/api/events', config);
      
      if (response.data.success) {
        let eventsData = response.data.data;
        if (eventsData && eventsData.events && Array.isArray(eventsData.events)) {
          eventsData = eventsData.events;
        }
        setEvents(Array.isArray(eventsData) ? eventsData : []);
      }
    } catch (err) {
      console.error('Fetch events error:', err);
    }
  };

  const fetchOverallAnalytics = async () => {
    setLoading(true);
    try {
      const config = {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      };
      
      // Mock analytics data for now - replace with real API calls
      const mockAnalytics = {
        summary: {
          totalEvents: 15,
          totalSessions: 47,
          totalParticipants: 324,
          averageAttendance: 78.5,
          completedEvents: 12,
          ongoingEvents: 3
        },
        departmentStats: [
          { department: 'CSE', events: 6, avgAttendance: 82.3, participants: 145 },
          { department: 'ECE', events: 4, avgAttendance: 75.8, participants: 98 },
          { department: 'MECH', events: 3, avgAttendance: 71.2, participants: 67 },
          { department: 'IT', events: 2, avgAttendance: 85.1, participants: 14 }
        ],
        attendanceTrends: [
          { month: 'Jan', attendance: 75 },
          { month: 'Feb', attendance: 78 },
          { month: 'Mar', attendance: 82 },
          { month: 'Apr', attendance: 79 },
          { month: 'May', attendance: 85 },
          { month: 'Jun', attendance: 80 }
        ],
        eventTypeStats: [
          { type: 'Workshop', count: 8, avgAttendance: 81.2 },
          { type: 'Seminar', count: 4, avgAttendance: 76.5 },
          { type: 'Training', count: 2, avgAttendance: 89.3 },
          { type: 'Conference', count: 1, avgAttendance: 92.1 }
        ],
        topPerformingEvents: [
          { title: 'AI & ML Workshop', attendance: 94.2, sessions: 8 },
          { title: 'Cloud Computing Bootcamp', attendance: 91.8, sessions: 6 },
          { title: 'Web Development Training', attendance: 88.5, sessions: 5 }
        ],
        lowAttendanceEvents: [
          { title: 'Database Management Seminar', attendance: 62.3, sessions: 4 },
          { title: 'Network Security Workshop', attendance: 58.7, sessions: 3 }
        ]
      };

      setAnalyticsData(mockAnalytics);
    } catch (err) {
      setError('Failed to fetch analytics data');
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEventAnalytics = async (eventId) => {
    try {
      const config = {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      };
      const response = await axios.get(`/api/attendance/event/${eventId}/export`, config);
      
      if (response.data.success) {
        // Process event-specific analytics from export data
        const exportData = response.data.data;
        console.log('Event analytics data:', exportData);
      }
    } catch (err) {
      console.error('Event analytics fetch error:', err);
    }
  };

  const exportAnalyticsReport = () => {
    if (!analyticsData) return;

    const csvData = [
      ['Analytics Report - Generated on', new Date().toLocaleString()],
      [''],
      ['SUMMARY STATISTICS'],
      ['Total Events', analyticsData.summary.totalEvents],
      ['Total Sessions', analyticsData.summary.totalSessions],
      ['Total Participants', analyticsData.summary.totalParticipants],
      ['Average Attendance %', analyticsData.summary.averageAttendance.toFixed(1)],
      [''],
      ['DEPARTMENT PERFORMANCE'],
      ['Department', 'Events', 'Avg Attendance %', 'Participants'],
      ...analyticsData.departmentStats.map(dept => [
        dept.department, dept.events, dept.avgAttendance.toFixed(1), dept.participants
      ]),
      [''],
      ['TOP PERFORMING EVENTS'],
      ['Event Title', 'Attendance %', 'Sessions'],
      ...analyticsData.topPerformingEvents.map(event => [
        event.title, event.attendance.toFixed(1), event.sessions
      ])
    ];

    const csvContent = csvData.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `attendance_analytics_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const StatCard = ({ title, value, subtitle, color = '#3b82f6' }) => (
    <div className="card" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)' }}>
      <div className="card-body" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: '500', color: '#64748b', textTransform: 'uppercase' }}>
              {title}
            </h3>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: color, marginBottom: '0.25rem' }}>
              {value}
            </div>
            {subtitle && (
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
                {subtitle}
              </p>
            )}
          </div>
          <div style={{ 
            width: '60px', 
            height: '60px', 
            borderRadius: '50%', 
            background: `${color}20`, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: '1.5rem'
          }}>
            📊
          </div>
        </div>
      </div>
    </div>
  );

  const ChartCard = ({ title, children }) => (
    <div className="card">
      <div className="card-body">
        <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.1rem', fontWeight: '600' }}>
          {title}
        </h3>
        {children}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="attendance-analytics">
        <div className="page-header">
          <h2 className="page-title">Attendance Analytics</h2>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📊</div>
            <p>Loading analytics data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="attendance-analytics">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="page-title">Attendance Analytics Dashboard</h2>
            <p className="page-subtitle">Comprehensive attendance insights and reports</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={exportAnalyticsReport} className="btn-primary">
              📊 Export Report
            </button>
            <button onClick={onClose} className="btn-secondary">
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      {analyticsData && (
        <>
          {/* Summary Statistics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <StatCard 
              title="Total Events" 
              value={analyticsData.summary.totalEvents}
              subtitle="All time"
              color="#3b82f6"
            />
            <StatCard 
              title="Total Sessions" 
              value={analyticsData.summary.totalSessions}
              subtitle="Across all events"
              color="#10b981"
            />
            <StatCard 
              title="Total Participants" 
              value={analyticsData.summary.totalParticipants}
              subtitle="Registered users"
              color="#f59e0b"
            />
            <StatCard 
              title="Average Attendance" 
              value={`${analyticsData.summary.averageAttendance}%`}
              subtitle="Overall performance"
              color="#ef4444"
            />
          </div>

          {/* Filters */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <div className="card-body">
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: '600' }}>🔍 Analytics Filters</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div className="form-field">
                  <label className="form-label">Time Frame</label>
                  <select 
                    className="form-input"
                    value={selectedTimeframe}
                    onChange={(e) => setSelectedTimeframe(e.target.value)}
                  >
                    <option value="7">Last 7 days</option>
                    <option value="30">Last 30 days</option>
                    <option value="90">Last 3 months</option>
                    <option value="365">Last year</option>
                    <option value="all">All time</option>
                  </select>
                </div>
                
                <div className="form-field">
                  <label className="form-label">Department</label>
                  <select 
                    className="form-input"
                    value={filters.department}
                    onChange={(e) => setFilters({...filters, department: e.target.value})}
                  >
                    <option value="all">All Departments</option>
                    <option value="CSE">Computer Science</option>
                    <option value="ECE">Electronics</option>
                    <option value="MECH">Mechanical</option>
                    <option value="IT">Information Technology</option>
                  </select>
                </div>
                
                <div className="form-field">
                  <label className="form-label">Event Type</label>
                  <select 
                    className="form-input"
                    value={filters.eventType}
                    onChange={(e) => setFilters({...filters, eventType: e.target.value})}
                  >
                    <option value="all">All Types</option>
                    <option value="workshop">Workshop</option>
                    <option value="seminar">Seminar</option>
                    <option value="training">Training</option>
                    <option value="conference">Conference</option>
                  </select>
                </div>

                <div className="form-field">
                  <label className="form-label">Specific Event</label>
                  <select 
                    className="form-input"
                    value={selectedEvent?._id || ''}
                    onChange={(e) => setSelectedEvent(events.find(event => event._id === e.target.value) || null)}
                  >
                    <option value="">All Events</option>
                    {events.map(event => (
                      <option key={event._id} value={event._id}>
                        {event.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Department Performance */}
          <ChartCard title="📈 Department Performance Analysis">
            <div style={{ overflowX: 'auto' }}>
              <table className="analytics-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Department</th>
                    <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '2px solid #e2e8f0' }}>Events</th>
                    <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '2px solid #e2e8f0' }}>Participants</th>
                    <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '2px solid #e2e8f0' }}>Avg Attendance</th>
                    <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '2px solid #e2e8f0' }}>Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsData.departmentStats.map((dept, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '1rem', fontWeight: '600' }}>{dept.department}</td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>{dept.events}</td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>{dept.participants}</td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <span style={{ 
                          background: dept.avgAttendance >= 80 ? '#dcfce7' : dept.avgAttendance >= 70 ? '#fef3c7' : '#fef2f2',
                          color: dept.avgAttendance >= 80 ? '#166534' : dept.avgAttendance >= 70 ? '#d97706' : '#dc2626',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.875rem',
                          fontWeight: '500'
                        }}>
                          {dept.avgAttendance.toFixed(1)}%
                        </span>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <div style={{ 
                          width: '100%', 
                          height: '8px', 
                          background: '#e2e8f0', 
                          borderRadius: '4px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${dept.avgAttendance}%`,
                            height: '100%',
                            background: dept.avgAttendance >= 80 ? '#10b981' : dept.avgAttendance >= 70 ? '#f59e0b' : '#ef4444',
                            transition: 'width 0.3s ease'
                          }}></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ChartCard>

          {/* Attendance Trends */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginTop: '2rem' }}>
            <ChartCard title="📊 Monthly Attendance Trends">
              <div style={{ display: 'flex', alignItems: 'end', gap: '1rem', height: '200px', padding: '1rem 0' }}>
                {analyticsData.attendanceTrends.map((trend, index) => (
                  <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{
                      width: '100%',
                      height: `${(trend.attendance / 100) * 150}px`,
                      background: 'linear-gradient(to top, #3b82f6, #60a5fa)',
                      borderRadius: '4px 4px 0 0',
                      marginBottom: '0.5rem',
                      position: 'relative'
                    }}>
                      <div style={{
                        position: 'absolute',
                        top: '-1.5rem',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: '#374151'
                      }}>
                        {trend.attendance}%
                      </div>
                    </div>
                    <span style={{ fontSize: '0.875rem', color: '#64748b' }}>{trend.month}</span>
                  </div>
                ))}
              </div>
            </ChartCard>

            <ChartCard title="🎯 Event Type Performance">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {analyticsData.eventTypeStats.map((eventType, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ minWidth: '80px', fontSize: '0.875rem', fontWeight: '500' }}>
                      {eventType.type}
                    </div>
                    <div style={{ flex: 1, height: '20px', background: '#e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${eventType.avgAttendance}%`,
                        height: '100%',
                        background: `hsl(${120 + (index * 40)}, 60%, 50%)`,
                        borderRadius: '10px',
                        transition: 'width 0.5s ease'
                      }}></div>
                    </div>
                    <div style={{ minWidth: '60px', textAlign: 'right', fontSize: '0.875rem', fontWeight: '600' }}>
                      {eventType.avgAttendance.toFixed(1)}%
                    </div>
                    <div style={{ minWidth: '60px', textAlign: 'right', fontSize: '0.75rem', color: '#64748b' }}>
                      ({eventType.count} events)
                    </div>
                  </div>
                ))}
              </div>
            </ChartCard>
          </div>

          {/* Top and Bottom Performers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginTop: '2rem' }}>
            <ChartCard title="🏆 Top Performing Events">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {analyticsData.topPerformingEvents.map((event, index) => (
                  <div key={index} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    padding: '1rem',
                    background: '#f0fdf4',
                    borderRadius: '8px',
                    border: '1px solid #bbf7d0'
                  }}>
                    <div style={{ 
                      width: '30px', 
                      height: '30px', 
                      borderRadius: '50%', 
                      background: '#10b981', 
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.875rem',
                      fontWeight: '700',
                      marginRight: '1rem'
                    }}>
                      {index + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{event.title}</div>
                      <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                        {event.sessions} sessions • {event.attendance.toFixed(1)}% attendance
                      </div>
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#10b981' }}>
                      {event.attendance.toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            </ChartCard>

            <ChartCard title="⚠️ Events Needing Attention">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {analyticsData.lowAttendanceEvents.map((event, index) => (
                  <div key={index} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    padding: '1rem',
                    background: '#fef2f2',
                    borderRadius: '8px',
                    border: '1px solid #fecaca'
                  }}>
                    <div style={{ 
                      width: '30px', 
                      height: '30px', 
                      borderRadius: '50%', 
                      background: '#ef4444', 
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.875rem',
                      fontWeight: '700',
                      marginRight: '1rem'
                    }}>
                      ⚠️
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{event.title}</div>
                      <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                        {event.sessions} sessions • Needs improvement
                      </div>
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#ef4444' }}>
                      {event.attendance.toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            </ChartCard>
          </div>
        </>
      )}

      {/* Error Message */}
      {error && (
        <div style={{ 
          position: 'fixed', 
          bottom: '20px', 
          right: '20px', 
          background: '#fef2f2', 
          border: '1px solid #fecaca',
          color: '#dc2626',
          padding: '1rem',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          zIndex: 1000
        }}>
          {error}
          <button 
            onClick={() => setError('')}
            style={{ marginLeft: '1rem', background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default AttendanceAnalytics;