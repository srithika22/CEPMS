const Event = require('../models/Event');
const Registration = require('../models/Registration');
const User = require('../models/User');
const Certificate = require('../models/Certificate');
const Feedback = require('../models/Feedback');
const ResponseHandler = require('../utils/responseHandler');

// @desc    Get admin dashboard stats
// @route   GET /api/dashboard/admin
// @access  Private (Admin)
exports.getAdminDashboard = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalFaculty = await User.countDocuments({ role: 'faculty' });
    const totalTrainers = await User.countDocuments({ role: 'trainer' });

    const totalEvents = await Event.countDocuments();
    const pendingEvents = await Event.countDocuments({ status: 'pending' });
    const approvedEvents = await Event.countDocuments({ status: 'approved' });
    const ongoingEvents = await Event.countDocuments({ status: 'ongoing' });
    const completedEvents = await Event.countDocuments({ status: 'completed' });

    const totalRegistrations = await Registration.countDocuments();
    const totalCertificates = await Certificate.countDocuments();

    const recentEvents = await Event.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('createdBy', 'firstName lastName');

    const upcomingEvents = await Event.find({
      status: 'approved',
      startDate: { $gte: new Date() }
    })
      .sort({ startDate: 1 })
      .limit(5);

    // Event statistics by category
    const eventsByCategory = await Event.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    // Monthly event statistics
    const currentYear = new Date().getFullYear();
    const monthlyEvents = await Event.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(currentYear, 0, 1),
            $lte: new Date(currentYear, 11, 31)
          }
        }
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    return ResponseHandler.success(res, {
      users: {
        total: totalUsers,
        students: totalStudents,
        faculty: totalFaculty,
        trainers: totalTrainers
      },
      events: {
        total: totalEvents,
        pending: pendingEvents,
        approved: approvedEvents,
        ongoing: ongoingEvents,
        completed: completedEvents,
        byCategory: eventsByCategory,
        monthly: monthlyEvents
      },
      registrations: {
        total: totalRegistrations
      },
      certificates: {
        total: totalCertificates
      },
      recentEvents,
      upcomingEvents
    });
  } catch (error) {
    console.error('Get admin dashboard error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Get coordinator dashboard stats
// @route   GET /api/dashboard/coordinator
// @access  Private (Coordinator/Faculty)
exports.getCoordinatorDashboard = async (req, res) => {
  try {
    const myEvents = await Event.find({ createdBy: req.user._id });
    const myEventIds = myEvents.map(e => e._id);

    const totalEvents = myEvents.length;
    const pendingEvents = myEvents.filter(e => e.status === 'pending').length;
    const approvedEvents = myEvents.filter(e => e.status === 'approved').length;
    const ongoingEvents = myEvents.filter(e => e.status === 'ongoing').length;
    const completedEvents = myEvents.filter(e => e.status === 'completed').length;

    const totalRegistrations = await Registration.countDocuments({
      eventId: { $in: myEventIds }
    });

    const totalCertificatesIssued = await Certificate.countDocuments({
      eventId: { $in: myEventIds }
    });

    const recentRegistrations = await Registration.find({
      eventId: { $in: myEventIds }
    })
      .sort({ registeredAt: -1 })
      .limit(10)
      .populate('userId', 'firstName lastName email')
      .populate('eventId', 'title eventId');

    const upcomingEvents = myEvents
      .filter(e => e.status === 'approved' && new Date(e.startDate) >= new Date())
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
      .slice(0, 5);

    return ResponseHandler.success(res, {
      events: {
        total: totalEvents,
        pending: pendingEvents,
        approved: approvedEvents,
        ongoing: ongoingEvents,
        completed: completedEvents
      },
      registrations: {
        total: totalRegistrations
      },
      certificates: {
        total: totalCertificatesIssued
      },
      recentRegistrations,
      upcomingEvents
    });
  } catch (error) {
    console.error('Get coordinator dashboard error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Get student dashboard stats
// @route   GET /api/dashboard/student
// @access  Private (Student)
exports.getStudentDashboard = async (req, res) => {
  try {
    const myRegistrations = await Registration.find({ userId: req.user._id })
      .populate('eventId');

    const totalRegistrations = myRegistrations.length;
    const confirmedRegistrations = myRegistrations.filter(r => r.status === 'confirmed').length;
    
    const completedEvents = myRegistrations.filter(
      r => r.eventId && r.eventId.status === 'completed'
    ).length;

    const certificatesEarned = myRegistrations.filter(
      r => r.certificate.issued
    ).length;

    const upcomingEvents = myRegistrations
      .filter(r => r.eventId && r.eventId.status === 'approved' && new Date(r.eventId.startDate) >= new Date())
      .map(r => r.eventId)
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
      .slice(0, 5);

    const ongoingEvents = myRegistrations
      .filter(r => r.eventId && r.eventId.status === 'ongoing')
      .map(r => r.eventId);

    const pendingFeedback = myRegistrations.filter(
      r => r.eventId && 
          r.eventId.status === 'completed' && 
          r.eventId.feedback.enabled && 
          !r.feedbackSubmitted
    ).length;

    const recentActivity = myRegistrations
      .sort((a, b) => new Date(b.registeredAt) - new Date(a.registeredAt))
      .slice(0, 5)
      .map(r => ({
        event: r.eventId,
        registeredAt: r.registeredAt,
        status: r.status,
        attendancePercentage: r.attendancePercentage
      }));

    return ResponseHandler.success(res, {
      registrations: {
        total: totalRegistrations,
        confirmed: confirmedRegistrations
      },
      events: {
        completed: completedEvents,
        ongoing: ongoingEvents.length,
        upcoming: upcomingEvents.length
      },
      certificates: {
        earned: certificatesEarned
      },
      pendingFeedback,
      upcomingEvents,
      ongoingEvents,
      recentActivity
    });
  } catch (error) {
    console.error('Get student dashboard error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Get trainer dashboard stats
// @route   GET /api/dashboard/trainer
// @access  Private (Trainer)
exports.getTrainerDashboard = async (req, res) => {
  try {
    const myEvents = await Event.find({ 'trainers.id': req.user._id });
    const myEventIds = myEvents.map(e => e._id);

    const totalEvents = myEvents.length;
    const upcomingEvents = myEvents.filter(
      e => e.status === 'approved' && new Date(e.startDate) >= new Date()
    );
    const completedEvents = myEvents.filter(e => e.status === 'completed').length;

    const totalParticipants = await Registration.countDocuments({
      eventId: { $in: myEventIds },
      status: 'confirmed'
    });

    const feedbackReceived = await Feedback.countDocuments({
      trainerId: req.user._id
    });

    const feedbackData = await Feedback.find({ trainerId: req.user._id });
    const avgRating = feedbackData.length > 0
      ? feedbackData.reduce((sum, f) => sum + f.overallRating, 0) / feedbackData.length
      : 0;

    return ResponseHandler.success(res, {
      events: {
        total: totalEvents,
        upcoming: upcomingEvents.length,
        completed: completedEvents
      },
      participants: {
        total: totalParticipants
      },
      feedback: {
        total: feedbackReceived,
        avgRating: avgRating.toFixed(2)
      },
      upcomingEvents
    });
  } catch (error) {
    console.error('Get trainer dashboard error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Get comprehensive analytics overview
// @route   GET /api/dashboard/analytics/overview
// @access  Private (Admin)
exports.getAnalyticsOverview = async (req, res) => {
  try {
    const { timeframe = '30' } = req.query;
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - parseInt(timeframe));

    // User growth
    const totalUsers = await User.countDocuments();
    const newUsers = await User.countDocuments({ 
      createdAt: { $gte: dateLimit } 
    });
    const activeUsers = await User.countDocuments({ 
      isActive: true,
      lastLogin: { $gte: dateLimit }
    });

    // Event analytics
    const totalEvents = await Event.countDocuments();
    const newEvents = await Event.countDocuments({ 
      createdAt: { $gte: dateLimit } 
    });
    const completedEvents = await Event.countDocuments({ 
      status: 'completed',
      endDate: { $gte: dateLimit }
    });

    // Registration analytics
    const totalRegistrations = await Registration.countDocuments();
    const newRegistrations = await Registration.countDocuments({ 
      registeredAt: { $gte: dateLimit } 
    });
    const confirmedRegistrations = await Registration.countDocuments({ 
      status: 'confirmed',
      registeredAt: { $gte: dateLimit }
    });

    // Attendance analytics
    const Attendance = require('../models/Attendance');
    const attendanceRecords = await Attendance.find({
      markedAt: { $gte: dateLimit }
    });
    const presentRecords = attendanceRecords.filter(a => a.present).length;
    const avgAttendanceRate = attendanceRecords.length > 0
      ? (presentRecords / attendanceRecords.length) * 100
      : 0;

    // Department-wise statistics
    const departmentStats = await Registration.aggregate([
      {
        $match: { registeredAt: { $gte: dateLimit } }
      },
      {
        $group: {
          _id: '$department',
          registrations: { $sum: 1 },
          avgAttendance: { $avg: '$attendancePercentage' }
        }
      },
      { $sort: { registrations: -1 } }
    ]);

    // Top performing events
    const topEvents = await Registration.aggregate([
      {
        $match: { registeredAt: { $gte: dateLimit } }
      },
      {
        $group: {
          _id: '$eventId',
          participants: { $sum: 1 },
          avgAttendance: { $avg: '$attendancePercentage' },
          certificateEligible: {
            $sum: { $cond: ['$certificate.eligible', 1, 0] }
          }
        }
      },
      { $sort: { avgAttendance: -1 } },
      { $limit: 5 }
    ]);

    const populatedTopEvents = await Event.populate(topEvents, {
      path: '_id',
      select: 'title eventId category'
    });

    return ResponseHandler.success(res, {
      overview: {
        users: {
          total: totalUsers,
          new: newUsers,
          active: activeUsers,
          growth: totalUsers > 0 ? ((newUsers / totalUsers) * 100).toFixed(2) : 0
        },
        events: {
          total: totalEvents,
          new: newEvents,
          completed: completedEvents,
          growth: totalEvents > 0 ? ((newEvents / totalEvents) * 100).toFixed(2) : 0
        },
        registrations: {
          total: totalRegistrations,
          new: newRegistrations,
          confirmed: confirmedRegistrations,
          conversionRate: newRegistrations > 0 
            ? ((confirmedRegistrations / newRegistrations) * 100).toFixed(2) 
            : 0
        },
        attendance: {
          totalRecords: attendanceRecords.length,
          avgRate: avgAttendanceRate.toFixed(2)
        }
      },
      departmentStats,
      topEvents: populatedTopEvents
    });
  } catch (error) {
    console.error('Get analytics overview error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Get real-time statistics
// @route   GET /api/dashboard/analytics/realtime
// @access  Private
exports.getRealtimeStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const ongoingEvents = await Event.countDocuments({ status: 'ongoing' });
    const todayRegistrations = await Registration.countDocuments({
      registeredAt: { $gte: today }
    });
    
    const Session = require('../models/Session');
    const activeSessions = await Session.countDocuments({ 
      status: 'ongoing',
      date: { 
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    const Attendance = require('../models/Attendance');
    const todayAttendance = await Attendance.countDocuments({
      markedAt: { $gte: today }
    });

    const onlineUsers = await User.countDocuments({
      lastLogin: { $gte: new Date(Date.now() - 15 * 60 * 1000) } // Last 15 minutes
    });

    return ResponseHandler.success(res, {
      ongoingEvents,
      activeSessions,
      todayRegistrations,
      todayAttendance,
      onlineUsers,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Get realtime stats error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Get trends analytics
// @route   GET /api/dashboard/analytics/trends
// @access  Private (Admin)
exports.getTrends = async (req, res) => {
  try {
    const { period = 'week' } = req.query; // week, month, quarter, year
    
    let groupBy, dateRange;
    const now = new Date();
    
    switch (period) {
      case 'week':
        groupBy = { 
          year: { $year: '$createdAt' },
          week: { $week: '$createdAt' }
        };
        dateRange = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        groupBy = { 
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        };
        dateRange = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        groupBy = { 
          year: { $year: '$createdAt' },
          quarter: { $ceil: { $divide: [{ $month: '$createdAt' }, 3] } }
        };
        dateRange = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        groupBy = { year: { $year: '$createdAt' } };
        dateRange = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    }

    // Event trends
    const eventTrends = await Event.aggregate([
      { $match: { createdAt: { $gte: dateRange } } },
      {
        $group: {
          _id: groupBy,
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.week': 1, '_id.quarter': 1 } }
    ]);

    // Registration trends
    const registrationTrends = await Registration.aggregate([
      { $match: { registeredAt: { $gte: dateRange } } },
      {
        $group: {
          _id: { ...groupBy, status: '$status' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.week': 1, '_id.quarter': 1 } }
    ]);

    // User growth trends
    const userTrends = await User.aggregate([
      { $match: { createdAt: { $gte: dateRange } } },
      {
        $group: {
          _id: { ...groupBy, role: '$role' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.week': 1, '_id.quarter': 1 } }
    ]);

    return ResponseHandler.success(res, {
      period,
      eventTrends,
      registrationTrends,
      userTrends
    });
  } catch (error) {
    console.error('Get trends error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Get performance metrics
// @route   GET /api/dashboard/analytics/performance
// @access  Private (Admin)
exports.getPerformanceMetrics = async (req, res) => {
  try {
    // Top performing departments
    const departmentPerformance = await Registration.aggregate([
      {
        $group: {
          _id: '$department',
          totalParticipants: { $sum: 1 },
          avgAttendance: { $avg: '$attendancePercentage' },
          certificatesEarned: {
            $sum: { $cond: ['$certificate.issued', 1, 0] }
          }
        }
      },
      { $sort: { avgAttendance: -1 } }
    ]);

    // Top performing events by category
    const categoryPerformance = await Event.aggregate([
      {
        $lookup: {
          from: 'registrations',
          localField: '_id',
          foreignField: 'eventId',
          as: 'registrations'
        }
      },
      {
        $group: {
          _id: '$category',
          eventCount: { $sum: 1 },
          totalParticipants: { $sum: { $size: '$registrations' } },
          avgRating: { $avg: '$stats.averageRating' }
        }
      },
      { $sort: { avgRating: -1 } }
    ]);

    // Trainer performance
    const trainerPerformance = await Event.aggregate([
      { $unwind: '$trainers' },
      {
        $lookup: {
          from: 'feedbacks',
          localField: 'trainers.id',
          foreignField: 'trainerId',
          as: 'feedback'
        }
      },
      {
        $group: {
          _id: '$trainers.id',
          eventsCount: { $sum: 1 },
          avgRating: { $avg: { $avg: '$feedback.overallRating' } }
        }
      },
      { $sort: { avgRating: -1 } },
      { $limit: 10 }
    ]);

    const populatedTrainers = await User.populate(trainerPerformance, {
      path: '_id',
      select: 'firstName lastName email'
    });

    // Attendance patterns
    const Attendance = require('../models/Attendance');
    const attendancePatterns = await Attendance.aggregate([
      {
        $group: {
          _id: {
            hour: { $hour: '$markedAt' },
            dayOfWeek: { $dayOfWeek: '$markedAt' }
          },
          count: { $sum: 1 },
          presentCount: {
            $sum: { $cond: ['$present', 1, 0] }
          }
        }
      },
      {
        $project: {
          hour: '$_id.hour',
          dayOfWeek: '$_id.dayOfWeek',
          total: '$count',
          present: '$presentCount',
          attendanceRate: {
            $multiply: [
              { $divide: ['$presentCount', '$count'] },
              100
            ]
          }
        }
      },
      { $sort: { dayOfWeek: 1, hour: 1 } }
    ]);

    return ResponseHandler.success(res, {
      departmentPerformance,
      categoryPerformance,
      trainerPerformance: populatedTrainers,
      attendancePatterns
    });
  } catch (error) {
    console.error('Get performance metrics error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};
