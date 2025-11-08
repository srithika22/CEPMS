const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
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
  eventTitle: String,
  eventCategory: String,
  eventStartDate: Date,
  eventEndDate: Date,
  userName: String,
  userEmail: String,
  userRole: String,
  rollNumber: String,
  department: String,
  year: Number,
  section: String,
  program: String,

  // Status
  status: {
    type: String,
    enum: ['confirmed', 'waitlisted', 'cancelled'],
    default: 'confirmed'
  },
  registeredAt: {
    type: Date,
    default: Date.now
  },

  // Attendance tracking
  attendance: [{
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session'
    },
    date: Date,
    present: {
      type: Boolean,
      default: false
    },
    markedAt: Date
  }],

  // Attendance summary
  totalSessions: {
    type: Number,
    default: 0
  },
  attendedSessions: {
    type: Number,
    default: 0
  },
  attendancePercentage: {
    type: Number,
    default: 0
  },

  // Certificate
  certificate: {
    eligible: {
      type: Boolean,
      default: false
    },
    issued: {
      type: Boolean,
      default: false
    },
    certificateId: String,
    url: String,
    issuedAt: Date
  },

  // Feedback with detailed tracking
  feedbackSubmitted: {
    type: Boolean,
    default: false
  },
  feedbackAt: Date,
  feedbackScore: Number,

  // Analytics and tracking
  analytics: {
    registrationSource: {
      type: String,
      enum: ['web', 'mobile', 'admin', 'bulk_import'],
      default: 'web'
    },
    firstLoginAfterRegistration: Date,
    totalSessionsAttended: {
      type: Number,
      default: 0
    },
    consecutiveAbsences: {
      type: Number,
      default: 0
    },
    lastAttendanceDate: Date,
    engagementScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },

  // Performance tracking
  performanceMetrics: {
    attendanceStreak: {
      type: Number,
      default: 0
    },
    maxConsecutiveAttendance: {
      type: Number,
      default: 0
    },
    punctualityScore: {
      type: Number,
      default: 100
    },
    participationLevel: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium'
    }
  }
}, {
  timestamps: true
});

// Comprehensive indexing for analytics and filtering
registrationSchema.index({ eventId: 1, userId: 1 }, { unique: true });
registrationSchema.index({ userId: 1 });
registrationSchema.index({ eventId: 1 });
registrationSchema.index({ status: 1 });
registrationSchema.index({ registeredAt: -1 });
registrationSchema.index({ department: 1 });
registrationSchema.index({ year: 1 });
registrationSchema.index({ section: 1 });

// Compound indexes for advanced filtering and analytics
registrationSchema.index({ eventId: 1, status: 1, department: 1 });
registrationSchema.index({ eventId: 1, year: 1, section: 1 });
registrationSchema.index({ department: 1, year: 1, status: 1 });
registrationSchema.index({ eventCategory: 1, registeredAt: -1 });
registrationSchema.index({ eventStartDate: 1, status: 1 });

// Performance and analytics indexes
registrationSchema.index({ attendancePercentage: -1 });
registrationSchema.index({ 'certificate.eligible': 1 });
registrationSchema.index({ 'certificate.issued': 1 });
registrationSchema.index({ 'analytics.engagementScore': -1 });
registrationSchema.index({ 'performanceMetrics.attendanceStreak': -1 });

// Time-based analytics
registrationSchema.index({ registeredAt: -1, status: 1 });
registrationSchema.index({ eventStartDate: 1, department: 1 });

// Search optimization
registrationSchema.index({ rollNumber: 1, eventId: 1 });
registrationSchema.index({ userEmail: 1, registeredAt: -1 });

// Text search index
registrationSchema.index({
  userName: 'text',
  userEmail: 'text',
  rollNumber: 'text',
  eventTitle: 'text'
}, {
  weights: {
    rollNumber: 10,
    userName: 8,
    userEmail: 5,
    eventTitle: 3
  },
  name: 'registration_text_index'
});

// Calculate attendance percentage
registrationSchema.methods.calculateAttendance = function() {
  if (this.totalSessions > 0) {
    this.attendancePercentage = (this.attendedSessions / this.totalSessions) * 100;
  }
  return this.attendancePercentage;
};

module.exports = mongoose.model('Registration', registrationSchema);
