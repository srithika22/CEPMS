const mongoose = require('mongoose');

const performanceSchema = new mongoose.Schema({
  // Target entity
  entityType: {
    type: String,
    required: true,
    enum: ['user', 'event', 'session', 'department', 'trainer']
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'entityModel'
  },
  entityModel: {
    type: String,
    required: true,
    enum: ['User', 'Event', 'Session']
  },

  // Time period
  period: {
    startDate: Date,
    endDate: Date
  },

  // User performance metrics
  userMetrics: {
    attendanceRate: Number,
    eventsParticipated: Number,
    certificatesEarned: Number,
    avgEventRating: Number,
    consistencyScore: Number, // Based on regular attendance
    engagementLevel: {
      type: String,
      enum: ['high', 'medium', 'low']
    },
    punctualityScore: Number,
    participationScore: Number,
    improvementTrend: String // 'improving', 'declining', 'stable'
  },

  // Event performance metrics
  eventMetrics: {
    registrationRate: Number,
    attendanceRate: Number,
    completionRate: Number,
    avgRating: Number,
    certificateEligibilityRate: Number,
    departmentDiversity: Number, // How many departments participated
    engagementScore: Number,
    feedbackResponseRate: Number,
    dropoutRate: Number
  },

  // Session performance metrics
  sessionMetrics: {
    attendanceRate: Number,
    punctualityRate: Number,
    participationLevel: String,
    materialEngagement: Number,
    avgRating: Number,
    durationAdherence: Number // How well did it stick to planned duration
  },

  // Department performance metrics
  departmentMetrics: {
    totalParticipants: Number,
    avgAttendanceRate: Number,
    topPerformersCount: Number,
    eventDiversity: Number, // Different types of events participated
    certificateEarnRate: Number,
    engagementTrend: String
  },

  // Trainer performance metrics
  trainerMetrics: {
    avgRating: Number,
    eventsDelivered: Number,
    avgAttendanceRate: Number,
    participantSatisfaction: Number,
    materialQuality: Number,
    punctuality: Number,
    engagement: Number
  },

  // Rankings and comparisons
  rankings: {
    overallRank: Number,
    departmentRank: Number,
    categoryRank: Number,
    percentile: Number
  },

  // Alerts and recommendations
  alerts: [{
    type: String, // 'low_attendance', 'declining_performance', 'high_performer'
    message: String,
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical']
    },
    generatedAt: Date
  }],

  recommendations: [{
    type: String,
    description: String,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high']
    }
  }],

  // Metadata
  calculatedAt: {
    type: Date,
    default: Date.now
  },
  lastUpdated: Date,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for performance tracking
performanceSchema.index({ entityType: 1, entityId: 1 });
performanceSchema.index({ entityType: 1, calculatedAt: -1 });
performanceSchema.index({ 'period.startDate': 1, 'period.endDate': 1 });

// Performance-specific indexes
performanceSchema.index({ 'userMetrics.attendanceRate': -1 });
performanceSchema.index({ 'eventMetrics.attendanceRate': -1 });
performanceSchema.index({ 'rankings.overallRank': 1 });
performanceSchema.index({ 'rankings.percentile': -1 });

// Alert indexes
performanceSchema.index({ 'alerts.type': 1, 'alerts.severity': 1 });
performanceSchema.index({ calculatedAt: -1, isActive: 1 });

// Compound indexes
performanceSchema.index({ 
  entityType: 1, 
  'period.startDate': 1, 
  'period.endDate': 1 
});

// TTL index for old performance records (keep for 2 years)
performanceSchema.index({ createdAt: 1 }, { 
  expireAfterSeconds: 2 * 365 * 24 * 60 * 60 // 2 years
});

// Methods for calculating metrics
performanceSchema.methods.calculateUserMetrics = async function() {
  // Implementation would go here
  // Calculate attendance rate, consistency score, etc.
};

performanceSchema.methods.generateRecommendations = function() {
  // Generate recommendations based on performance metrics
  const recommendations = [];
  
  if (this.entityType === 'user' && this.userMetrics.attendanceRate < 60) {
    recommendations.push({
      type: 'attendance_improvement',
      description: 'Consider setting attendance reminders and reviewing session schedules',
      priority: 'high'
    });
  }
  
  if (this.entityType === 'event' && this.eventMetrics.dropoutRate > 30) {
    recommendations.push({
      type: 'engagement_improvement',
      description: 'Review event content and delivery methods to improve retention',
      priority: 'medium'
    });
  }
  
  this.recommendations = recommendations;
};

module.exports = mongoose.model('Performance', performanceSchema);