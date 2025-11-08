const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    unique: true,
    required: false // Will be auto-generated
  },

  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },

  // Session Info
  number: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  duration: Number, // Minutes

  // Trainer
  trainer: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String,
    email: String
  },

  // Venue
  venue: {
    name: String,
    isOnline: {
      type: Boolean,
      default: false
    },
    meetingLink: String
  },

  // Materials
  materials: [{
    name: String,
    url: String,
    type: {
      type: String,
      enum: ['pdf', 'ppt', 'video', 'doc', 'other']
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Status with enhanced tracking
  status: {
    type: String,
    enum: ['scheduled', 'ongoing', 'completed', 'cancelled', 'postponed'],
    default: 'scheduled'
  },

  // Real-time session tracking
  realTimeTracking: {
    actualStartTime: Date,
    actualEndTime: Date,
    actualDuration: Number, // Minutes
    lateStartMinutes: {
      type: Number,
      default: 0
    },
    extendedMinutes: {
      type: Number,
      default: 0
    },
    interruptions: [{
      reason: String,
      startTime: Date,
      endTime: Date,
      duration: Number
    }]
  },

  // Enhanced attendance stats
  attendance: {
    total: {
      type: Number,
      default: 0
    },
    present: {
      type: Number,
      default: 0
    },
    absent: {
      type: Number,
      default: 0
    },
    late: {
      type: Number,
      default: 0
    },
    earlyLeave: {
      type: Number,
      default: 0
    },
    percentage: {
      type: Number,
      default: 0
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    markedAt: Date,
    // Department-wise breakdown
    departmentWise: [{
      department: String,
      total: Number,
      present: Number,
      percentage: Number
    }]
  },

  // Session analytics
  analytics: {
    avgRating: Number,
    feedbackCount: Number,
    materialDownloads: Number,
    questionCount: Number,
    engagementLevel: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium'
    },
    lastUpdated: Date
  }
}, {
  timestamps: true
});

// Comprehensive indexing for sessions and analytics
sessionSchema.index({ eventId: 1 });
sessionSchema.index({ date: 1 });
sessionSchema.index({ status: 1 });
sessionSchema.index({ number: 1 });
sessionSchema.index({ 'trainer.id': 1 });

// Compound indexes for advanced queries
sessionSchema.index({ eventId: 1, date: 1, status: 1 });
sessionSchema.index({ eventId: 1, number: 1 });
sessionSchema.index({ date: 1, status: 1 });
sessionSchema.index({ 'trainer.id': 1, date: -1 });

// Performance and analytics indexes
sessionSchema.index({ 'attendance.percentage': -1 });
sessionSchema.index({ 'analytics.avgRating': -1 });
sessionSchema.index({ 'analytics.engagementLevel': 1 });

// Real-time tracking indexes
sessionSchema.index({ 'realTimeTracking.actualStartTime': -1 });
sessionSchema.index({ 'realTimeTracking.actualEndTime': -1 });

// Time-based indexes for scheduling
sessionSchema.index({ date: 1, startTime: 1 });
sessionSchema.index({ date: -1, createdAt: -1 });

// Text search index
sessionSchema.index({
  title: 'text',
  description: 'text',
  'trainer.name': 'text',
  'venue.name': 'text'
}, {
  weights: {
    title: 10,
    'trainer.name': 5,
    description: 3,
    'venue.name': 2
  },
  name: 'session_text_index'
});

// Auto-generate sessionId before validation
sessionSchema.pre('validate', async function(next) {
  if (!this.sessionId && this.isNew && this.eventId && this.number) {
    try {
      const event = await mongoose.model('Event').findById(this.eventId);
      if (event && event.eventId) {
        this.sessionId = `SES-${event.eventId}-${String(this.number).padStart(2, '0')}`;
      } else {
        return next(new Error('Event not found or eventId not set'));
      }
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Ensure sessionId exists before save
sessionSchema.pre('save', function(next) {
  if (!this.sessionId) {
    return next(new Error('sessionId is required'));
  }
  next();
});

module.exports = mongoose.model('Session', sessionSchema);
