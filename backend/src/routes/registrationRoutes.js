const express = require('express');
const router = express.Router();
const { protect, authorize, checkCoordinator, checkCoordinatorOrEventTrainer } = require('../middleware/auth');
const registrationController = require('../controllers/registrationController');

// Helper to wrap controller handlers safely. If a controller method is missing
// we return a 501 Not Implemented response instead of crashing the app at
// route registration time (Express requires a function handler).
const safeHandler = (name) => {
  const fn = registrationController[name];
  if (typeof fn === 'function') return fn;
  return (req, res) => {
    console.warn(`Handler for ${name} is not implemented`);
    return res.status(501).json({ success: false, message: `${name} not implemented` });
  };
};

// All routes require authentication
router.use(protect);

// User routes
router.post('/', safeHandler('registerForEvent'));
router.get('/my-registrations', safeHandler('getMyRegistrations'));
router.get('/:id', safeHandler('getRegistrationById'));
router.delete('/:id', safeHandler('cancelRegistration'));

// Coordinator/Admin/Trainer routes (trainers can access if they have sessions for the event)
router.get('/event/:eventId', checkCoordinatorOrEventTrainer, safeHandler('getEventRegistrations'));
router.get('/event/:eventId/export', checkCoordinator, safeHandler('exportRegistrations'));

module.exports = router;
