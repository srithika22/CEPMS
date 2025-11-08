const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const userController = require('../controllers/userController');

// Helper to wrap controller handlers safely. If a controller method is missing
// we return a 501 Not Implemented response instead of crashing the app at
// route registration time (Express requires a function handler).
const safeHandler = (name) => {
	const fn = userController[name];
	if (typeof fn === 'function') return fn;
	return (req, res) => {
		console.warn(`Handler for ${name} is not implemented`);
		return res.status(501).json({ success: false, message: `${name} not implemented` });
	};
};

// All routes require authentication
router.use(protect);

// User routes (own profile)
router.get('/profile', safeHandler('getProfile'));
router.put('/profile', safeHandler('updateProfile'));

// Admin routes
router.get('/', authorize('admin'), safeHandler('getAllUsers'));
router.post('/', authorize('admin'), safeHandler('createUser'));
router.get('/students/department/:department', safeHandler('getStudentsByDepartment'));
router.get('/faculty', safeHandler('getFaculty'));
router.get('/trainers', safeHandler('getTrainers'));

// Enhanced filtering routes
router.get('/students/advanced-filter', safeHandler('getStudentsAdvancedFilter'));
router.get('/event/:eventId/participants', safeHandler('getEventParticipants'));
router.get('/bulk-export', authorize('admin'), safeHandler('bulkExportUsers'));
router.post('/bulk-update', authorize('admin'), safeHandler('bulkUpdateUsers'));

router.get('/:id', authorize('admin'), safeHandler('getUserById'));
router.put('/:id', authorize('admin'), safeHandler('updateUser'));
router.delete('/:id', authorize('admin'), safeHandler('deleteUser'));
router.patch('/:id/toggle-status', authorize('admin'), safeHandler('toggleUserStatus'));

module.exports = router;
