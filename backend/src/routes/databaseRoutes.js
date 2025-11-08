const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const DatabaseOptimizer = require('../utils/databaseOptimizer');
const ScheduledTasks = require('../utils/scheduledTasks');
const ResponseHandler = require('../utils/responseHandler');

const optimizer = new DatabaseOptimizer();
const scheduledTasks = new ScheduledTasks();

// Initialize scheduled tasks
scheduledTasks.init();

// @desc    Get database health status
// @route   GET /api/admin/database/health
// @access  Private/Admin
router.get('/health', protect, authorize('admin'), async (req, res) => {
  try {
    const healthReport = await optimizer.healthCheck();
    return ResponseHandler.success(res, healthReport, 'Database health check completed');
  } catch (error) {
    console.error('Database health check error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
});

// @desc    Create database indexes
// @route   POST /api/admin/database/indexes
// @access  Private/Admin
router.post('/indexes', protect, authorize('admin'), async (req, res) => {
  try {
    await optimizer.createIndexes();
    return ResponseHandler.success(res, null, 'Database indexes created successfully');
  } catch (error) {
    console.error('Create indexes error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
});

// @desc    Update user analytics
// @route   POST /api/admin/database/analytics/users
// @access  Private/Admin
router.post('/analytics/users', protect, authorize('admin'), async (req, res) => {
  try {
    await optimizer.updateUserAnalytics();
    return ResponseHandler.success(res, null, 'User analytics updated successfully');
  } catch (error) {
    console.error('Update user analytics error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
});

// @desc    Update event analytics
// @route   POST /api/admin/database/analytics/events
// @access  Private/Admin
router.post('/analytics/events', protect, authorize('admin'), async (req, res) => {
  try {
    await optimizer.updateEventAnalytics();
    return ResponseHandler.success(res, null, 'Event analytics updated successfully');
  } catch (error) {
    console.error('Update event analytics error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
});

// @desc    Generate analytics summary
// @route   POST /api/admin/database/analytics/generate
// @access  Private/Admin
router.post('/analytics/generate', protect, authorize('admin'), async (req, res) => {
  try {
    const { period = 'daily' } = req.body;
    
    if (!['daily', 'weekly', 'monthly'].includes(period)) {
      return ResponseHandler.badRequest(res, 'Invalid period. Must be daily, weekly, or monthly');
    }

    const analytics = await optimizer.generateAnalyticsSummary(period);
    return ResponseHandler.success(res, analytics, `${period} analytics generated successfully`);
  } catch (error) {
    console.error('Generate analytics error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
});

// @desc    Clean up old data
// @route   POST /api/admin/database/cleanup
// @access  Private/Admin
router.post('/cleanup', protect, authorize('admin'), async (req, res) => {
  try {
    await optimizer.cleanupOldData();
    return ResponseHandler.success(res, null, 'Database cleanup completed successfully');
  } catch (error) {
    console.error('Database cleanup error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
});

// @desc    Run complete optimization
// @route   POST /api/admin/database/optimize
// @access  Private/Admin
router.post('/optimize', protect, authorize('admin'), async (req, res) => {
  try {
    await optimizer.runCompleteOptimization();
    return ResponseHandler.success(res, null, 'Database optimization completed successfully');
  } catch (error) {
    console.error('Database optimization error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
});

// @desc    Get scheduled tasks status
// @route   GET /api/admin/database/tasks/status
// @access  Private/Admin
router.get('/tasks/status', protect, authorize('admin'), (req, res) => {
  try {
    const status = scheduledTasks.getTaskStatus();
    return ResponseHandler.success(res, status, 'Scheduled tasks status retrieved');
  } catch (error) {
    console.error('Get tasks status error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
});

// @desc    Start scheduled tasks
// @route   POST /api/admin/database/tasks/start
// @access  Private/Admin
router.post('/tasks/start', protect, authorize('admin'), (req, res) => {
  try {
    const { taskName } = req.body;
    
    if (taskName) {
      scheduledTasks.startTask(taskName);
      return ResponseHandler.success(res, null, `Task ${taskName} started successfully`);
    } else {
      scheduledTasks.startAll();
      return ResponseHandler.success(res, null, 'All scheduled tasks started successfully');
    }
  } catch (error) {
    console.error('Start tasks error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
});

// @desc    Stop scheduled tasks
// @route   POST /api/admin/database/tasks/stop
// @access  Private/Admin
router.post('/tasks/stop', protect, authorize('admin'), (req, res) => {
  try {
    const { taskName } = req.body;
    
    if (taskName) {
      scheduledTasks.stopTask(taskName);
      return ResponseHandler.success(res, null, `Task ${taskName} stopped successfully`);
    } else {
      scheduledTasks.stopAll();
      return ResponseHandler.success(res, null, 'All scheduled tasks stopped successfully');
    }
  } catch (error) {
    console.error('Stop tasks error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
});

// @desc    Run scheduled task manually
// @route   POST /api/admin/database/tasks/run
// @access  Private/Admin
router.post('/tasks/run', protect, authorize('admin'), async (req, res) => {
  try {
    const { taskName } = req.body;
    
    if (!taskName) {
      return ResponseHandler.badRequest(res, 'Task name is required');
    }

    await scheduledTasks.runTaskManually(taskName);
    return ResponseHandler.success(res, null, `Task ${taskName} executed successfully`);
  } catch (error) {
    console.error('Run task manually error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
});

// @desc    Get database statistics
// @route   GET /api/admin/database/stats
// @access  Private/Admin
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const db = mongoose.connection.db;
    
    const stats = await db.stats();
    const collections = await db.listCollections().toArray();
    
    const collectionStats = await Promise.all(
      collections.map(async (collection) => {
        try {
          const collStats = await db.collection(collection.name).stats();
          return {
            name: collection.name,
            documents: collStats.count,
            size: collStats.size,
            avgDocSize: collStats.avgObjSize,
            indexes: collStats.nindexes,
            indexSize: collStats.totalIndexSize
          };
        } catch (error) {
          return {
            name: collection.name,
            error: error.message
          };
        }
      })
    );

    return ResponseHandler.success(res, {
      database: {
        name: stats.db,
        collections: stats.collections,
        documents: stats.objects,
        dataSize: stats.dataSize,
        storageSize: stats.storageSize,
        indexSize: stats.indexSize
      },
      collections: collectionStats
    }, 'Database statistics retrieved successfully');
  } catch (error) {
    console.error('Get database stats error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
});

module.exports = router;