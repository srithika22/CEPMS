const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Role-based dashboard routes
router.get('/admin', authorize('admin'), dashboardController.getAdminDashboard);
router.get('/coordinator', authorize('faculty', 'admin'), dashboardController.getCoordinatorDashboard);
router.get('/student', authorize('student'), dashboardController.getStudentDashboard);
router.get('/trainer', authorize('trainer'), dashboardController.getTrainerDashboard);

// Enhanced analytics routes
router.get('/analytics/overview', authorize('admin'), dashboardController.getAnalyticsOverview);
router.get('/analytics/realtime', dashboardController.getRealtimeStats);
router.get('/analytics/trends', authorize('admin'), dashboardController.getTrends);
router.get('/analytics/performance', authorize('admin'), dashboardController.getPerformanceMetrics);

module.exports = router;
