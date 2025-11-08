const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Attendance = require('../models/Attendance');

// All routes require authentication
router.use(protect);

// Faculty-specific analytics
router.get('/faculty', async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'faculty') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    let eventQuery = {};
    
    // Filter by faculty's coordinated events
    if (req.user.role === 'faculty') {
      eventQuery['coordinator.id'] = req.user._id;
    }
    
    const [
      myEvents,
      totalRegistrations,
      totalAttendance
    ] = await Promise.all([
      Event.find(eventQuery),
      Registration.countDocuments(eventQuery.length ? { eventId: { $in: await Event.find(eventQuery).distinct('_id') } } : {}),
      Attendance.countDocuments(eventQuery.length ? { eventId: { $in: await Event.find(eventQuery).distinct('_id') } } : {})
    ]);

    // Event analytics
    const eventsByStatus = await Event.aggregate([
      { $match: eventQuery },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    const eventsByCategory = await Event.aggregate([
      { $match: eventQuery },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    // Recent events
    const recentEvents = await Event.find(eventQuery)
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title category status startDate');

    // Attendance rate
    const attendanceRate = totalRegistrations > 0 
      ? ((totalAttendance / totalRegistrations) * 100).toFixed(1)
      : 0;

    res.json({
      success: true,
      data: {
        overview: {
          totalEvents: myEvents.length,
          totalRegistrations,
          averageAttendance: `${attendanceRate}%`,
          activeEvents: myEvents.filter(e => e.status === 'approved' || e.status === 'ongoing').length
        },
        eventsByStatus: eventsByStatus.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        eventsByCategory: eventsByCategory.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        recentEvents
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch faculty analytics',
      error: error.message
    });
  }
});

// User Analytics
router.get('/users', authorize('admin'), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);
    
    const usersByDepartment = await User.aggregate([
      { $match: { role: 'student' } },
      { $group: { _id: '$department', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        usersByRole: usersByRole.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        usersByDepartment: usersByDepartment.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user analytics',
      error: error.message
    });
  }
});

// Event Analytics
router.get('/events', authorize('admin'), async (req, res) => {
  try {
    const totalEvents = await Event.countDocuments();
    const activeEvents = await Event.countDocuments({ 
      status: { $in: ['upcoming', 'ongoing'] } 
    });
    
    const eventsByCategory = await Event.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    
    const eventsByStatus = await Event.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const upcomingEvents = await Event.find({ 
      status: 'upcoming',
      date: { $gte: new Date() }
    }).limit(5);

    res.json({
      success: true,
      data: {
        totalEvents,
        activeEvents,
        completedEvents: await Event.countDocuments({ status: 'completed' }),
        eventsByCategory: eventsByCategory.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        eventsByStatus: eventsByStatus.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        upcomingEvents
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch event analytics',
      error: error.message
    });
  }
});

// Dashboard Overview Analytics
router.get('/dashboard', authorize('admin'), async (req, res) => {
  try {
    const [
      totalUsers,
      totalEvents,
      totalRegistrations,
      totalAttendance
    ] = await Promise.all([
      User.countDocuments(),
      Event.countDocuments(),
      Registration.countDocuments(),
      Attendance.countDocuments()
    ]);

    const recentActivity = await Event.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('createdBy', 'name email');

    const attendanceRate = totalRegistrations > 0 
      ? ((totalAttendance / totalRegistrations) * 100).toFixed(1)
      : 0;

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalEvents,
          totalRegistrations,
          averageAttendance: `${attendanceRate}%`
        },
        recentActivity
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard analytics',
      error: error.message
    });
  }
});

// Performance Analytics
router.get('/performance', authorize('admin'), async (req, res) => {
  try {
    const topEvents = await Event.aggregate([
      {
        $lookup: {
          from: 'registrations',
          localField: '_id',
          foreignField: 'event',
          as: 'registrations'
        }
      },
      {
        $addFields: {
          participantCount: { $size: '$registrations' }
        }
      },
      { $sort: { participantCount: -1 } },
      { $limit: 10 }
    ]);

    const departmentPerformance = await Registration.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      { $unwind: '$userInfo' },
      {
        $group: {
          _id: '$userInfo.department',
          registrations: { $sum: 1 },
          attendance: {
            $sum: { $cond: [{ $eq: ['$status', 'attended'] }, 1, 0] }
          }
        }
      },
      {
        $addFields: {
          attendanceRate: {
            $multiply: [
              { $divide: ['$attendance', '$registrations'] },
              100
            ]
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        topEvents,
        departmentPerformance
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch performance analytics',
      error: error.message
    });
  }
});

module.exports = router;