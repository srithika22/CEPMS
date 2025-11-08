require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { createServer } = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/database');
const { initSocket } = require('./utils/socket');
const ScheduledTasks = require('./utils/scheduledTasks');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5174',
    methods: ['GET', 'POST']
  }
});

// Initialize socket utility
initSocket(io);

// Initialize scheduled tasks for analytics and optimization
const scheduledTasks = new ScheduledTasks();
scheduledTasks.init();

// In production, start scheduled tasks
if (process.env.NODE_ENV === 'production') {
  scheduledTasks.startAll();
} else {
  console.log('🚧 Development mode: Scheduled tasks initialized but not started');
  console.log('   Use scheduledTasks.startAll() to start tasks manually');
}

// ==========================================
// MIDDLEWARE
// ==========================================
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Parse cookies
app.use(morgan('dev')); // Logging

// ==========================================
// ROUTES - MUST BE BEFORE DATABASE (to catch errors)
// ==========================================
try {
  const authRoutes = require('./routes/authRoutes');
  app.use('/api/auth', authRoutes);
  console.log('✅ Auth routes registered at /api/auth');
} catch (error) {
  console.error('❌ ERROR loading auth routes:', error);
}

// Test route - register FIRST
app.post('/test', (req, res) => {
  console.log('✅ Test route hit!');
  res.status(200).json({
    success: true,
    message: 'POST request received',
    body: req.body,
    timestamp: new Date().toISOString()
  });
});

// ==========================================
// DATABASE CONNECTION (non-blocking)
// ==========================================
connectDB().catch(err => {
  console.error('❌ Database connection failed:', err.message);
  // Don't exit - let server run without DB for testing
});
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/registrations', require('./routes/registrationRoutes'));
app.use('/api/sessions', require('./routes/sessionRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/feedback', require('./routes/feedbackRoutes'));
app.use('/api/certificates', require('./routes/certificateRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/admin/database', require('./routes/databaseRoutes'));

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});


// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ==========================================
// SOCKET.IO CONFIGURATION
// ==========================================
io.on('connection', (socket) => {
  console.log(`👤 User connected: ${socket.id}`);
  
  // Join user to their role-specific room
  socket.on('join', (userData) => {
    socket.join(userData.role);
    socket.join(userData.department);
    console.log(`🔗 User ${userData.email} joined rooms: ${userData.role}, ${userData.department}`);
  });
  
  // Join event-specific room for real-time attendance updates
  socket.on('join-event', (eventData) => {
    socket.join(`event_${eventData.eventId}`);
    console.log(`📅 User joined event room: event_${eventData.eventId}`);
  });

  // Join session-specific room for real-time session updates
  socket.on('join-session', (sessionData) => {
    socket.join(`session_${sessionData.sessionId}`);
    console.log(`🎓 User joined session room: session_${sessionData.sessionId}`);
  });

  // Leave event room
  socket.on('leave-event', (eventData) => {
    socket.leave(`event_${eventData.eventId}`);
    console.log(`📅 User left event room: event_${eventData.eventId}`);
  });

  // Leave session room
  socket.on('leave-session', (sessionData) => {
    socket.leave(`session_${sessionData.sessionId}`);
    console.log(`🎓 User left session room: session_${sessionData.sessionId}`);
  });
  
  // Handle event notifications
  socket.on('event-created', (eventData) => {
    if (eventData.department === 'All Departments') {
      io.emit('new-event', eventData);
    } else {
      io.to(eventData.department).emit('new-event', eventData);
    }
  });

  // Handle real-time attendance marking
  socket.on('attendance-marking', (data) => {
    socket.to(`event_${data.eventId}`).emit('attendance-progress', {
      sessionId: data.sessionId,
      progress: data.progress,
      markedBy: data.markedBy
    });
  });

  // Handle session live updates
  socket.on('session-update', (data) => {
    socket.to(`session_${data.sessionId}`).emit('session-live-update', data);
  });
  
  socket.on('disconnect', () => {
    console.log(`👋 User disconnected: ${socket.id}`);
  });
});

// Make io available to routes
app.set('socketio', io);

// ==========================================
// START SERVER
// ==========================================
const PORT = process.env.PORT || 5000;

// Start server with error handling
const httpServer = server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`✅ Server listening on http://localhost:${PORT}`);
  console.log(`✅ Test route: POST http://localhost:${PORT}/test`);
  console.log(`✅ Register route: POST http://localhost:${PORT}/api/auth/register`);
  console.log(`🔌 Socket.io enabled for real-time updates`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use!`);
    console.error('   Kill the process using: taskkill /PID <process_id> /F');
    console.error('   Or change PORT in .env file');
  } else {
    console.error('❌ Server error:', error);
  }
  process.exit(1);
});