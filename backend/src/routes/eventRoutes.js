const express = require('express');
const router = express.Router();
const { protect, authorize, checkCoordinator } = require('../middleware/auth');
const eventController = require('../controllers/eventController');

// Helper to wrap controller handlers safely. If a controller method is missing
// we return a 501 Not Implemented response instead of crashing the app at
// route registration time (Express requires a function handler).
const safeHandler = (name) => {
  const fn = eventController[name];
  if (typeof fn === 'function') return fn;
  return (req, res) => {
    console.warn(`Handler for ${name} is not implemented`);
    return res.status(501).json({ success: false, message: `${name} not implemented` });
  };
};

// Public routes - specific routes must come before parameterized routes
router.get('/', safeHandler('getAllEvents'));

// Admin listing with status filters
router.get('/admin', protect, authorize('admin'), safeHandler('getAllEventsAdmin'));

// Protected routes - specific routes first (must come before /:id to avoid route conflicts)
router.get('/registered', protect, safeHandler('getRegisteredEvents'));
router.get('/my-events', protect, safeHandler('getMyEvents'));
router.get('/trainer-events', protect, authorize('trainer'), safeHandler('getTrainerEvents'));

// Public route for getting event by ID (must come after specific routes)
router.get('/:id', safeHandler('getEventById'));

// Creation allowed for coordinators (faculty with permission) and admins
router.post('/', protect, checkCoordinator, safeHandler('createEvent'));
router.put('/:id', protect, authorize('admin'), safeHandler('updateEvent'));
router.delete('/:id', protect, authorize('admin'), safeHandler('deleteEvent'));
router.patch('/:id/approve', protect, authorize('admin'), safeHandler('approveEvent'));
router.patch('/:id/reject', protect, authorize('admin'), safeHandler('rejectEvent'));
router.patch('/:id/status', protect, authorize('admin'), safeHandler('updateEventStatus'));
router.patch('/:id/toggle-registration', protect, authorize('admin'), safeHandler('toggleRegistration'));
router.get('/:id/stats', protect, checkCoordinator, safeHandler('getEventStats'));

// Enhanced analytics routes
router.get('/analytics/overview', protect, authorize('admin'), safeHandler('getEventsOverview'));
router.get('/analytics/department/:department', protect, checkCoordinator, safeHandler('getDepartmentAnalytics'));
router.get('/:id/analytics/detailed', protect, checkCoordinator, safeHandler('getDetailedEventAnalytics'));

module.exports = router;
