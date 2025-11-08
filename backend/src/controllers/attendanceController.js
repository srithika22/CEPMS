const Attendance = require('../models/Attendance');
const Session = require('../models/Session');
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const ResponseHandler = require('../utils/responseHandler');
const { emitToRoom, emitToAll } = require('../utils/socket');

// @desc    Mark attendance for session
// @route   POST /api/attendance/mark
// @access  Private (Coordinator/Admin)
exports.markAttendance = async (req, res) => {
  try {
    const { sessionId, attendanceRecords } = req.body;
    // attendanceRecords: [{ userId, present, remarks }]

    const session = await Session.findById(sessionId).populate('eventId');
    if (!session) {
      return ResponseHandler.notFound(res, 'Session not found');
    }

    const event = session.eventId;

    // Authorization is handled by middleware (checkAttendancePermission)

    const results = [];
    let presentCount = 0;

    for (const record of attendanceRecords) {
      const { userId, present, remarks } = record;

      const registration = await Registration.findOne({
        eventId: event._id,
        userId
      }).populate('userId');

      if (!registration) {
        continue;
      }

      // Create or update attendance record
      const attendance = await Attendance.findOneAndUpdate(
        { sessionId, userId },
        {
          sessionId,
          eventId: event._id,
          userId,
          userName: registration.userName,
          rollNumber: registration.rollNumber,
          present,
          markedBy: req.user._id,
          markedAt: new Date(),
          remarks
        },
        { upsert: true, new: true }
      );

      if (present) {
        presentCount++;
      }

      // Update registration attendance array
      const existingAttendance = registration.attendance.find(
        a => a.sessionId.toString() === sessionId
      );

      if (existingAttendance) {
        existingAttendance.present = present;
        existingAttendance.markedAt = new Date();
      } else {
        registration.attendance.push({
          sessionId,
          date: session.date,
          present,
          markedAt: new Date()
        });
      }

      // Update attendance summary
      registration.attendedSessions = registration.attendance.filter(a => a.present).length;
      registration.totalSessions = registration.attendance.length;
      registration.calculateAttendance();

      // Check certificate eligibility
      if (event.certificate.enabled) {
        registration.certificate.eligible = 
          registration.attendancePercentage >= event.certificate.minAttendance;
      }

      await registration.save();
      results.push(attendance);
    }

    // Update session attendance stats
    session.attendance.total = attendanceRecords.length;
    session.attendance.present = presentCount;
    session.attendance.absent = attendanceRecords.length - presentCount;
    session.attendance.percentage = attendanceRecords.length > 0
      ? (presentCount / attendanceRecords.length) * 100
      : 0;
    session.attendance.markedBy = req.user._id;
    session.attendance.markedAt = new Date();

    await session.save();

    // Emit real-time attendance update
    const attendanceUpdate = {
      sessionId,
      eventId: event._id,
      stats: {
        total: attendanceRecords.length,
        present: presentCount,
        absent: attendanceRecords.length - presentCount,
        percentage: attendanceRecords.length > 0
          ? (presentCount / attendanceRecords.length) * 100
          : 0
      },
      timestamp: new Date()
    };

    // Emit to coordinators and admins
    emitToRoom('admin', 'attendance-updated', attendanceUpdate);
    emitToRoom('faculty', 'attendance-updated', attendanceUpdate);
    
    // Emit to event-specific room
    emitToRoom(`event_${event._id}`, 'attendance-marked', {
      ...attendanceUpdate,
      markedBy: {
        id: req.user._id,
        name: `${req.user.firstName} ${req.user.lastName}`
      }
    });

    return ResponseHandler.success(res, results, 'Attendance marked successfully');
  } catch (error) {
    console.error('Mark attendance error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Get session attendance
// @route   GET /api/attendance/session/:sessionId
// @access  Private (Coordinator/Admin)
exports.getSessionAttendance = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findById(sessionId).populate('eventId');
    if (!session) {
      return ResponseHandler.notFound(res, 'Session not found');
    }

    const attendance = await Attendance.find({ sessionId })
      .populate('userId', 'firstName lastName email student')
      .sort({ userName: 1 });

    return ResponseHandler.success(res, {
      session,
      attendance,
      stats: session.attendance
    });
  } catch (error) {
    console.error('Get session attendance error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Get user attendance for event
// @route   GET /api/attendance/user/:userId/event/:eventId
// @access  Private
exports.getUserEventAttendance = async (req, res) => {
  try {
    const { userId, eventId } = req.params;

    const registration = await Registration.findOne({ userId, eventId })
      .populate('eventId');

    if (!registration) {
      return ResponseHandler.notFound(res, 'Registration not found');
    }

    const sessions = await Session.find({ eventId }).sort({ date: 1 });

    const attendanceDetails = sessions.map(session => {
      const att = registration.attendance.find(
        a => a.sessionId.toString() === session._id.toString()
      );

      return {
        session: {
          _id: session._id,
          title: session.title,
          date: session.date,
          startTime: session.startTime,
          endTime: session.endTime
        },
        present: att ? att.present : false,
        markedAt: att ? att.markedAt : null
      };
    });

    return ResponseHandler.success(res, {
      attendancePercentage: registration.attendancePercentage,
      totalSessions: registration.totalSessions,
      attendedSessions: registration.attendedSessions,
      details: attendanceDetails
    });
  } catch (error) {
    console.error('Get user event attendance error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Get my attendance
// @route   GET /api/attendance/my-attendance
// @access  Private
exports.getMyAttendance = async (req, res) => {
  try {
    const registrations = await Registration.find({ 
      userId: req.user._id,
      status: 'confirmed'
    }).populate('eventId');

    const attendanceData = registrations.map(reg => ({
      event: {
        _id: reg.eventId._id,
        title: reg.eventId.title,
        eventId: reg.eventId.eventId
      },
      totalSessions: reg.totalSessions,
      attendedSessions: reg.attendedSessions,
      attendancePercentage: reg.attendancePercentage,
      certificateEligible: reg.certificate.eligible
    }));

    return ResponseHandler.success(res, attendanceData);
  } catch (error) {
    console.error('Get my attendance error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Export attendance report
// @route   GET /api/attendance/event/:eventId/export
// @access  Private (Coordinator/Admin)
exports.exportEventAttendance = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      return ResponseHandler.notFound(res, 'Event not found');
    }

    // Check permission
    if (req.user.role !== 'admin' && event.coordinator.id.toString() !== req.user._id.toString()) {
      return ResponseHandler.forbidden(res, 'Not authorized');
    }

    const registrations = await Registration.find({ eventId })
      .populate('userId')
      .sort({ userName: 1 });

    const sessions = await Session.find({ eventId }).sort({ date: 1 });

    const exportData = registrations.map(reg => {
      const row = {
        name: reg.userName,
        email: reg.userEmail,
        rollNumber: reg.rollNumber || 'N/A',
        department: reg.department || 'N/A'
      };

      // Add session-wise attendance
      sessions.forEach((session, index) => {
        const att = reg.attendance.find(
          a => a.sessionId.toString() === session._id.toString()
        );
        row[`Session ${index + 1}`] = att && att.present ? 'P' : 'A';
      });

      row['Total Sessions'] = reg.totalSessions;
      row['Attended'] = reg.attendedSessions;
      row['Percentage'] = reg.attendancePercentage.toFixed(2) + '%';
      row['Certificate Eligible'] = reg.certificate.eligible ? 'Yes' : 'No';

      return row;
    });

    return ResponseHandler.success(res, {
      event: {
        title: event.title,
        eventId: event.eventId
      },
      sessions: sessions.map(s => ({
        title: s.title,
        date: s.date
      })),
      attendance: exportData
    });
  } catch (error) {
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Get attendance analytics summary
// @route   GET /api/attendance/analytics/summary
// @access  Private (Coordinator/Admin)
exports.getAttendanceAnalytics = async (req, res) => {
  try {
    const { timeframe = '30', department, eventType } = req.query;
    
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - parseInt(timeframe));

    let eventQuery = { startDate: { $gte: dateLimit } };
    if (eventType) eventQuery.category = eventType;

    const events = await Event.find(eventQuery);
    const eventIds = events.map(e => e._id);

    // Summary statistics
    const totalEvents = events.length;
    const activeEvents = events.filter(e => e.status === 'active').length;
    const completedEvents = events.filter(e => e.status === 'completed').length;

    // Attendance statistics
    const totalRegistrations = await Registration.countDocuments({ 
      eventId: { $in: eventIds } 
    });

    const attendanceRecords = await Attendance.find({ 
      eventId: { $in: eventIds } 
    });

    const totalPresentRecords = attendanceRecords.filter(a => a.present).length;
    const overallAttendanceRate = totalRegistrations > 0 
      ? (totalPresentRecords / attendanceRecords.length) * 100 
      : 0;

    // Department-wise performance
    let departmentPerformance = [];
    if (department) {
      const deptRegistrations = await Registration.find({
        eventId: { $in: eventIds },
        department
      }).populate('eventId');

      const deptStats = deptRegistrations.reduce((acc, reg) => {
        const eventTitle = reg.eventId.title;
        if (!acc[eventTitle]) {
          acc[eventTitle] = { total: 0, attended: 0 };
        }
        acc[eventTitle].total += reg.totalSessions;
        acc[eventTitle].attended += reg.attendedSessions;
        return acc;
      }, {});

      departmentPerformance = Object.entries(deptStats).map(([event, stats]) => ({
        event,
        attendanceRate: stats.total > 0 ? (stats.attended / stats.total) * 100 : 0,
        totalSessions: stats.total,
        attendedSessions: stats.attended
      }));
    }

    // Top performing events
    const eventPerformance = await Registration.aggregate([
      { $match: { eventId: { $in: eventIds } } },
      {
        $group: {
          _id: '$eventId',
          avgAttendance: { $avg: '$attendancePercentage' },
          totalParticipants: { $sum: 1 },
          totalSessions: { $avg: '$totalSessions' }
        }
      },
      { $sort: { avgAttendance: -1 } },
      { $limit: 5 }
    ]);

    const topEvents = await Event.populate(eventPerformance, { 
      path: '_id', 
      select: 'title eventId' 
    });

    return ResponseHandler.success(res, {
      summary: {
        totalEvents,
        activeEvents,
        completedEvents,
        totalRegistrations,
        overallAttendanceRate: parseFloat(overallAttendanceRate.toFixed(2))
      },
      departmentPerformance,
      topPerformingEvents: topEvents.map(e => ({
        event: e._id,
        avgAttendance: parseFloat(e.avgAttendance.toFixed(2)),
        totalParticipants: e.totalParticipants,
        totalSessions: e.totalSessions
      }))
    });
  } catch (error) {
    console.error('Get attendance analytics error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Get attendance trends for an event
// @route   GET /api/attendance/analytics/trends/:eventId
// @access  Private (Coordinator/Admin)
exports.getAttendanceTrends = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      return ResponseHandler.notFound(res, 'Event not found');
    }

    const sessions = await Session.find({ eventId }).sort({ date: 1 });
    
    const trends = await Promise.all(sessions.map(async (session) => {
      const attendance = await Attendance.find({ sessionId: session._id });
      const presentCount = attendance.filter(a => a.present).length;
      const totalCount = attendance.length;
      
      return {
        sessionId: session._id,
        sessionTitle: session.title,
        date: session.date,
        attendanceRate: totalCount > 0 ? (presentCount / totalCount) * 100 : 0,
        presentCount,
        totalCount
      };
    }));

    return ResponseHandler.success(res, {
      event: {
        _id: event._id,
        title: event.title,
        eventId: event.eventId
      },
      trends
    });
  } catch (error) {
    console.error('Get attendance trends error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Get performance analytics for an event
// @route   GET /api/attendance/analytics/performance/:eventId
// @access  Private (Coordinator/Admin)
exports.getPerformanceAnalytics = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      return ResponseHandler.notFound(res, 'Event not found');
    }

    // Department-wise performance
    const departmentStats = await Registration.aggregate([
      { $match: { eventId: event._id } },
      {
        $group: {
          _id: '$department',
          avgAttendance: { $avg: '$attendancePercentage' },
          participantCount: { $sum: 1 },
          totalSessions: { $avg: '$totalSessions' },
          avgAttendedSessions: { $avg: '$attendedSessions' }
        }
      },
      { $sort: { avgAttendance: -1 } }
    ]);

    // Low performing participants (attendance < 60%)
    const lowPerformers = await Registration.find({
      eventId,
      attendancePercentage: { $lt: 60 }
    }).select('userName rollNumber department attendancePercentage')
      .sort({ attendancePercentage: 1 })
      .limit(10);

    // High performing participants (attendance >= 90%)
    const highPerformers = await Registration.find({
      eventId,
      attendancePercentage: { $gte: 90 }
    }).select('userName rollNumber department attendancePercentage')
      .sort({ attendancePercentage: -1 })
      .limit(10);

    return ResponseHandler.success(res, {
      event: {
        _id: event._id,
        title: event.title,
        eventId: event.eventId
      },
      departmentStats,
      lowPerformers,
      highPerformers
    });
  } catch (error) {
    console.error('Get performance analytics error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Get event participants with filtering
// @route   GET /api/attendance/participants/:eventId
// @access  Private (Coordinator/Admin)
exports.getEventParticipants = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { 
      department, 
      year, 
      section, 
      minAttendance, 
      maxAttendance,
      search,
      page = 1,
      limit = 20
    } = req.query;

    const event = await Event.findById(eventId);
    if (!event) {
      return ResponseHandler.notFound(res, 'Event not found');
    }

    let query = { eventId };

    // Apply filters
    if (department) query.department = department;
    if (year) query.year = parseInt(year);
    if (section) query.section = section;
    if (minAttendance) query.attendancePercentage = { $gte: parseFloat(minAttendance) };
    if (maxAttendance) {
      query.attendancePercentage = query.attendancePercentage 
        ? { ...query.attendancePercentage, $lte: parseFloat(maxAttendance) }
        : { $lte: parseFloat(maxAttendance) };
    }

    if (search) {
      query.$or = [
        { userName: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } },
        { userEmail: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const participants = await Registration.find(query)
      .sort({ attendancePercentage: -1, userName: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Registration.countDocuments(query);

    return ResponseHandler.success(res, {
      participants,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      },
      filters: {
        department,
        year,
        section,
        minAttendance,
        maxAttendance,
        search
      }
    });
  } catch (error) {
    console.error('Get event participants error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Get filtered attendance data
// @route   GET /api/attendance/event/:eventId/filtered
// @access  Private (Coordinator/Admin)
exports.getFilteredAttendance = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { sessionId, department, year, section, present } = req.query;

    const event = await Event.findById(eventId);
    if (!event) {
      return ResponseHandler.notFound(res, 'Event not found');
    }

    let query = { eventId };
    if (sessionId) query.sessionId = sessionId;
    if (present !== undefined) query.present = present === 'true';

    const attendance = await Attendance.find(query)
      .populate({
        path: 'userId',
        select: 'firstName lastName email student',
        match: {
          ...(department && { 'student.department': department }),
          ...(year && { 'student.year': parseInt(year) }),
          ...(section && { 'student.section': section })
        }
      })
      .populate('sessionId', 'title date startTime endTime');

    // Filter out null populated users (those that didn't match department/year/section)
    const filteredAttendance = attendance.filter(a => a.userId);

    return ResponseHandler.success(res, {
      attendance: filteredAttendance,
      filters: { sessionId, department, year, section, present }
    });
  } catch (error) {
    console.error('Get filtered attendance error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Search attendance records
// @route   GET /api/attendance/search
// @access  Private (Coordinator/Admin)
exports.searchAttendance = async (req, res) => {
  try {
    const { q, eventId, sessionId } = req.query;
    
    if (!q) {
      return ResponseHandler.badRequest(res, 'Search query is required');
    }

    let attendanceQuery = {};
    if (eventId) attendanceQuery.eventId = eventId;
    if (sessionId) attendanceQuery.sessionId = sessionId;

    // Search in user names, roll numbers, or remarks
    attendanceQuery.$or = [
      { userName: { $regex: q, $options: 'i' } },
      { rollNumber: { $regex: q, $options: 'i' } },
      { remarks: { $regex: q, $options: 'i' } }
    ];

    const attendance = await Attendance.find(attendanceQuery)
      .populate('sessionId', 'title date')
      .populate('eventId', 'title eventId')
      .sort({ markedAt: -1 })
      .limit(50);

    return ResponseHandler.success(res, attendance);
  } catch (error) {
    console.error('Search attendance error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Get all attendance (general route for faculty)
// @route   GET /api/attendance
// @access  Private
exports.getAllAttendance = async (req, res) => {
  try {
    let attendanceQuery = {};
    
    // Filter based on user role
    if (req.user.role !== 'admin') {
      if (req.user.role === 'faculty') {
        // Faculty can see attendance for their coordinated events
        const userEvents = await Event.find({ 'coordinator.id': req.user._id });
        const eventIds = userEvents.map(event => event._id);
        attendanceQuery.eventId = { $in: eventIds };
      } else if (req.user.role === 'trainer') {
        // Trainers can see attendance for sessions they conduct
        const trainerSessions = await Session.find({ 'trainer.id': req.user._id });
        const sessionIds = trainerSessions.map(session => session._id);
        attendanceQuery.sessionId = { $in: sessionIds };
      } else {
        // Students can only see their own attendance
        attendanceQuery.userId = req.user._id;
      }
    }
    
    const attendance = await Attendance.find(attendanceQuery)
      .populate('sessionId', 'title date startTime endTime')
      .populate('eventId', 'title eventId category')
      .populate('userId', 'firstName lastName email rollNumber')
      .sort({ markedAt: -1 })
      .limit(100);

    return ResponseHandler.success(res, attendance);
  } catch (error) {
    console.error('Get all attendance error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Get faculty-specific attendance data
// @route   GET /api/attendance/faculty
// @access  Private (Faculty/Admin)
exports.getFacultyAttendance = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'faculty') {
      return ResponseHandler.forbidden(res, 'Access denied');
    }
    
    let attendanceQuery = {};
    
    // Filter by faculty's coordinated events - need to get sessions, not events directly
    if (req.user.role === 'faculty') {
      const userEvents = await Event.find({ 'coordinator.id': req.user._id });
      const eventIds = userEvents.map(event => event._id);
      
      // Get all sessions for the faculty's events
      const eventSessions = await Session.find({ eventId: { $in: eventIds } });
      const sessionIds = eventSessions.map(session => session._id);
      attendanceQuery.sessionId = { $in: sessionIds };
    }
    
    // Get attendance summary
    const attendance = await Attendance.aggregate([
      { $match: attendanceQuery },
      {
        $group: {
          _id: {
            eventId: '$eventId',
            sessionId: '$sessionId'
          },
          totalMarked: { $sum: 1 },
          presentCount: { 
            $sum: { $cond: [{ $eq: ['$present', true] }, 1, 0] }
          },
          absentCount: { 
            $sum: { $cond: [{ $eq: ['$present', false] }, 1, 0] }
          },
          lateCount: { 
            $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'events',
          localField: '_id.eventId',
          foreignField: '_id',
          as: 'event'
        }
      },
      {
        $lookup: {
          from: 'sessions',
          localField: '_id.sessionId',
          foreignField: '_id',
          as: 'session'
        }
      },
      {
        $addFields: {
          attendanceRate: {
            $multiply: [
              { $divide: ['$presentCount', '$totalMarked'] },
              100
            ]
          }
        }
      },
      { $sort: { 'session.date': -1 } }
    ]);

    return ResponseHandler.success(res, attendance);
  } catch (error) {
    console.error('Get faculty attendance error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};
