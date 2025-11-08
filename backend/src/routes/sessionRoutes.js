const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const { protect, checkCoordinator } = require('../middleware/auth');

// Public routes
router.get('/event/:eventId', sessionController.getEventSessions);
router.get('/:id', sessionController.getSessionById);

// Protected routes
router.use(protect);

// General sessions route for faculty/coordinators
router.get('/', sessionController.getAllSessions);

router.use(checkCoordinator);

router.post('/', sessionController.createSession);
router.put('/:id', sessionController.updateSession);
router.delete('/:id', sessionController.deleteSession);
router.post('/:id/materials', sessionController.addSessionMaterial);
router.patch('/:id/status', sessionController.updateSessionStatus);

// Enhanced session routes
router.get('/analytics/:eventId', sessionController.getSessionAnalytics);
router.post('/:id/start', sessionController.startSession);
router.post('/:id/end', sessionController.endSession);

module.exports = router;
