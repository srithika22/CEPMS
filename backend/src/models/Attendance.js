const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Denormalized data for faster queries
  userName: String,
  rollNumber: String,
  department: String,
  year: Number,
  section: String,
  
  // Event and session denormalized data
  eventTitle: String,
  sessionTitle: String,
  sessionDate: Date,

  // Attendance
  present: {
    type: Boolean,
    default: false
  },
  markedAt: {
    type: Date,
    default: Date.now
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Additional tracking
  remarks: String,
  lateArrival: {
    type: Boolean,
    default: false
  },
  earlyDeparture: {
    type: Boolean,
    default: false
  },
  
  // Geolocation tracking (optional)
  location: {
    latitude: Number,
    longitude: Number,
    accuracy: Number
  },
  
  // Device tracking (optional)
  deviceInfo: {
    userAgent: String,
    ipAddress: String
  }
}, {
  timestamps: true
});

// Comprehensive indexing for analytics and filtering
attendanceSchema.index({ sessionId: 1, userId: 1 }, { unique: true });
attendanceSchema.index({ eventId: 1 });
attendanceSchema.index({ userId: 1 });
attendanceSchema.index({ markedAt: -1 });
attendanceSchema.index({ present: 1 });
attendanceSchema.index({ markedBy: 1 });

// Compound indexes for advanced analytics
attendanceSchema.index({ eventId: 1, present: 1 });
attendanceSchema.index({ eventId: 1, department: 1, present: 1 });
attendanceSchema.index({ eventId: 1, year: 1, section: 1 });
attendanceSchema.index({ sessionId: 1, present: 1 });
attendanceSchema.index({ department: 1, markedAt: -1 });
attendanceSchema.index({ year: 1, section: 1, present: 1 });

// Time-based analytics indexes
attendanceSchema.index({ markedAt: -1, present: 1 });
attendanceSchema.index({ sessionDate: 1, department: 1 });

// Performance indexes
attendanceSchema.index({ userId: 1, present: 1, markedAt: -1 });
attendanceSchema.index({ rollNumber: 1, markedAt: -1 });

// Text search for attendance records
attendanceSchema.index({
  userName: 'text',
  rollNumber: 'text',
  eventTitle: 'text',
  sessionTitle: 'text',
  remarks: 'text'
}, {
  weights: {
    rollNumber: 10,
    userName: 8,
    eventTitle: 5,
    sessionTitle: 3,
    remarks: 1
  },
  name: 'attendance_text_index'
});

module.exports = mongoose.model('Attendance', attendanceSchema);
