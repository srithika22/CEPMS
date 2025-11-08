const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // Type
  type: {
    type: String,
    required: true,
    enum: [
      'event_created',
      'registration_confirmed',
      'session_reminder',
      'feedback_request',
      'certificate_ready',
      'schedule_change',
      'event_approved',
      'event_rejected',
      'event_cancelled'
    ]
  },

  // Content
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  actionUrl: String,

  // Related entities
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session'
  },

  // Recipients
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  recipientRole: {
    type: String,
    enum: ['student', 'faculty', 'trainer', 'admin', 'all']
  },
  recipientDepartments: [String],

  // Status
  read: {
    type: Boolean,
    default: false
  },
  readAt: Date,

  // Priority
  priority: {
    type: String,
    enum: ['normal', 'high', 'urgent'],
    default: 'normal'
  },

  expiresAt: {
    type: Date,
    default: () => new Date(+new Date() + 365*24*60*60*1000) // 1 year
  }
}, {
  timestamps: true
});

// Indexes
notificationSchema.index({ recipientId: 1, read: 1 });
notificationSchema.index({ eventId: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 }); // TTL 1 year

module.exports = mongoose.model('Notification', notificationSchema);
