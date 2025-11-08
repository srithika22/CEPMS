const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  eventId: {
    type: String,
    unique: true,
    required: false // Will be auto-generated in pre-save hook
  },

  // Basic Details
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Event description is required']
  },
  category: {
    type: String,
    required: true,
    enum: ['CRT', 'FDP', 'Workshop', 'Cultural', 'Sports', 'Seminar', 'Conference', 'Other']
  },
  type: {
    type: String,
    required: true,
    enum: ['academic', 'training', 'cultural', 'sports', 'technical']
  },

  // Status & Approval
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'rejected', 'ongoing', 'completed', 'cancelled'],
    default: 'draft'
  },

  // Coordinator Info
  coordinator: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: String,
    email: String,
    phone: String,
    department: String
  },

  // Target Audience
  eligibility: {
    departments: [String],
    programs: [String],
    years: [Number],
    sections: [String]
  },

  // Registration
  registration: {
    required: {
      type: Boolean,
      default: true
    },
    startDate: Date,
    endDate: Date,
    maxParticipants: Number,
    currentCount: {
      type: Number,
      default: 0
    },
    isOpen: {
      type: Boolean,
      default: false
    }
  },

  // Schedule
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },

  // Venue
  venue: {
    name: String,
    type: {
      type: String,
      enum: ['seminar_hall', 'lab', 'auditorium', 'classroom', 'ground', 'online']
    },
    isOnline: {
      type: Boolean,
      default: false
    },
    meetingLink: String
  },

  // Trainers
  trainers: [{
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String,
    email: String,
    organization: String
  }],

  // Files & Media
  files: {
    banner: String,
    brochure: String,
    circular: String
  },

  // Certificate Settings
  certificate: {
    enabled: {
      type: Boolean,
      default: false
    },
    minAttendance: {
      type: Number,
      default: 80
    },
    templateUrl: String
  },

  // Feedback Settings
  feedback: {
    enabled: {
      type: Boolean,
      default: false
    },
    questions: [{
      id: String,
      text: String,
      type: {
        type: String,
        enum: ['rating', 'text', 'mcq']
      },
      options: [String],
      required: Boolean
    }]
  },

  // Stats with enhanced analytics
  stats: {
    totalRegistered: {
      type: Number,
      default: 0
    },
    totalAttended: {
      type: Number,
      default: 0
    },
    avgAttendance: {
      type: Number,
      default: 0
    },
    certificatesIssued: {
      type: Number,
      default: 0
    },
    avgRating: {
      type: Number,
      default: 0
    },
    // Enhanced analytics
    departmentWiseStats: [{
      department: String,
      registered: { type: Number, default: 0 },
      attended: { type: Number, default: 0 },
      avgAttendance: { type: Number, default: 0 }
    }],
    sessionWiseAttendance: [{
      sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
      attendanceRate: { type: Number, default: 0 },
      participantCount: { type: Number, default: 0 }
    }],
    peakAttendanceDay: Date,
    lowestAttendanceDay: Date,
    completionRate: {
      type: Number,
      default: 0
    }
  },

  // Performance metrics
  performance: {
    registrationRate: {
      type: Number,
      default: 0
    },
    dropoutRate: {
      type: Number,
      default: 0
    },
    engagementScore: {
      type: Number,
      default: 0
    },
    lastUpdated: Date
  },

  // Gallery
  gallery: [String],

  // Audit
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date
}, {
  timestamps: true
});

// Comprehensive indexing for analytics and filtering
eventSchema.index({ status: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ type: 1 });
eventSchema.index({ 'coordinator.id': 1 });
eventSchema.index({ 'coordinator.department': 1 });
eventSchema.index({ startDate: 1 });
eventSchema.index({ endDate: 1 });
eventSchema.index({ createdAt: -1 });
eventSchema.index({ approvedAt: -1 });

// Compound indexes for advanced analytics queries
eventSchema.index({ status: 1, startDate: 1 });
eventSchema.index({ category: 1, status: 1, startDate: 1 });
eventSchema.index({ 'coordinator.department': 1, status: 1 });
eventSchema.index({ 'eligibility.departments': 1, startDate: 1 });
eventSchema.index({ startDate: 1, endDate: 1, status: 1 });

// Performance and analytics indexes
eventSchema.index({ 'stats.avgAttendance': -1 });
eventSchema.index({ 'stats.totalRegistered': -1 });
eventSchema.index({ 'stats.avgRating': -1 });
eventSchema.index({ 'performance.engagementScore': -1 });

// Compound index to help prevent duplicates (title + dates)
eventSchema.index({ title: 1, startDate: 1, endDate: 1 });

// Text search index for events
eventSchema.index({
  title: 'text',
  description: 'text',
  category: 'text',
  'coordinator.name': 'text'
}, {
  weights: {
    title: 10,
    category: 5,
    description: 1,
    'coordinator.name': 3
  },
  name: 'event_text_index'
});

// Auto-generate eventId before validation
eventSchema.pre('validate', async function(next) {
  if (!this.eventId && this.isNew) {
    try {
      const year = new Date().getFullYear();
      
      // Use a more robust method to generate unique ID
      // Find the highest numbered eventId for this year
      const existingEvents = await this.constructor.find({
        eventId: { $regex: `^EVT-${year}-` }
      }).sort({ eventId: -1 }).limit(1);
      
      let nextNumber = 1;
      if (existingEvents.length > 0) {
        const lastEventId = existingEvents[0].eventId;
        const match = lastEventId.match(/EVT-\d{4}-(\d+)/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }
      
      // Ensure uniqueness by checking if ID exists
      let eventId = `EVT-${year}-${String(nextNumber).padStart(3, '0')}`;
      let exists = await this.constructor.findOne({ eventId });
      let attempts = 0;
      
      // If collision, try next number (max 10 attempts)
      while (exists && attempts < 10) {
        nextNumber++;
        eventId = `EVT-${year}-${String(nextNumber).padStart(3, '0')}`;
        exists = await this.constructor.findOne({ eventId });
        attempts++;
      }
      
      if (exists) {
        return next(new Error('Unable to generate unique eventId. Please try again.'));
      }
      
      this.eventId = eventId;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Ensure eventId is required after generation
eventSchema.pre('save', function(next) {
  if (!this.eventId) {
    return next(new Error('eventId is required'));
  }
  next();
});

module.exports = mongoose.model('Event', eventSchema);
