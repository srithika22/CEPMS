const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const { protect, checkCoordinator } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// User routes
router.post('/', feedbackController.submitFeedback);
router.get('/my-feedback', feedbackController.getMyFeedback);
router.get('/check/:eventId', feedbackController.checkFeedbackStatus);

// Coordinator/Admin routes
router.get('/event/:eventId', checkCoordinator, feedbackController.getEventFeedback);
router.get('/trainer/:trainerId', feedbackController.getTrainerFeedback);

module.exports = router;
