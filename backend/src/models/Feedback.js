const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
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
  trainerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Denormalized
  eventTitle: String,
  userName: String,
  userEmail: String,
  rollNumber: String,
  trainerName: String,

  // Responses
  responses: [{
    questionId: String,
    question: String,
    type: {
      type: String,
      enum: ['rating', 'text', 'mcq']
    },
    answer: mongoose.Schema.Types.Mixed
  }],

  // Overall rating
  overallRating: {
    type: Number,
    min: 1,
    max: 5
  },

  comments: String,

  submittedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
feedbackSchema.index({ eventId: 1, userId: 1 }, { unique: true });
feedbackSchema.index({ eventId: 1 });
feedbackSchema.index({ trainerId: 1 });
feedbackSchema.index({ userId: 1 });

module.exports = mongoose.model('Feedback', feedbackSchema);
