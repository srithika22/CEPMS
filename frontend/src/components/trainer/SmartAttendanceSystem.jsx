import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import '../../styles/dashboard.css';

const SmartAttendanceSystem = ({ onClose }) => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [attendanceTime, setAttendanceTime] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [rollNoInput, setRollNoInput] = useState('');
  const [quickMarkMode, setQuickMarkMode] = useState('present');
  const [filters, setFilters] = useState({
    year: 'all',
    section: 'all',
    department: 'all',
    attendanceStatus: 'all'
  });
  const [showExportOptions, setShowExportOptions] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      fetchSessions(selectedEvent._id);
      fetchParticipants(selectedEvent._id);
    }
  }, [selectedEvent]);

  useEffect(() => {
    if (selectedSession) {
      loadAttendanceData(selectedSession._id);
    }
  }, [selectedSession]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const config = {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      };
      const response = await axios.get('/api/events/trainer-events', config);
      
      console.log('Events API response:', response.data); // Debug log
      
      if (response.data.success) {
        let eventsData = response.data.data;
        
        // Handle different API response structures
        if (eventsData && eventsData.events && Array.isArray(eventsData.events)) {
          // Paginated response: {data: {events: [...], pagination: {...}}}
          eventsData = eventsData.events;
        } else if (!Array.isArray(eventsData)) {
          // If data is not an array and doesn't have events property
          console.warn('Events data is not an array:', eventsData);
          setEvents([]);
          return;
        }
        
        // For trainers: Get all events, then filter by sessions where user is assigned as trainer
        if (user.role === 'trainer') {
          const eventsWithSessions = [];
          
          for (const event of eventsData) {
            try {
              // Check sessions for this event
              const sessionsResponse = await axios.get(`/api/sessions/event/${event._id}`, config);
              
              if (sessionsResponse.data.success) {
                const eventSessions = sessionsResponse.data.data || [];
                
                // Check if any session has this user as trainer
                const hasTrainerSessions = eventSessions.some(session => 
                  session.trainer && session.trainer.id && session.trainer.id === user._id
                );
                
                if (hasTrainerSessions) {
                  eventsWithSessions.push(event);
                }
              }
            } catch (sessionErr) {
              console.warn(`Failed to fetch sessions for event ${event._id}:`, sessionErr);
            }
          }
          
          setEvents(eventsWithSessions);
        } else {
          // For admin/coordinator: filter events where user is coordinator or admin
          const userEvents = eventsData.filter(event => {
            return user.role === 'admin' || 
                   (event.coordinator && event.coordinator.id === user._id);
          });
          setEvents(userEvents);
        }
      } else {
        console.warn('API response not successful:', response.data);
        setEvents([]);
      }
    } catch (err) {
      setError('Failed to fetch events');
      console.error('Fetch events error:', err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async (eventId) => {
    try {
      const config = {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      };
      const response = await axios.get(`/api/sessions/event/${eventId}`, config);
      
      console.log('Sessions API response:', response.data); // Debug log
      
      if (response.data.success) {
        let sessionsData = response.data.data;
        
        // Handle different API response structures
        if (sessionsData && sessionsData.sessions && Array.isArray(sessionsData.sessions)) {
          sessionsData = sessionsData.sessions;
        } else if (!Array.isArray(sessionsData)) {
          sessionsData = [];
        }
        
        // For trainers: only show sessions where they are assigned as trainer
        if (user.role === 'trainer') {
          sessionsData = sessionsData.filter(session => 
            session.trainer && session.trainer.id && session.trainer.id === user._id
          );
        }
        
        setSessions(sessionsData);
      } else {
        console.warn('Sessions API response not successful:', response.data);
        setSessions([]);
      }
    } catch (err) {
      setError('Failed to fetch sessions');
      console.error('Fetch sessions error:', err);
      setSessions([]);
    }
  };

  const fetchParticipants = async (eventId) => {
    try {
      const config = {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      };
      const response = await axios.get(`/api/registrations/event/${eventId}`, config);
      
      console.log('Participants API response:', response.data); // Debug log
      
      if (response.data.success) {
        let registrations = response.data.data;
        
        // Handle different API response structures
        if (registrations && registrations.registrations && Array.isArray(registrations.registrations)) {
          registrations = registrations.registrations;
        } else if (!Array.isArray(registrations)) {
          registrations = [];
        }
        
        // Transform registration data to participant format
        const participantData = registrations
          .filter(reg => reg.status === 'confirmed')
          .map(reg => ({
            _id: reg.userId?._id || reg.userId,
            rollNo: reg.rollNumber || reg.userId?.student?.rollNumber || 'N/A',
            name: reg.userName || `${reg.userId?.firstName || ''} ${reg.userId?.lastName || ''}`.trim() || 'Unknown',
            dept: reg.department || reg.userId?.student?.department || 'N/A',
            year: reg.userId?.student?.year || 1,
            section: reg.userId?.student?.section || 'A',
            email: reg.userEmail || reg.userId?.email || ''
          }));
        setParticipants(participantData);
      } else {
        console.warn('Participants API response not successful:', response.data);
        setParticipants([]);
      }
    } catch (err) {
      setError('Failed to fetch participants');
      console.error('Fetch participants error:', err);
      setParticipants([]);
    }
  };

  const loadAttendanceData = async (sessionId) => {
    try {
      const config = {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      };
      const response = await axios.get(`/api/attendance/session/${sessionId}`, config);
      
      console.log('Attendance API response:', response.data); // Debug log
      
      if (response.data.success) {
        const attendanceData = response.data.data?.attendance || [];
        const attendanceMap = {};
        const timeMap = {};
        
        // Initialize all participants as unmarked
        participants.forEach(participant => {
          attendanceMap[participant._id] = 'unmarked';
        });
        
        // Update with actual attendance data
        if (Array.isArray(attendanceData)) {
          attendanceData.forEach(att => {
            const userId = att.userId?._id || att.userId;
            if (userId) {
              attendanceMap[userId] = att.present ? 'present' : 'absent';
              timeMap[userId] = new Date(att.markedAt).toLocaleString();
            }
          });
        }
        
        setAttendance(attendanceMap);
        setAttendanceTime(timeMap);
      } else {
        // Initialize empty attendance if no data
        const emptyAttendance = {};
        participants.forEach(participant => {
          emptyAttendance[participant._id] = 'unmarked';
        });
        setAttendance(emptyAttendance);
        setAttendanceTime({});
      }
    } catch (err) {
      // If no attendance data exists yet, initialize empty
      console.log('No attendance data found, initializing empty:', err.message);
      const emptyAttendance = {};
      participants.forEach(participant => {
        emptyAttendance[participant._id] = 'unmarked';
      });
      setAttendance(emptyAttendance);
      setAttendanceTime({});
    }
  };

  const markAttendance = (participantId, status) => {
    setAttendance(prev => ({ ...prev, [participantId]: status }));
    setAttendanceTime(prev => ({ ...prev, [participantId]: new Date().toLocaleString() }));
  };

  const handleRollNoSubmit = (e) => {
    e.preventDefault();
    if (!rollNoInput.trim()) return;

    const participant = participants.find(p => 
      p.rollNo.toLowerCase() === rollNoInput.toLowerCase().trim()
    );

    if (participant) {
      markAttendance(participant._id, quickMarkMode);
      setRollNoInput('');
      // Show success feedback
      const participantElement = document.getElementById(`participant-${participant._id}`);
      if (participantElement) {
        participantElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        participantElement.style.background = quickMarkMode === 'present' ? '#dcfce7' : '#fef2f2';
        setTimeout(() => {
          participantElement.style.background = '';
        }, 1000);
      }
    } else {
      setError(`Roll number "${rollNoInput}" not found`);
      setTimeout(() => setError(''), 3000);
    }
  };

  const bulkMarkAll = (status) => {
    const filteredParticipants = getFilteredParticipants();
    const updatedAttendance = {};
    filteredParticipants.forEach(participant => {
      updatedAttendance[participant._id] = status;
    });
    setAttendance(prev => ({ ...prev, ...updatedAttendance }));
    const timeObj = {};
    filteredParticipants.forEach(p => { timeObj[p._id] = new Date().toLocaleString(); });
    setAttendanceTime(prev => ({ ...prev, ...timeObj }));
  };

  const saveAttendance = async () => {
    if (!selectedSession) {
      setError('Please select a session first');
      return;
    }
    
    setSaving(true);
    try {
      const config = {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      };

      // Prepare attendance records for API
      const attendanceRecords = participants.map(participant => ({
        userId: participant._id,
        present: attendance[participant._id] === 'present',
        remarks: attendance[participant._id] === 'absent' ? 'Marked absent' : ''
      }));

      const attendanceData = {
        sessionId: selectedSession._id,
        attendanceRecords
      };

      const response = await axios.post('/api/attendance/mark', attendanceData, config);
      
      if (response.data.success) {
        setError('');
        alert('Attendance saved successfully!');
        // Reload attendance data to reflect any server-side changes
        await loadAttendanceData(selectedSession._id);
      }
    } catch (err) {
      setError('Failed to save attendance');
      console.error('Save attendance error:', err);
    } finally {
      setSaving(false);
    }
  };

  const getAttendanceStats = () => {
    const filteredParticipants = getFilteredParticipants();
    const stats = {
      total: filteredParticipants.length,
      present: 0,
      absent: 0,
      unmarked: 0
    };

    filteredParticipants.forEach(participant => {
      const status = attendance[participant._id] || 'unmarked';
      stats[status]++;
    });

    return stats;
  };

  const exportToCSV = async () => {
    if (!selectedEvent) {
      setError('Please select an event first');
      return;
    }

    try {
      const config = {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      };
      
      const response = await axios.get(`/api/attendance/event/${selectedEvent._id}/trainer-export`, config);
      
      if (response.data.success) {
        const exportData = response.data.data;
        const csvData = [['Name', 'Email', 'Roll Number', 'Department', 'Total Sessions', 'Attended', 'Percentage', 'Certificate Eligible']];

        exportData.attendance.forEach(record => {
          csvData.push([
            record.name,
            record.email,
            record.rollNumber,
            record.department,
            record['Total Sessions'],
            record['Attended'],
            record['Percentage'],
            record['Certificate Eligible']
          ]);
        });

        const csvContent = csvData.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
          const url = URL.createObjectURL(blob);
          link.setAttribute('href', url);
          const eventTitle = selectedEvent.title.replace(/[^a-z0-9_-]/gi, '_');
          link.setAttribute('download', `${eventTitle}_attendance_export.csv`);
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }
    } catch (err) {
      // Fallback to current session data if export API fails
      const filteredParticipants = getFilteredParticipants();
      const csvData = [['Roll Number', 'Name', 'Year', 'Section', 'Department', 'Attendance', 'Timestamp']];

      filteredParticipants.forEach(participant => {
        const status = attendance[participant._id] || 'unmarked';
        const timestamp = attendanceTime[participant._id] || '';
        csvData.push([participant.rollNo, participant.name, participant.year, participant.section, participant.dept, status, timestamp]);
      });

      const csvContent = csvData.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        const eventTitle = selectedEvent?.title ? selectedEvent.title.replace(/[^a-z0-9_-]/gi, '_') : 'attendance';
        link.setAttribute('download', `${eventTitle}_${attendanceDate}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      console.error('Export error, using fallback:', err);
    }
  };

  const printAttendance = () => {
    const filteredParticipants = getFilteredParticipants();
    const stats = getAttendanceStats();

    const printWindow = window.open('', '_blank');
    const eventTitle = selectedEvent?.title || 'Attendance Report';
    const header = `
      <div style="text-align:center;margin-bottom:20px;">
        <h1>${eventTitle}</h1>
        <p>Date: ${attendanceDate}</p>
        <p>Generated on: ${new Date().toLocaleString()}</p>
      </div>
    `;

    const tableRows = filteredParticipants.map(p => {
      const status = attendance[p._id] || 'unmarked';
      const ts = attendanceTime[p._id] || '';
      return `<tr class="${status}"><td>${p.rollNo}</td><td>${p.name}</td><td>${p.year}</td><td>${p.section}</td><td>${p.dept}</td><td>${status}</td><td>${ts}</td></tr>`;
    }).join('');

    const printContent = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${eventTitle}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ccc; padding: 8px; }
            th { background: #f5f5f5; }
            .present { background: #dcfce7; }
            .absent { background: #fee2e2; }
            .unmarked { background: #fff7ed; }
          </style>
        </head>
        <body>
          ${header}
          <div style="margin-bottom:10px;">Present: ${stats.present} &nbsp; Absent: ${stats.absent} &nbsp; Unmarked: ${stats.unmarked} &nbsp; Total: ${stats.total}</div>
          <table>
            <thead>
              <tr><th>Roll</th><th>Name</th><th>Year</th><th>Section</th><th>Dept</th><th>Status</th><th>Time</th></tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const getStatusColor = (status) => {
    const colors = {
      present: '#10b981',
      absent: '#ef4444',
      unmarked: '#6b7280'
    };
    return colors[status] || '#6b7280';
  };

  const getStatusIcon = (status) => {
    const icons = {
      present: '✅',
      absent: '❌',
      unmarked: '➖'
    };
    return icons[status] || '➖';
  };

  // Return participants filtered by current filter controls
  const getFilteredParticipants = () => {
    return participants.filter(p => {
      if (filters.year !== 'all' && String(p.year) !== String(filters.year)) return false;
      if (filters.section !== 'all' && String(p.section) !== String(filters.section)) return false;
      if (filters.department !== 'all' && String(p.dept) !== String(filters.department)) return false;
      if (filters.attendanceStatus !== 'all') {
        const st = attendance[p._id] || 'unmarked';
        if (st !== filters.attendanceStatus) return false;
      }
      return true;
    });
  };

  const stats = getAttendanceStats();

  return (
    <div className="smart-attendance-system">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="page-title">Smart Attendance System</h2>
            <p className="page-subtitle">Quick and efficient roll number based attendance</p>
          </div>
          <button onClick={onClose} className="btn-secondary">
            ← Back to Dashboard
          </button>
        </div>
      </div>

      {/* Event Selection */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-body">
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: '600' }}>Select Event</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
            {events.map(event => (
              <div
                key={event._id}
                onClick={() => setSelectedEvent(event)}
                className={`event-selection-card ${selectedEvent?._id === event._id ? 'selected' : ''}`}
                style={{
                  padding: '1rem',
                  border: selectedEvent?._id === event._id ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                  borderRadius: '8px',
                  background: selectedEvent?._id === event._id ? '#f0f9ff' : '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: '600', color: '#1e293b' }}>
                  {event.title}
                </h4>
                <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                  📅 {new Date(event.startDate).toLocaleDateString()}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                  📍 {typeof event.venue === 'object' && event.venue?.name 
                      ? event.venue.name 
                      : (typeof event.venue === 'string' ? event.venue : 'TBD')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedEvent && (
        <>
          {/* Session Selection */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-body">
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: '600' }}>Select Session</h3>
              {sessions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  <p>No sessions found for this event.</p>
                  <p style={{ fontSize: '0.875rem' }}>Create sessions first to mark attendance.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                  {sessions.map(session => (
                    <div
                      key={session._id}
                      onClick={() => setSelectedSession(session)}
                      className={`session-selection-card ${selectedSession?._id === session._id ? 'selected' : ''}`}
                      style={{
                        padding: '1rem',
                        border: selectedSession?._id === session._id ? '2px solid #10b981' : '1px solid #e2e8f0',
                        borderRadius: '8px',
                        background: selectedSession?._id === session._id ? '#f0fdf4' : '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: '600', color: '#1e293b' }}>
                        {session.title}
                      </h4>
                      <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                        📅 {new Date(session.date).toLocaleDateString()}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                        🕒 {session.startTime} - {session.endTime}
                      </div>
                      {session.description && (
                        <div style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>
                          📝 {session.description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {selectedSession && (
            <>
              {/* Filter Controls */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-body">
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: '600' }}>🔍 Filter Students</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-field">
                  <label className="form-label">Year</label>
                  <select 
                    className="form-input"
                    value={filters.year} 
                    onChange={(e) => setFilters({...filters, year: e.target.value})}
                  >
                    <option value="all">All Years</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>
                
                <div className="form-field">
                  <label className="form-label">Section</label>
                  <select 
                    className="form-input"
                    value={filters.section} 
                    onChange={(e) => setFilters({...filters, section: e.target.value})}
                  >
                    <option value="all">All Sections</option>
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                    <option value="D">Section D</option>
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
                    <option value="CSE">CSE</option>
                    <option value="IT">IT</option>
                    <option value="ECE">ECE</option>
                    <option value="MECH">MECH</option>
                    <option value="CIVIL">CIVIL</option>
                  </select>
                </div>
                
                <div className="form-field">
                  <label className="form-label">Status</label>
                  <select 
                    className="form-input"
                    value={filters.attendanceStatus} 
                    onChange={(e) => setFilters({...filters, attendanceStatus: e.target.value})}
                  >
                    <option value="all">All Status</option>
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="unmarked">Unmarked</option>
                  </select>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button 
                  type="button"
                  className="btn-secondary"
                  onClick={() => setFilters({ year: 'all', section: 'all', department: 'all', attendanceStatus: 'all' })}
                >
                  Clear Filters
                </button>
                <button 
                  type="button"
                  className="btn-primary"
                  onClick={exportToCSV}
                >
                  📊 Export CSV
                </button>
                <button 
                  type="button"
                  className="btn-primary"
                  onClick={printAttendance}
                >
                  🖨️ Print Report
                </button>
              </div>
            </div>
          </div>

          {/* Quick Attendance Input */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-body">
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: '600' }}>Quick Roll Number Entry</h3>
              <form onSubmit={handleRollNoSubmit} style={{ display: 'flex', gap: '1rem', alignItems: 'end' }}>
                <div className="form-field" style={{ flex: 1 }}>
                  <label className="form-label">Enter Roll Number</label>
                  <input
                    type="text"
                    className="form-input"
                    value={rollNoInput}
                    onChange={(e) => setRollNoInput(e.target.value)}
                    placeholder="e.g., CSE21001"
                    style={{ fontSize: '1.1rem', padding: '0.75rem' }}
                    autoFocus
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Mark as</label>
                  <select
                    className="form-select"
                    value={quickMarkMode}
                    onChange={(e) => setQuickMarkMode(e.target.value)}
                    style={{ padding: '0.75rem' }}
                  >
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                  </select>
                </div>
                <button type="submit" className="btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
                  Mark Attendance
                </button>
              </form>
            </div>
          </div>

          {/* Attendance Stats & Controls */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>
                  Attendance for: {selectedSession.title}
                </h3>
                <div className="form-field">
                  <label className="form-label">Session Date</label>
                  <input
                    type="text"
                    className="form-input"
                    value={new Date(selectedSession.date).toLocaleDateString()}
                    readOnly
                    style={{ width: '150px', background: '#f8fafc' }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ textAlign: 'center', padding: '0.75rem', background: '#f0fdf4', borderRadius: '8px' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#16a34a' }}>{stats.present}</div>
                  <div style={{ fontSize: '0.875rem', color: '#16a34a' }}>Present</div>
                </div>
                <div style={{ textAlign: 'center', padding: '0.75rem', background: '#fef2f2', borderRadius: '8px' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#dc2626' }}>{stats.absent}</div>
                  <div style={{ fontSize: '0.875rem', color: '#dc2626' }}>Absent</div>
                </div>
                <div style={{ textAlign: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#64748b' }}>{stats.unmarked}</div>
                  <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Unmarked</div>
                </div>
                <div style={{ textAlign: 'center', padding: '0.75rem', background: '#eff6ff', borderRadius: '8px' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#3b82f6' }}>{stats.total}</div>
                  <div style={{ fontSize: '0.875rem', color: '#3b82f6' }}>Total</div>
                </div>
              </div>

              {/* Bulk Actions */}
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                <button onClick={() => bulkMarkAll('present')} className="btn-sm btn-success">
                  ✅ Mark All Present
                </button>
                <button onClick={() => bulkMarkAll('absent')} className="btn-sm btn-danger">
                  ❌ Mark All Absent
                </button>
                <button onClick={() => bulkMarkAll('unmarked')} className="btn-sm btn-secondary">
                  ➖ Clear All
                </button>
                <button onClick={saveAttendance} className="btn-sm btn-primary" disabled={saving}>
                  {saving ? '⏳ Saving...' : '💾 Save Attendance'}
                </button>
              </div>
            </div>
          </div>

          {/* Attendance List - Simplified */}
          <div className="card">
            <div className="card-body">
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: '600' }}>
                Student List ({participants.length} students)
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
                {getFilteredParticipants().map(participant => {
                  const status = attendance[participant._id] || 'unmarked';
                  return (
                    <div
                      key={participant._id}
                      id={`participant-${participant._id}`}
                      className="participant-card"
                      style={{
                        padding: '0.75rem 1rem',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        background: '#ffffff',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          fontWeight: '600', 
                          fontSize: '1rem', 
                          color: '#1e293b',
                          marginBottom: '0.25rem'
                        }}>
                          {participant.rollNo}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                          {participant.dept} • Year {participant.year} • Sec {participant.section}
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '1.2rem' }}>
                          {getStatusIcon(status)}
                        </span>
                        <select
                          className="form-select"
                          value={status}
                          onChange={(e) => markAttendance(participant._id, e.target.value)}
                          style={{ 
                            width: '100px',
                            borderColor: getStatusColor(status),
                            color: getStatusColor(status),
                            fontWeight: '500'
                          }}
                        >
                          <option value="unmarked">--</option>
                          <option value="present">Present</option>
                          <option value="absent">Absent</option>
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
            </>
          )}
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

export default SmartAttendanceSystem;