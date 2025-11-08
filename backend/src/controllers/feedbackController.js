const Feedback = require('../models/Feedback');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const ResponseHandler = require('../utils/responseHandler');

// @desc    Submit feedback
// @route   POST /api/feedback
// @access  Private
exports.submitFeedback = async (req, res) => {
  try {
    const { eventId, trainerId, responses, overallRating, comments } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return ResponseHandler.notFound(res, 'Event not found');
    }

    if (!event.feedback.enabled) {
      return ResponseHandler.badRequest(res, 'Feedback not enabled for this event');
    }

    // Check if user is registered
    const registration = await Registration.findOne({
      eventId,
      userId: req.user._id
    });

    if (!registration) {
      return ResponseHandler.forbidden(res, 'You must be registered for this event');
    }

    if (registration.feedbackSubmitted) {
      return ResponseHandler.conflict(res, 'Feedback already submitted');
    }

    // Create feedback
    const feedback = await Feedback.create({
      eventId,
      userId: req.user._id,
      trainerId,
      eventTitle: event.title,
      userName: `${req.user.firstName} ${req.user.lastName}`,
      userEmail: req.user.email,
      rollNumber: req.user.student?.rollNumber,
      trainerName: trainerId ? req.body.trainerName : undefined,
      responses,
      overallRating,
      comments
    });

    // Update registration
    registration.feedbackSubmitted = true;
    registration.feedbackAt = new Date();
    await registration.save();

    return ResponseHandler.created(res, feedback, 'Feedback submitted successfully');
  } catch (error) {
    console.error('Submit feedback error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Get event feedback
// @route   GET /api/feedback/event/:eventId
// @access  Private (Coordinator/Admin)
exports.getEventFeedback = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      return ResponseHandler.notFound(res, 'Event not found');
    }

    // Check permission
    if (req.user.role !== 'admin' && event.coordinator.id.toString() !== req.user._id.toString()) {
      return ResponseHandler.forbidden(res, 'Not authorized');
    }

    const feedback = await Feedback.find({ eventId })
      .populate('userId', 'firstName lastName email student')
      .sort({ submittedAt: -1 });

    // Calculate statistics
    const totalFeedback = feedback.length;
    const avgRating = totalFeedback > 0
      ? feedback.reduce((sum, f) => sum + f.overallRating, 0) / totalFeedback
      : 0;

    // Question-wise analysis
    const questionAnalysis = {};
    feedback.forEach(f => {
      f.responses.forEach(response => {
        if (!questionAnalysis[response.questionId]) {
          questionAnalysis[response.questionId] = {
            question: response.question,
            type: response.type,
            answers: []
          };
        }
        questionAnalysis[response.questionId].answers.push(response.answer);
      });
    });

    return ResponseHandler.success(res, {
      feedback,
      statistics: {
        total: totalFeedback,
        avgRating: avgRating.toFixed(2),
        questionAnalysis
      }
    });
  } catch (error) {
    console.error('Get event feedback error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Get trainer feedback
// @route   GET /api/feedback/trainer/:trainerId
// @access  Private
exports.getTrainerFeedback = async (req, res) => {
  try {
    const { trainerId } = req.params;

    const feedback = await Feedback.find({ trainerId })
      .populate('eventId', 'title eventId')
      .sort({ submittedAt: -1 });

    const totalFeedback = feedback.length;
    const avgRating = totalFeedback > 0
      ? feedback.reduce((sum, f) => sum + f.overallRating, 0) / totalFeedback
      : 0;

    return ResponseHandler.success(res, {
      feedback,
      statistics: {
        total: totalFeedback,
        avgRating: avgRating.toFixed(2)
      }
    });
  } catch (error) {
    console.error('Get trainer feedback error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Get my submitted feedback
// @route   GET /api/feedback/my-feedback
// @access  Private
exports.getMyFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find({ userId: req.user._id })
      .populate('eventId', 'title eventId')
      .sort({ submittedAt: -1 });

    return ResponseHandler.success(res, feedback);
  } catch (error) {
    console.error('Get my feedback error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Check if feedback submitted
// @route   GET /api/feedback/check/:eventId
// @access  Private
exports.checkFeedbackStatus = async (req, res) => {
  try {
    const { eventId } = req.params;

    const feedback = await Feedback.findOne({
      eventId,
      userId: req.user._id
    });

    return ResponseHandler.success(res, {
      submitted: !!feedback,
      feedback: feedback || null
    });
  } catch (error) {
    console.error('Check feedback status error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};
