const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { protect, checkCoordinator, checkCoordinatorOrTrainer, checkCoordinatorOrEventTrainer, checkAttendancePermission } = require('../middleware/auth');

// Helper to wrap controller handlers safely. If a controller method is missing
// we return a 501 Not Implemented response instead of crashing the app at
// route registration time (Express requires a function handler).
const safeHandler = (name) => {
  const fn = attendanceController[name];
  if (typeof fn === 'function') return fn;
  return (req, res) => {
    console.warn(`Handler for ${name} is not implemented`);
    return res.status(501).json({ success: false, message: `${name} not implemented` });
  };
};

// All routes require authentication
router.use(protect);

// General attendance route (for faculty dashboard)
router.get('/', safeHandler('getAllAttendance'));

// Faculty-specific route
router.get('/faculty', safeHandler('getFacultyAttendance'));

// User routes
router.get('/my-attendance', safeHandler('getMyAttendance'));
router.get('/user/:userId/event/:eventId', safeHandler('getUserEventAttendance'));

// Coordinator/Admin/Trainer routes for their sessions
router.post('/mark', checkAttendancePermission, safeHandler('markAttendance'));
router.get('/session/:sessionId', checkCoordinatorOrTrainer, safeHandler('getSessionAttendance'));
router.get('/event/:eventId/export', checkCoordinator, safeHandler('exportEventAttendance'));
router.get('/event/:eventId/trainer-export', checkCoordinatorOrEventTrainer, safeHandler('exportEventAttendance'));

// Enhanced analytics routes
router.get('/analytics/summary', checkCoordinator, safeHandler('getAttendanceAnalytics'));
router.get('/analytics/trends/:eventId', checkCoordinator, safeHandler('getAttendanceTrends'));
router.get('/analytics/performance/:eventId', checkCoordinator, safeHandler('getPerformanceAnalytics'));
router.get('/participants/:eventId', checkCoordinator, safeHandler('getEventParticipants'));

// Advanced filtering routes
router.get('/event/:eventId/filtered', checkCoordinator, safeHandler('getFilteredAttendance'));
router.get('/search', checkCoordinator, safeHandler('searchAttendance'));

module.exports = router;
