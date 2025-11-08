import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import SmartAttendanceSystem from '../trainer/SmartAttendanceSystem';
import SessionManagement from '../trainer/SessionManagement';

const TrainerDashboard = () => {
  const { user } = useAuth();
  const { emitEventCreated, emitEventUpdated, emitEventDeleted } = useSocket();
  const [activeSection, setActiveSection] = useState('overview');
  const [myPrograms, setMyPrograms] = useState([]);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [stats, setStats] = useState({
    totalPrograms: 0,
    activePrograms: 0,
    totalParticipants: 0,
    upcomingSessions: 0,
    completionRate: 0
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

      // Fetch all events/programs
      const eventsResponse = await fetch('http://localhost:5000/api/events', {
        headers
      });
      
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        const eventsList = eventsData.events || eventsData;
        
        // Filter training-related events for trainer
        const trainingEvents = eventsList.filter(event => 
          ['workshop', 'technical', 'training', 'seminar'].includes(event.type?.toLowerCase() || event.category?.toLowerCase())
        );
        
        setMyPrograms(trainingEvents);
        
        // Calculate stats
        const activePrograms = trainingEvents.filter(p => 
          p.status === 'approved' && new Date(p.startDate || p.date) > new Date()
        );
        const upcoming = trainingEvents.filter(p => 
          new Date(p.startDate || p.date) > new Date()
        ).slice(0, 3);
        
        setUpcomingSessions(upcoming);
        setStats({
          totalPrograms: trainingEvents.length,
          activePrograms: activePrograms.length,
          totalParticipants: trainingEvents.reduce((sum, p) => sum + (p.registration?.currentCount || 0), 0),
          upcomingSessions: upcoming.length,
          completionRate: 85 // Mock completion rate
        });
      }

      // Mock participants data
      setParticipants([
        { id: 1, name: 'Alice Johnson', email: 'alice@email.com', program: 'JavaScript Workshop', progress: 75 },
        { id: 2, name: 'Bob Smith', email: 'bob@email.com', program: 'React Training', progress: 60 },
        { id: 3, name: 'Carol Davis', email: 'carol@email.com', program: 'Node.js Bootcamp', progress: 90 }
      ]);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProgram = async (e) => {
    // Trainers cannot create programs - only coordinators/faculty can
    alert('Only coordinators and faculty members can create programs. Please contact your coordinator for program creation.');
    return;
  };

  const handleEditProgram = async (e) => {
    // Trainers cannot edit programs - only coordinators/faculty can
    alert('Only coordinators and faculty members can edit programs. Please contact your coordinator for program modifications.');
    return;
  };

  const handleDeleteProgram = async (programId) => {
    // Trainers cannot delete programs - only coordinators/faculty can
    alert('Only coordinators and faculty members can delete programs. Please contact your coordinator.');
    return;
  };

  const renderOverview = () => (
    <div className="dashboard-overview">
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <h3>Assigned Sessions</h3>
            <p className="stat-number">{stats.upcomingSessions}</p>
          </div>
        </div>
        
        <div className="stat-card secondary">
          <div className="stat-icon">📚</div>
          <div className="stat-content">
            <h3>Available Programs</h3>
            <p className="stat-number">{stats.totalPrograms}</p>
          </div>
        </div>
        
        <div className="stat-card success">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Total Participants</h3>
            <p className="stat-number">{participants.length}</p>
          </div>
        </div>
        
        <div className="stat-card warning">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>Attendance Rate</h3>
            <p className="stat-number">{stats.completionRate}%</p>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="action-buttons">
          <button 
            className="btn-secondary"
            onClick={() => setActiveSection('attendance')}
          >
            ✅ Mark Attendance
          </button>
          <button 
            className="btn-secondary"
            onClick={() => setActiveSection('participants')}
          >
            � View Participants
          </button>
          <button 
            className="btn-secondary"
            onClick={() => setActiveSection('sessions')}
          >
            🎯 View Sessions
          </button>
          <button 
            className="btn-secondary"
            onClick={() => setActiveSection('tools')}
          >
            � Training Tools
          </button>
        </div>
      </div>

      <div className="recent-sessions">
        <h3>Upcoming Training Sessions</h3>
        <div className="sessions-list">
          {upcomingSessions.length > 0 ? upcomingSessions.map(session => (
            <div key={session._id} className="session-item">
              <div className="session-info">
                <h4>{session.title}</h4>
                <p>{new Date(session.startDate || session.date).toLocaleDateString()} - {session.venue || session.location}</p>
                <span className="session-type">{session.category || session.type}</span>
              </div>
              <span className={`session-status ${session.status || 'scheduled'}`}>
                {session.status || 'Scheduled'}
              </span>
            </div>
          )) : (
            <div className="empty-state">
              <p>No upcoming sessions assigned. Contact your coordinator for session assignments.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderParticipants = () => (
    <div className="participants-section">
      <div className="section-header">
        <h3>Training Participants</h3>
        <p>View participants across all training programs you're assisting with</p>
      </div>
      
      <div className="participants-list">
        {participants.map(participant => (
          <div key={participant.id} className="participant-card">
            <div className="participant-info">
              <h4>{participant.name}</h4>
              <p>{participant.email}</p>
              <p><strong>Program:</strong> {participant.program}</p>
            </div>
            <div className="progress-section">
              <p><strong>Progress:</strong> {participant.progress}%</p>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${participant.progress}%` }}
                ></div>
              </div>
            </div>
            <div className="participant-actions">
              <button className="btn-outline">View Details</button>
              <button className="btn-outline">Mark Attendance</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTools = () => (
    <div className="tools-section">
      <div className="section-header">
        <h3>Trainer Tools</h3>
      </div>
      
      <div className="tools-grid">
        <div className="tool-card">
          <div className="tool-icon">📚</div>
          <h4>Curriculum Builder</h4>
          <p>Create and manage training curricula and materials</p>
          <button className="btn-outline">Build Curriculum</button>
        </div>
        
        <div className="tool-card">
          <div className="tool-icon">📊</div>
          <h4>Progress Tracking</h4>
          <p>Monitor participant progress and performance metrics</p>
          <button className="btn-outline">Track Progress</button>
        </div>
        
        <div className="tool-card">
          <div className="tool-icon">✅</div>
          <h4>Assessment Tools</h4>
          <p>Create quizzes, assignments, and evaluations</p>
          <button className="btn-outline">Create Assessment</button>
        </div>
        
        <div className="tool-card">
          <div className="tool-icon">🎥</div>
          <h4>Resource Library</h4>
          <p>Manage training materials, videos, and documents</p>
          <button className="btn-outline">Manage Resources</button>
        </div>
        
        <div className="tool-card">
          <div className="tool-icon">🏆</div>
          <h4>Certification</h4>
          <p>Issue certificates and track completion status</p>
          <button className="btn-outline">Manage Certificates</button>
        </div>
        
        <div className="tool-card">
          <div className="tool-icon">💬</div>
          <h4>Discussion Forums</h4>
          <p>Facilitate participant discussions and Q&A sessions</p>
          <button className="btn-outline">Manage Forums</button>
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
        <h1>Trainer Dashboard</h1>
        <p className="dashboard-subtitle">Assist with training sessions, mark attendance, and interact with participants</p>
      </div>

      <div className="dashboard-nav">
        <button 
          className={`nav-button ${activeSection === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveSection('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={`nav-button ${activeSection === 'sessions' ? 'active' : ''}`}
          onClick={() => setActiveSection('sessions')}
        >
          🎯 Assigned Sessions
        </button>
        <button 
          className={`nav-button ${activeSection === 'participants' ? 'active' : ''}`}
          onClick={() => setActiveSection('participants')}
        >
          👥 Participants
        </button>
        <button 
          className={`nav-button ${activeSection === 'attendance' ? 'active' : ''}`}
          onClick={() => setActiveSection('attendance')}
        >
          ✅ Attendance System
        </button>
        <button 
          className={`nav-button ${activeSection === 'tools' ? 'active' : ''}`}
          onClick={() => setActiveSection('tools')}
        >
          🔧 Tools
        </button>
      </div>

      <div className="dashboard-content">
        {activeSection === 'overview' && renderOverview()}
        {activeSection === 'sessions' && (
          <div className="sessions-section">
            <div className="section-header">
              <h3>Assigned Training Sessions</h3>
              <p>View and manage sessions assigned to you as a trainer</p>
            </div>
            <SessionManagement 
              onClose={() => setActiveSection('overview')}
              trainerMode={true}
            />
          </div>
        )}
        {activeSection === 'participants' && renderParticipants()}
        {activeSection === 'attendance' && (
          <SmartAttendanceSystem 
            onClose={() => setActiveSection('overview')}
          />
        )}
        {activeSection === 'tools' && renderTools()}
      </div>
    </div>
  );
};

export default TrainerDashboard;