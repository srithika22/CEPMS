const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  // Time period for this analytics record
  period: {
    type: String,
    required: true,
    enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly']
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },

  // General platform metrics
  platformMetrics: {
    totalUsers: Number,
    activeUsers: Number,
    newUsers: Number,
    totalEvents: Number,
    completedEvents: Number,
    totalRegistrations: Number,
    totalAttendance: Number,
    avgAttendanceRate: Number,
    certificatesIssued: Number
  },

  // Department-wise analytics
  departmentAnalytics: [{
    department: String,
    metrics: {
      totalStudents: Number,
      activeStudents: Number,
      eventsParticipated: Number,
      avgAttendanceRate: Number,
      certificatesEarned: Number,
      topPerformers: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        name: String,
        attendanceRate: Number
      }]
    }
  }],

  // Event category analytics
  categoryAnalytics: [{
    category: String,
    metrics: {
      totalEvents: Number,
      avgParticipants: Number,
      avgAttendanceRate: Number,
      avgRating: Number,
      completionRate: Number
    }
  }],

  // Attendance patterns
  attendancePatterns: {
    byHour: [{
      hour: Number,
      attendanceCount: Number,
      attendanceRate: Number
    }],
    byDayOfWeek: [{
      dayOfWeek: Number, // 1-7 (Sunday-Saturday)
      attendanceCount: Number,
      attendanceRate: Number
    }],
    byMonth: [{
      month: Number, // 1-12
      attendanceCount: Number,
      attendanceRate: Number
    }]
  },

  // Performance trends
  trends: {
    userGrowth: {
      rate: Number,
      direction: String // 'up', 'down', 'stable'
    },
    eventGrowth: {
      rate: Number,
      direction: String
    },
    attendanceGrowth: {
      rate: Number,
      direction: String
    },
    engagementGrowth: {
      rate: Number,
      direction: String
    }
  },

  // Real-time snapshots (for daily records)
  realTimeSnapshots: [{
    timestamp: Date,
    onlineUsers: Number,
    activeSessions: Number,
    ongoingEvents: Number
  }],

  // Computed at generation time
  generatedAt: {
    type: Date,
    default: Date.now
  },
  generatedBy: {
    type: String,
    default: 'system'
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
analyticsSchema.index({ period: 1, startDate: 1 });
analyticsSchema.index({ period: 1, endDate: -1 });
analyticsSchema.index({ startDate: 1, endDate: 1 });
analyticsSchema.index({ generatedAt: -1 });

// Compound indexes
analyticsSchema.index({ period: 1, startDate: 1, endDate: 1 }, { unique: true });

// TTL index for automatic cleanup of old daily records (keep for 1 year)
analyticsSchema.index({ createdAt: 1 }, { 
  expireAfterSeconds: 365 * 24 * 60 * 60, // 1 year
  partialFilterExpression: { period: 'daily' }
});

module.exports = mongoose.model('Analytics', analyticsSchema);