import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import '../../styles/dashboard.css';

const TrainerAttendanceSystem = ({ onClose }) => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    year: 'all',
    section: 'all',
    department: 'all',
    attendanceStatus: 'all'
  });
  const [viewMode, setViewMode] = useState('mark'); // mark, analytics
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSession, setSelectedSession] = useState(null);

  // Mock data for events assigned to trainer
  const mockEvents = [
    {
      _id: 'evt1',
      title: 'AI & Machine Learning Workshop',
      description: 'Comprehensive workshop on AI fundamentals and practical implementation',
      startDate: new Date('2025-11-15'),
      endDate: new Date('2025-11-15'),
      venue: 'Main Auditorium',
      status: 'upcoming',
      sessions: [
        { 
          id: 'session1',
          date: '2025-11-15', 
          startTime: '09:00', 
          endTime: '12:00', 
          topic: 'Introduction to AI & ML Concepts',
          description: 'Fundamentals of artificial intelligence and machine learning'
        },
        { 
          id: 'session2',
          date: '2025-11-15', 
          startTime: '14:00', 
          endTime: '17:00', 
          topic: 'Hands-on Python Implementation',
          description: 'Practical coding session with TensorFlow and scikit-learn'
        }
      ]
    },
    {
      _id: 'evt2',
      title: 'Cloud Computing Deep Dive',
      description: 'Advanced cloud architecture and deployment strategies',
      startDate: new Date('2025-11-10'),
      endDate: new Date('2025-11-12'),
      venue: 'Conference Hall B',
      status: 'ongoing',
      sessions: [
        { 
          id: 'session3',
          date: '2025-11-10', 
          startTime: '09:00', 
          endTime: '12:00', 
          topic: 'Cloud Infrastructure Basics',
          description: 'AWS, Azure, and GCP fundamentals'
        },
        { 
          id: 'session4',
          date: '2025-11-11', 
          startTime: '09:00', 
          endTime: '12:00', 
          topic: 'Microservices Architecture',
          description: 'Designing scalable microservices'
        },
        { 
          id: 'session5',
          date: '2025-11-12', 
          startTime: '09:00', 
          endTime: '12:00', 
          topic: 'DevOps & CI/CD',
          description: 'Automated deployment pipelines'
        }
      ]
    },
    {
      _id: 'evt3',
      title: 'Web Development Bootcamp',
      description: '5-day intensive full-stack web development training',
      startDate: new Date('2025-10-20'),
      endDate: new Date('2025-10-24'),
      venue: 'Computer Lab 1',
      status: 'completed',
      sessions: [
        { 
          id: 'session6',
          date: '2025-10-20', 
          startTime: '09:00', 
          endTime: '17:00', 
          topic: 'HTML5, CSS3 & Responsive Design',
          description: 'Modern web markup and styling'
        },
        { 
          id: 'session7',
          date: '2025-10-21', 
          startTime: '09:00', 
          endTime: '17:00', 
          topic: 'JavaScript ES6+ & DOM Manipulation',
          description: 'Advanced JavaScript programming'
        },
        { 
          id: 'session8',
          date: '2025-10-22', 
          startTime: '09:00', 
          endTime: '17:00', 
          topic: 'React.js & Component Architecture',
          description: 'Building modern SPAs with React'
        },
        { 
          id: 'session9',
          date: '2025-10-23', 
          startTime: '09:00', 
          endTime: '17:00', 
          topic: 'Node.js & Express Backend',
          description: 'Server-side development with Node.js'
        },
        { 
          id: 'session10',
          date: '2025-10-24', 
          startTime: '09:00', 
          endTime: '17:00', 
          topic: 'Full-Stack Integration & Deployment',
          description: 'Connecting frontend and backend'
        }
      ]
    },
    {
      _id: 'evt4',
      title: 'Data Science & Analytics Workshop',
      description: 'Hands-on data analysis with Python and visualization tools',
      startDate: new Date('2025-11-25'),
      endDate: new Date('2025-11-26'),
      venue: 'Data Science Lab',
      status: 'upcoming',
      sessions: [
        { 
          id: 'session11',
          date: '2025-11-25', 
          startTime: '09:00', 
          endTime: '12:00', 
          topic: 'Python for Data Science',
          description: 'NumPy, Pandas, and data manipulation'
        },
        { 
          id: 'session12',
          date: '2025-11-25', 
          startTime: '14:00', 
          endTime: '17:00', 
          topic: 'Data Visualization with Matplotlib & Seaborn',
          description: 'Creating compelling data visualizations'
        },
        { 
          id: 'session13',
          date: '2025-11-26', 
          startTime: '09:00', 
          endTime: '12:00', 
          topic: 'Statistical Analysis & Machine Learning',
          description: 'Statistical methods and ML algorithms'
        },
        { 
          id: 'session14',
          date: '2025-11-26', 
          startTime: '14:00', 
          endTime: '17:00', 
          topic: 'Real-world Data Science Project',
          description: 'End-to-end data science workflow'
        }
      ]
    }
  ];

  // Mock participants data
  const mockParticipants = [
    {
      _id: '1',
      name: 'John Doe',
      email: 'john.doe@college.edu',
      rollNo: 'CSE21001',
      department: 'CSE',
      year: 3,
      section: 'A',
      phone: '+91 9876543210',
      registrationDate: new Date('2025-11-01'),
      skills: ['Python', 'JavaScript', 'React'],
      previousAttendance: 92
    },
    {
      _id: '2',
      name: 'Jane Smith',
      email: 'jane.smith@college.edu',
      rollNo: 'CSE23045',
      department: 'CSE',
      year: 2,
      section: 'B',
      phone: '+91 9876543211',
      registrationDate: new Date('2025-11-02'),
      skills: ['Java', 'Spring Boot', 'MySQL'],
      previousAttendance: 88
    },
    {
      _id: '3',
      name: 'Alice Johnson',
      email: 'alice.johnson@college.edu',
      rollNo: 'ECE21003',
      department: 'ECE',
      year: 2,
      section: 'A',
      phone: '+91 9876543212',
      registrationDate: new Date('2025-11-03'),
      skills: ['C++', 'Embedded Systems', 'Arduino'],
      previousAttendance: 95
    },
    {
      _id: '4',
      name: 'Bob Wilson',
      email: 'bob.wilson@college.edu',
      rollNo: 'MECH22015',
      department: 'MECH',
      year: 3,
      section: 'C',
      phone: '+91 9876543213',
      registrationDate: new Date('2025-11-04'),
      skills: ['CAD', 'MATLAB', 'SolidWorks'],
      previousAttendance: 85
    },
    {
      _id: '5',
      name: 'Emma Davis',
      email: 'emma.davis@college.edu',
      rollNo: 'IT21025',
      department: 'IT',
      year: 1,
      section: 'A',
      phone: '+91 9876543214',
      registrationDate: new Date('2025-11-05'),
      skills: ['HTML', 'CSS', 'JavaScript'],
      previousAttendance: 100
    },
    {
      _id: '6',
      name: 'Mike Chen',
      email: 'mike.chen@college.edu',
      rollNo: 'CSE20089',
      department: 'CSE',
      year: 4,
      section: 'B',
      phone: '+91 9876543215',
      registrationDate: new Date('2025-10-28'),
      skills: ['Machine Learning', 'Python', 'TensorFlow'],
      previousAttendance: 90
    },
    {
      _id: '7',
      name: 'Sarah Kumar',
      email: 'sarah.kumar@college.edu',
      rollNo: 'EEE21067',
      department: 'EEE',
      year: 2,
      section: 'A',
      phone: '+91 9876543216',
      registrationDate: new Date('2025-11-01'),
      skills: ['Circuit Design', 'Power Systems', 'MATLAB'],
      previousAttendance: 87
    },
    {
      _id: '8',
      name: 'David Park',
      email: 'david.park@college.edu',
      rollNo: 'CSE22134',
      department: 'CSE',
      year: 1,
      section: 'C',
      phone: '+91 9876543217',
      registrationDate: new Date('2025-11-03'),
      skills: ['C Programming', 'Data Structures'],
      previousAttendance: 93
    }
  ];

  // Mock attendance records with comprehensive data
  const mockAttendanceRecords = {
    'evt1': {
      '2025-11-15': {
        '1': { status: 'present', checkInTime: '09:05', checkOutTime: '17:00', notes: 'Active participant' },
        '2': { status: 'present', checkInTime: '09:00', checkOutTime: '16:55', notes: 'Good engagement' },
        '3': { status: 'absent', checkInTime: null, checkOutTime: null, notes: 'Sick leave' },
        '4': { status: 'late', checkInTime: '09:30', checkOutTime: '17:00', notes: 'Traffic delay' },
        '5': { status: 'present', checkInTime: '08:58', checkOutTime: '17:05', notes: 'Excellent participation' },
        '6': { status: 'present', checkInTime: '09:02', checkOutTime: '17:00', notes: 'Strong technical skills' },
        '7': { status: 'present', checkInTime: '09:10', checkOutTime: '16:50', notes: 'Good questions' },
        '8': { status: 'late', checkInTime: '09:25', checkOutTime: '17:00', notes: 'Bus delay' }
      }
    },
    'evt2': {
      '2025-11-10': {
        '1': { status: 'present', checkInTime: '09:00', checkOutTime: '12:00', notes: 'Prepared well' },
        '2': { status: 'present', checkInTime: '09:05', checkOutTime: '12:00', notes: 'Active learner' },
        '3': { status: 'present', checkInTime: '09:02', checkOutTime: '11:50', notes: 'Left early - family emergency' },
        '4': { status: 'absent', checkInTime: null, checkOutTime: null, notes: 'No prior notice' },
        '5': { status: 'present', checkInTime: '08:55', checkOutTime: '12:05', notes: 'Helped peers' },
        '6': { status: 'present', checkInTime: '09:00', checkOutTime: '12:00', notes: 'Expert level questions' },
        '7': { status: 'late', checkInTime: '09:15', checkOutTime: '12:00', notes: 'Commute issues' },
        '8': { status: 'present', checkInTime: '09:03', checkOutTime: '12:00', notes: 'First session, nervous' }
      },
      '2025-11-11': {
        '1': { status: 'present', checkInTime: '09:00', checkOutTime: '12:00', notes: 'Good progress' },
        '2': { status: 'present', checkInTime: '08:58', checkOutTime: '12:00', notes: 'Leading discussions' },
        '3': { status: 'present', checkInTime: '09:05', checkOutTime: '12:00', notes: 'Caught up well' },
        '4': { status: 'present', checkInTime: '09:10', checkOutTime: '12:00', notes: 'Better punctuality' },
        '5': { status: 'present', checkInTime: '09:00', checkOutTime: '12:00', notes: 'Consistent performer' },
        '6': { status: 'present', checkInTime: '09:02', checkOutTime: '12:00', notes: 'Mentoring others' },
        '7': { status: 'present', checkInTime: '09:00', checkOutTime: '12:00', notes: 'Much improved' },
        '8': { status: 'present', checkInTime: '09:00', checkOutTime: '12:00', notes: 'More confident' }
      }
    },
    'evt3': {
      '2025-10-20': {
        '1': { status: 'present', checkInTime: '09:00', checkOutTime: '17:00', notes: 'Day 1 - Enthusiastic' },
        '2': { status: 'present', checkInTime: '09:05', checkOutTime: '17:00', notes: 'Quick learner' },
        '3': { status: 'present', checkInTime: '09:00', checkOutTime: '17:00', notes: 'Great foundation' },
        '4': { status: 'late', checkInTime: '09:20', checkOutTime: '17:00', notes: 'Registration delay' },
        '5': { status: 'present', checkInTime: '08:55', checkOutTime: '17:00', notes: 'Very motivated' },
        '6': { status: 'present', checkInTime: '09:00', checkOutTime: '17:00', notes: 'Advanced student' },
        '7': { status: 'present', checkInTime: '09:02', checkOutTime: '17:00', notes: 'Good questions' },
        '8': { status: 'present', checkInTime: '09:00', checkOutTime: '17:00', notes: 'Beginner but eager' }
      },
      '2025-10-21': {
        '1': { status: 'present', checkInTime: '09:00', checkOutTime: '17:00', notes: 'JavaScript mastery' },
        '2': { status: 'present', checkInTime: '09:00', checkOutTime: '17:00', notes: 'Creative solutions' },
        '3': { status: 'present', checkInTime: '09:00', checkOutTime: '17:00', notes: 'Solid progress' },
        '4': { status: 'present', checkInTime: '09:05', checkOutTime: '17:00', notes: 'Better timing' },
        '5': { status: 'present', checkInTime: '09:00', checkOutTime: '17:00', notes: 'Helping others' },
        '6': { status: 'present', checkInTime: '09:00', checkOutTime: '17:00', notes: 'Teaching concepts' },
        '7': { status: 'present', checkInTime: '09:00', checkOutTime: '17:00', notes: 'Consistent effort' },
        '8': { status: 'present', checkInTime: '09:00', checkOutTime: '17:00', notes: 'Much improved' }
      }
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      fetchParticipants(selectedEvent._id);
      loadAttendanceData(selectedEvent._id, attendanceDate);
    }
  }, [selectedEvent, attendanceDate]);

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

  const fetchParticipants = async (eventId) => {
    try {
      // Replace with actual API call
      setParticipants(mockParticipants);
    } catch (err) {
      setError('Failed to fetch participants');
    }
  };

  const loadAttendanceData = async (eventId, date) => {
    try {
      // Replace with actual API call
      const eventAttendance = mockAttendanceRecords[eventId];
      if (eventAttendance && eventAttendance[date]) {
        setAttendance(eventAttendance[date]);
      } else {
        // Initialize empty attendance
        const emptyAttendance = {};
        mockParticipants.forEach(participant => {
          emptyAttendance[participant._id] = {
            status: 'unmarked',
            checkInTime: '',
            checkOutTime: '',
            notes: ''
          };
        });
        setAttendance(emptyAttendance);
      }
    } catch (err) {
      setError('Failed to load attendance data');
    }
  };

  const updateAttendance = (participantId, field, value) => {
    setAttendance(prev => ({
      ...prev,
      [participantId]: {
        ...prev[participantId],
        [field]: value,
        // Auto-set check-in time when marking present
        ...(field === 'status' && value === 'present' && !prev[participantId]?.checkInTime ? {
          checkInTime: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
        } : {})
      }
    }));
  };

  const markAllPresent = () => {
    const currentTime = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    const updatedAttendance = {};
    
    getFilteredParticipants().forEach(participant => {
      updatedAttendance[participant._id] = {
        status: 'present',
        checkInTime: currentTime,
        checkOutTime: '',
        notes: 'Marked present - bulk action'
      };
    });
    
    setAttendance(prev => ({ ...prev, ...updatedAttendance }));
  };

  const markAllAbsent = () => {
    const updatedAttendance = {};
    
    getFilteredParticipants().forEach(participant => {
      updatedAttendance[participant._id] = {
        status: 'absent',
        checkInTime: '',
        checkOutTime: '',
        notes: 'Marked absent - bulk action'
      };
    });
    
    setAttendance(prev => ({ ...prev, ...updatedAttendance }));
  };

  const saveAttendance = async () => {
    if (!selectedEvent) return;
    
    setSaving(true);
    try {
      // Replace with actual API call
      console.log('Saving attendance:', {
        eventId: selectedEvent._id,
        date: attendanceDate,
        attendance: attendance
      });
      
      setTimeout(() => {
        setSaving(false);
        alert('Attendance saved successfully!');
      }, 1000);
    } catch (err) {
      setError('Failed to save attendance');
      setSaving(false);
    }
  };

  const getFilteredParticipants = () => {
    return participants.filter(participant => {
      if (filters.year !== 'all' && participant.year !== parseInt(filters.year)) return false;
      if (filters.section !== 'all' && participant.section !== filters.section) return false;
      if (filters.department !== 'all' && participant.department !== filters.department) return false;
      
      if (filters.attendanceStatus !== 'all') {
        const participantAttendance = attendance[participant._id];
        if (!participantAttendance) return filters.attendanceStatus === 'unmarked';
        if (participantAttendance.status !== filters.attendanceStatus) return false;
      }
      
      return true;
    });
  };

  const getAttendanceStats = () => {
    const stats = {
      total: participants.length,
      present: 0,
      absent: 0,
      late: 0,
      unmarked: 0
    };

    participants.forEach(participant => {
      const attendanceRecord = attendance[participant._id];
      if (!attendanceRecord || attendanceRecord.status === 'unmarked') {
        stats.unmarked++;
      } else {
        stats[attendanceRecord.status]++;
      }
    });

    return stats;
  };

  const getStatusColor = (status) => {
    const colors = {
      present: '#10b981',
      absent: '#ef4444',
      late: '#f59e0b',
      unmarked: '#6b7280'
    };
    return colors[status] || '#6b7280';
  };

  const getStatusIcon = (status) => {
    const icons = {
      present: '✅',
      absent: '❌',
      late: '⚠️',
      unmarked: '➖'
    };
    return icons[status] || '➖';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const stats = getAttendanceStats();
  const filteredParticipants = getFilteredParticipants();

  return (
    <div className="trainer-attendance-system">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="page-title">Trainer Attendance System</h2>
            <p className="page-subtitle">Mark and manage attendance for your events</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '8px', padding: '4px' }}>
              <button
                onClick={() => setViewMode('mark')}
                className={viewMode === 'mark' ? 'view-mode-btn active' : 'view-mode-btn'}
              >
                ✏️ Mark Attendance
              </button>
              <button
                onClick={() => setViewMode('analytics')}
                className={viewMode === 'analytics' ? 'view-mode-btn active' : 'view-mode-btn'}
              >
                📊 Analytics
              </button>
            </div>
            <button onClick={onClose} className="btn-secondary">
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'mark' && (
        <>
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#1e293b' }}>
                        {event.title}
                      </h4>
                      <span 
                        className="badge"
                        style={{ 
                          background: event.status === 'upcoming' ? '#dbeafe' : '#dcfce7',
                          color: event.status === 'upcoming' ? '#2563eb' : '#16a34a',
                          fontSize: '0.75rem'
                        }}
                      >
                        {event.status}
                      </span>
                    </div>
                    <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.875rem', color: '#64748b' }}>
                      {event.description}
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#64748b' }}>
                      <span>📅 {formatDate(event.startDate)}</span>
                      <span>📍 {event.venue}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {selectedEvent && (
            <>
              {/* Date and Session Selection */}
              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>
                      Attendance for: {selectedEvent.title}
                    </h3>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <div className="form-field">
                        <label className="form-label">Date</label>
                        <input
                          type="date"
                          className="form-input"
                          value={attendanceDate}
                          onChange={(e) => setAttendanceDate(e.target.value)}
                          style={{ width: '150px' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Session Info */}
                  {selectedEvent.sessions && (
                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                      <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: '600' }}>
                        Sessions for {new Date(attendanceDate).toLocaleDateString()}:
                      </h4>
                      <div style={{ display: 'grid', gap: '0.75rem' }}>
                        {selectedEvent.sessions
                          .filter(session => session.date === attendanceDate)
                          .map((session, index) => (
                            <div 
                              key={session.id || index} 
                              onClick={() => setSelectedSession(session)}
                              style={{ 
                                background: selectedSession?.id === session.id ? '#e0f2fe' : 'white',
                                border: selectedSession?.id === session.id ? '2px solid #0284c7' : '1px solid #e2e8f0',
                                padding: '0.75rem', 
                                borderRadius: '8px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                <div>
                                  <div style={{ fontWeight: '600', fontSize: '0.9rem', color: '#1e293b' }}>
                                    {session.startTime} - {session.endTime}
                                  </div>
                                  <div style={{ fontWeight: '500', color: '#3b82f6', fontSize: '0.875rem' }}>
                                    {session.topic}
                                  </div>
                                </div>
                                {selectedSession?.id === session.id && (
                                  <span style={{ 
                                    background: '#0284c7', 
                                    color: 'white', 
                                    padding: '0.25rem 0.5rem', 
                                    borderRadius: '4px',
                                    fontSize: '0.75rem'
                                  }}>
                                    Selected
                                  </span>
                                )}
                              </div>
                              <div style={{ color: '#64748b', fontSize: '0.8rem', lineHeight: '1.4' }}>
                                {session.description}
                              </div>
                            </div>
                          ))}
                        {selectedEvent.sessions.filter(session => session.date === attendanceDate).length === 0 && (
                          <div style={{ textAlign: 'center', color: '#64748b', padding: '1rem' }}>
                            No sessions scheduled for this date
                          </div>
                        )}
                      </div>
                      {selectedSession && (
                        <div style={{ 
                          marginTop: '0.75rem', 
                          padding: '0.75rem', 
                          background: '#e0f2fe', 
                          borderRadius: '6px',
                          border: '1px solid #0284c7'
                        }}>
                          <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#0c4a6e' }}>
                            📍 Taking attendance for: {selectedSession.topic}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#0369a1', marginTop: '0.25rem' }}>
                            {selectedSession.startTime} - {selectedSession.endTime} | {selectedSession.description}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Attendance Stats */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ textAlign: 'center', padding: '0.75rem', background: '#f0fdf4', borderRadius: '8px' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#16a34a' }}>{stats.present}</div>
                      <div style={{ fontSize: '0.875rem', color: '#16a34a' }}>Present</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '0.75rem', background: '#fef2f2', borderRadius: '8px' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#dc2626' }}>{stats.absent}</div>
                      <div style={{ fontSize: '0.875rem', color: '#dc2626' }}>Absent</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '0.75rem', background: '#fffbeb', borderRadius: '8px' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#d97706' }}>{stats.late}</div>
                      <div style={{ fontSize: '0.875rem', color: '#d97706' }}>Late</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#64748b' }}>{stats.unmarked}</div>
                      <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Unmarked</div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                      <button onClick={markAllPresent} className="btn-sm btn-success">
                        ✅ Mark All Present
                      </button>
                      <button onClick={markAllAbsent} className="btn-sm btn-danger">
                        ❌ Mark All Absent
                      </button>
                      <button 
                        onClick={() => {
                          const now = new Date();
                          const currentTime = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
                          getFilteredParticipants().forEach(participant => {
                            updateAttendance(participant._id, 'checkOutTime', currentTime);
                          });
                        }} 
                        className="btn-sm btn-secondary"
                      >
                        🕐 Bulk Check-out
                      </button>
                      <button 
                        onClick={() => {
                          if (window.confirm('Clear all attendance data for this session?')) {
                            const clearedAttendance = {};
                            getFilteredParticipants().forEach(participant => {
                              clearedAttendance[participant._id] = {
                                status: 'unmarked',
                                checkInTime: '',
                                checkOutTime: '',
                                notes: ''
                              };
                            });
                            setAttendance(prev => ({ ...prev, ...clearedAttendance }));
                          }
                        }}
                        className="btn-sm btn-warning"
                      >
                        🔄 Clear Session
                      </button>
                      <button onClick={saveAttendance} className="btn-sm btn-primary" disabled={saving}>
                        {saving ? '⏳ Saving...' : '💾 Save Attendance'}
                      </button>
                    </div>
                    
                    {/* Export Options */}
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <button 
                        onClick={() => {
                          const exportData = filteredParticipants.map(p => {
                            const record = attendance[p._id] || {};
                            return {
                              Name: p.name,
                              'Roll No': p.rollNo,
                              Department: p.department,
                              'Year/Section': `${p.year}/${p.section}`,
                              Status: record.status || 'unmarked',
                              'Check-in': record.checkInTime || '',
                              'Check-out': record.checkOutTime || '',
                              Notes: record.notes || ''
                            };
                          });
                          
                          const csv = [
                            Object.keys(exportData[0] || {}),
                            ...exportData.map(row => Object.values(row))
                          ].map(row => row.join(',')).join('\n');
                          
                          const blob = new Blob([csv], { type: 'text/csv' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `attendance_${selectedEvent?.title}_${attendanceDate}.csv`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                        className="btn-sm btn-secondary"
                      >
                        📊 Export CSV
                      </button>
                      <button 
                        onClick={() => {
                          const printContent = `
                            <h2>Attendance Report</h2>
                            <p><strong>Event:</strong> ${selectedEvent?.title}</p>
                            <p><strong>Date:</strong> ${new Date(attendanceDate).toLocaleDateString()}</p>
                            ${selectedSession ? `<p><strong>Session:</strong> ${selectedSession.topic} (${selectedSession.startTime} - ${selectedSession.endTime})</p>` : ''}
                            <table border="1" style="border-collapse: collapse; width: 100%;">
                              <tr>
                                <th>Name</th><th>Roll No</th><th>Dept</th><th>Status</th><th>Check-in</th><th>Check-out</th><th>Notes</th>
                              </tr>
                              ${filteredParticipants.map(p => {
                                const record = attendance[p._id] || {};
                                return `<tr>
                                  <td>${p.name}</td>
                                  <td>${p.rollNo}</td>
                                  <td>${p.department}</td>
                                  <td>${record.status || 'unmarked'}</td>
                                  <td>${record.checkInTime || ''}</td>
                                  <td>${record.checkOutTime || ''}</td>
                                  <td>${record.notes || ''}</td>
                                </tr>`;
                              }).join('')}
                            </table>
                          `;
                          
                          const printWindow = window.open('', '', 'width=800,height=600');
                          printWindow.document.write(printContent);
                          printWindow.document.close();
                          printWindow.print();
                        }}
                        className="btn-sm btn-secondary"
                      >
                        🖨️ Print Report
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="card-body">
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    <div className="form-field" style={{ minWidth: '120px' }}>
                      <label className="form-label">Year</label>
                      <select
                        className="form-select"
                        value={filters.year}
                        onChange={(e) => setFilters(prev => ({ ...prev, year: e.target.value }))}
                      >
                        <option value="all">All Years</option>
                        <option value="1">1st Year</option>
                        <option value="2">2nd Year</option>
                        <option value="3">3rd Year</option>
                        <option value="4">4th Year</option>
                      </select>
                    </div>

                    <div className="form-field" style={{ minWidth: '120px' }}>
                      <label className="form-label">Section</label>
                      <select
                        className="form-select"
                        value={filters.section}
                        onChange={(e) => setFilters(prev => ({ ...prev, section: e.target.value }))}
                      >
                        <option value="all">All Sections</option>
                        <option value="A">Section A</option>
                        <option value="B">Section B</option>
                        <option value="C">Section C</option>
                      </select>
                    </div>

                    <div className="form-field" style={{ minWidth: '150px' }}>
                      <label className="form-label">Department</label>
                      <select
                        className="form-select"
                        value={filters.department}
                        onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
                      >
                        <option value="all">All Departments</option>
                        <option value="CSE">Computer Science</option>
                        <option value="ECE">Electronics</option>
                        <option value="EEE">Electrical</option>
                        <option value="MECH">Mechanical</option>
                        <option value="CIVIL">Civil</option>
                        <option value="IT">Information Technology</option>
                      </select>
                    </div>

                    <div className="form-field" style={{ minWidth: '150px' }}>
                      <label className="form-label">Attendance Status</label>
                      <select
                        className="form-select"
                        value={filters.attendanceStatus}
                        onChange={(e) => setFilters(prev => ({ ...prev, attendanceStatus: e.target.value }))}
                      >
                        <option value="all">All Status</option>
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                        <option value="late">Late</option>
                        <option value="unmarked">Unmarked</option>
                      </select>
                    </div>

                    <div style={{ marginLeft: 'auto', fontSize: '0.875rem', color: '#64748b' }}>
                      <div><strong>{filteredParticipants.length}</strong> participants</div>
                      <div style={{ fontSize: '0.8rem' }}>
                        {stats.present} present • {stats.absent} absent • {stats.late} late
                      </div>
                    </div>
                  </div>
                  
                  {/* Attendance Summary Bar */}
                  <div style={{ 
                    background: '#f8fafc', 
                    padding: '0.75rem', 
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Session Progress</span>
                      <span style={{ fontSize: '0.875rem' }}>
                        {Math.round(((stats.present + stats.late) / Math.max(stats.total, 1)) * 100)}% attended
                      </span>
                    </div>
                    <div style={{ 
                      width: '100%', 
                      height: '8px', 
                      background: '#e5e7eb', 
                      borderRadius: '4px',
                      overflow: 'hidden',
                      display: 'flex'
                    }}>
                      <div style={{ 
                        width: `${(stats.present / Math.max(stats.total, 1)) * 100}%`,
                        background: '#10b981'
                      }}></div>
                      <div style={{ 
                        width: `${(stats.late / Math.max(stats.total, 1)) * 100}%`,
                        background: '#f59e0b'
                      }}></div>
                      <div style={{ 
                        width: `${(stats.absent / Math.max(stats.total, 1)) * 100}%`,
                        background: '#ef4444'
                      }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Attendance List */}
              <div className="card">
                <div className="card-body">
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Student Details</th>
                          <th>Academic Info</th>
                          <th>Skills & Performance</th>
                          <th>Attendance Status</th>
                          <th>Check-in Time</th>
                          <th>Check-out Time</th>
                          <th>Notes</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredParticipants.map(participant => {
                          const attendanceRecord = attendance[participant._id] || { status: 'unmarked', checkInTime: '', checkOutTime: '', notes: '' };
                          return (
                            <tr key={participant._id}>
                              <td>
                                <div>
                                  <div style={{ fontWeight: '600', color: '#1e293b' }}>{participant.name}</div>
                                  <div style={{ fontSize: '0.875rem', color: '#64748b' }}>{participant.email}</div>
                                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Roll: {participant.rollNo}</div>
                                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{participant.phone}</div>
                                </div>
                              </td>
                              <td>
                                <div style={{ fontSize: '0.875rem' }}>
                                  <div><strong>{participant.department}</strong></div>
                                  <div style={{ color: '#64748b' }}>Year {participant.year}, Sec {participant.section}</div>
                                  <div style={{ fontSize: '0.8rem', color: '#16a34a' }}>
                                    Reg: {new Date(participant.registrationDate).toLocaleDateString()}
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div style={{ fontSize: '0.875rem' }}>
                                  <div style={{ marginBottom: '0.25rem' }}>
                                    <strong>Skills:</strong>
                                  </div>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginBottom: '0.5rem' }}>
                                    {participant.skills?.slice(0, 3).map((skill, index) => (
                                      <span
                                        key={index}
                                        style={{
                                          background: '#e0f2fe',
                                          color: '#0369a1',
                                          padding: '0.125rem 0.375rem',
                                          borderRadius: '4px',
                                          fontSize: '0.75rem'
                                        }}
                                      >
                                        {skill}
                                      </span>
                                    ))}
                                  </div>
                                  <div style={{ 
                                    fontSize: '0.8rem', 
                                    color: participant.previousAttendance >= 90 ? '#16a34a' : 
                                           participant.previousAttendance >= 80 ? '#f59e0b' : '#dc2626'
                                  }}>
                                    Prev. Attendance: {participant.previousAttendance}%
                                  </div>
                                </div>
                              </td>
                              <td>
                                <select
                                  className="form-select"
                                  value={attendanceRecord.status}
                                  onChange={(e) => updateAttendance(participant._id, 'status', e.target.value)}
                                  style={{ 
                                    width: '120px',
                                    borderColor: getStatusColor(attendanceRecord.status),
                                    color: getStatusColor(attendanceRecord.status),
                                    fontWeight: '500'
                                  }}
                                >
                                  <option value="unmarked">Unmarked</option>
                                  <option value="present">Present</option>
                                  <option value="absent">Absent</option>
                                  <option value="late">Late</option>
                                </select>
                              </td>
                              <td>
                                <input
                                  type="time"
                                  className="form-input"
                                  value={attendanceRecord.checkInTime}
                                  onChange={(e) => updateAttendance(participant._id, 'checkInTime', e.target.value)}
                                  disabled={attendanceRecord.status === 'absent'}
                                  style={{ width: '100px' }}
                                />
                              </td>
                              <td>
                                <input
                                  type="time"
                                  className="form-input"
                                  value={attendanceRecord.checkOutTime}
                                  onChange={(e) => updateAttendance(participant._id, 'checkOutTime', e.target.value)}
                                  disabled={attendanceRecord.status === 'absent'}
                                  style={{ width: '100px' }}
                                />
                              </td>
                              <td>
                                <textarea
                                  className="form-input"
                                  placeholder="Add notes..."
                                  value={attendanceRecord.notes || ''}
                                  onChange={(e) => updateAttendance(participant._id, 'notes', e.target.value)}
                                  style={{ 
                                    width: '150px', 
                                    height: '60px', 
                                    resize: 'vertical',
                                    fontSize: '0.8rem'
                                  }}
                                />
                              </td>
                              <td>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                  <button
                                    onClick={() => updateAttendance(participant._id, 'status', 'present')}
                                    className="btn-sm btn-success"
                                    title="Mark Present"
                                  >
                                    ✅
                                  </button>
                                  <button
                                    onClick={() => updateAttendance(participant._id, 'status', 'absent')}
                                    className="btn-sm btn-danger"
                                    title="Mark Absent"
                                  >
                                    ❌
                                  </button>
                                  <button
                                    onClick={() => updateAttendance(participant._id, 'status', 'late')}
                                    className="btn-sm btn-warning"
                                    title="Mark Late"
                                  >
                                    ⚠️
                                  </button>
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
            </>
          )}
        </>
      )}

      {viewMode === 'analytics' && (
        <div className="card">
          <div className="card-body">
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: '600' }}>
              Attendance Analytics
            </h3>
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
              <h4>Analytics Dashboard Coming Soon</h4>
              <p>Detailed attendance analytics, trends, and insights will be available here.</p>
              <div style={{ marginTop: '1.5rem' }}>
                <button onClick={() => setViewMode('mark')} className="btn-primary">
                  ← Back to Attendance Marking
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

export default TrainerAttendanceSystem;