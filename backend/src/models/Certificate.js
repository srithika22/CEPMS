const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  certificateId: {
    type: String,
    unique: true,
    required: false // Will be auto-generated
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

  // Denormalized
  eventTitle: String,
  userName: String,
  rollNumber: String,
  department: String,

  // Certificate details
  eventDuration: String,
  eventDates: String,
  attendancePercentage: Number,

  // URLs
  templateUrl: String,
  certificateUrl: String,

  // Verification
  verificationCode: {
    type: String,
    unique: true,
    required: false // Will be auto-generated
  },

  // Issue info
  issuedAt: {
    type: Date,
    default: Date.now
  },
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Download tracking
  downloadCount: {
    type: Number,
    default: 0
  },
  lastDownloadedAt: Date
}, {
  timestamps: true
});

// Indexes (certificateId and verificationCode already have unique: true, so indexes are auto-created)
certificateSchema.index({ eventId: 1 });
certificateSchema.index({ userId: 1 });

// Auto-generate certificateId and verificationCode before validation
certificateSchema.pre('validate', async function(next) {
  if (this.isNew) {
    try {
      if (!this.certificateId) {
        const year = new Date().getFullYear();
        const count = await this.constructor.countDocuments();
        this.certificateId = `CERT-${year}-${String(count + 1).padStart(6, '0')}`;
      }
      
      if (!this.verificationCode) {
        this.verificationCode = require('crypto').randomBytes(16).toString('hex');
      }
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Ensure required fields exist before save
certificateSchema.pre('save', function(next) {
  if (!this.certificateId || !this.verificationCode) {
    return next(new Error('certificateId and verificationCode are required'));
  }
  next();
});

module.exports = mongoose.model('Certificate', certificateSchema);
