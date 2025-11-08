const Event = require('../models/Event');
const Registration = require('../models/Registration');
const ResponseHandler = require('../utils/responseHandler');

// @desc    Create event
// @route   POST /api/events
// @access  Private (Coordinator/Admin)
exports.createEvent = async (req, res) => {
  try {
    // Coordinators and admins can create events; coordinators' events default to pending
    const { title, startDate, endDate } = req.body;

    // Validate required fields
    if (!title || !startDate || !endDate) {
      return ResponseHandler.badRequest(res, 'Title, startDate, and endDate are required');
    }

    // Check for duplicate events - same title and overlapping dates
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    
    // Validate dates
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return ResponseHandler.badRequest(res, 'Invalid date format');
    }
    
    if (startDateObj >= endDateObj) {
      return ResponseHandler.badRequest(res, 'End date must be after start date');
    }

    // Find events with same title (case-insensitive) and overlapping dates
    // Don't count cancelled or rejected events as duplicates
    const existingEvent = await Event.findOne({
      title: { $regex: new RegExp(`^${title.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      startDate: { $lte: endDateObj },
      endDate: { $gte: startDateObj },
      status: { $nin: ['cancelled', 'rejected'] }
    });

    if (existingEvent) {
      return ResponseHandler.conflict(
        res,
        'An event with the same title and overlapping dates already exists'
      );
    }

    // Check if eventId is provided and if it already exists
    if (req.body.eventId) {
      const eventWithId = await Event.findOne({ eventId: req.body.eventId });
      if (eventWithId) {
        return ResponseHandler.conflict(res, 'An event with this eventId already exists');
      }
    }

    const eventData = {
      ...req.body,
      // Coordinators should not directly create approved events
      // Default new events to 'pending' regardless of provided status
      status: 'pending',
      // Ensure registration starts closed until explicitly opened post-approval
      registration: {
        required: req.body.registration?.required ?? true,
        startDate: req.body.registration?.startDate,
        endDate: req.body.registration?.endDate,
        maxParticipants: req.body.registration?.maxParticipants,
        currentCount: 0,
        isOpen: false
      },
      createdBy: req.user._id,
      coordinator: {
        id: req.user._id,
        name: `${req.user.firstName} ${req.user.lastName}`,
        email: req.user.email,
        phone: req.user.phone,
        department: req.user.faculty?.department || req.user.student?.department
      }
    };

    const event = await Event.create(eventData);

    // Emit real-time event creation notification via Socket.io
    const io = req.app.get('socketio');
    if (io) {
      const eventNotification = {
        event: event,
        creator: {
          name: req.user.name || `${req.user.firstName} ${req.user.lastName}`,
          role: req.user.role,
          department: req.user.faculty?.department || req.user.student?.department || req.user.department
        },
        timestamp: new Date()
      };

      // Emit to all users - they'll filter based on eligibility on client side
      io.emit('new-event', eventNotification);
      
      // Also emit to specific departments if specified
      if (event.eligibility?.departments && event.eligibility.departments.length > 0) {
        event.eligibility.departments.forEach(dept => {
          if (dept !== 'All Departments') {
            io.to(dept).emit('new-event', eventNotification);
          }
        });
      }
      
      console.log(`📢 Event "${event.title}" broadcast to all users`);
    }

    const message = req.user.role === 'admin'
      ? 'Event created successfully'
      : 'Event submitted and is pending admin approval';
    return ResponseHandler.created(res, event, message);
  } catch (error) {
    console.error('Create event error:', error);
    
    // Handle duplicate key error (if eventId collision happens)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return ResponseHandler.conflict(res, `An event with this ${field} already exists`);
    }
    
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Get all events
// @route   GET /api/events
// @access  Public
exports.getAllEvents = async (req, res) => {
  try {
    const {
      // status is intentionally ignored for public listing to prevent exposure of pending/draft events
      category,
      type,
      department,
      search,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      sortBy = 'startDate',
      order = 'desc'
    } = req.query;

    const query = {};

    // Public listing must only show approved/ongoing/completed
    query.status = { $in: ['approved', 'ongoing', 'completed'] };
    if (category) query.category = category;
    if (type) query.type = type;
    if (department) query['eligibility.departments'] = department;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { eventId: { $regex: search, $options: 'i' } }
      ];
    }

    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) query.startDate.$gte = new Date(startDate);
      if (endDate) query.startDate.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === 'asc' ? 1 : -1;

    const events = await Event.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ [sortBy]: sortOrder })
      .populate('createdBy', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName email');

    const total = await Event.countDocuments(query);

    return ResponseHandler.success(res, {
      events,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get all events error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Admin: Get events with optional status filter
// @route   GET /api/events/admin
// @access  Private (Admin)
exports.getAllEventsAdmin = async (req, res) => {
  try {
    const {
      status,
      category,
      type,
      department,
      search,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    const query = {};

    if (status) query.status = Array.isArray(status) ? { $in: status } : status;
    if (category) query.category = category;
    if (type) query.type = type;
    if (department) query['eligibility.departments'] = department;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { eventId: { $regex: search, $options: 'i' } }
      ];
    }

    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) query.startDate.$gte = new Date(startDate);
      if (endDate) query.startDate.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === 'asc' ? 1 : -1;

    const events = await Event.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ [sortBy]: sortOrder })
      .populate('createdBy', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName email');

    const total = await Event.countDocuments(query);

    return ResponseHandler.success(res, {
      events,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get all events (admin) error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Get event by ID
// @route   GET /api/events/:id
// @access  Public
exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email phone')
      .populate('approvedBy', 'firstName lastName email')
      .populate('trainers.id', 'firstName lastName email phone trainer');

    if (!event) {
      return ResponseHandler.notFound(res, 'Event not found');
    }

    // Public visibility: only approved/ongoing/complete
    if (!['approved', 'ongoing', 'completed'].includes(event.status)) {
      return ResponseHandler.notFound(res, 'Event not found');
    }

    return ResponseHandler.success(res, event);
  } catch (error) {
    console.error('Get event by ID error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private (Coordinator/Admin)
exports.updateEvent = async (req, res) => {
  try {
    let event = await Event.findById(req.params.id);

    if (!event) {
      return ResponseHandler.notFound(res, 'Event not found');
    }

    // Check permission
    if (req.user.role !== 'admin' && event.coordinator.id.toString() !== req.user._id.toString()) {
      return ResponseHandler.forbidden(res, 'Not authorized to update this event');
    }

    // Admin-only update guard (route also enforces, this is a safety net)
    if (req.user.role !== 'admin') {
      return ResponseHandler.forbidden(res, 'Only admins can update events');
    }

    const filteredBody = { ...req.body };

    // If trying to set registration.isOpen, ensure event is approved (even for admin this is allowed later via toggle route)
    if (filteredBody.registration?.isOpen !== undefined && !['approved', 'ongoing'].includes(event.status)) {
      return ResponseHandler.badRequest(res, 'Registration can only be opened after approval');
    }

    event = await Event.findByIdAndUpdate(
      req.params.id,
      filteredBody,
      { new: true, runValidators: true }
    );

    return ResponseHandler.success(res, event, 'Event updated successfully');
  } catch (error) {
    console.error('Update event error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

  // @desc    Delete event
  // @route   DELETE /api/events/:id
  // @access  Private (Admin)
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return ResponseHandler.notFound(res, 'Event not found');
    }

    // Admin-only deletion
    if (req.user.role !== 'admin') {
      return ResponseHandler.forbidden(res, 'Only admins can delete events');
    }

    await event.deleteOne();

    return ResponseHandler.success(res, null, 'Event deleted successfully');
  } catch (error) {
    console.error('Delete event error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Approve event
// @route   PATCH /api/events/:id/approve
// @access  Private (Admin)
exports.approveEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return ResponseHandler.notFound(res, 'Event not found');
    }

    event.status = 'approved';
    event.approvedBy = req.user._id;
    event.approvedAt = new Date();

    await event.save();

    // Emit real-time event approval notification
    const io = req.app.get('socketio');
    if (io) {
      const eventNotification = {
        event: event,
        action: 'approved',
        approver: {
          name: req.user.name || `${req.user.firstName} ${req.user.lastName}`,
          role: req.user.role
        },
        timestamp: new Date()
      };

      // Emit to all users since approved events are visible to everyone
      io.emit('event-approved', eventNotification);
      io.emit('event-updated', eventNotification);
      
      console.log(`✅ Event "${event.title}" approval broadcast to all users`);
    }

    return ResponseHandler.success(res, event, 'Event approved successfully');
  } catch (error) {
    console.error('Approve event error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Reject event
// @route   PATCH /api/events/:id/reject
// @access  Private (Admin)
exports.rejectEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return ResponseHandler.notFound(res, 'Event not found');
    }

    event.status = 'rejected';
    await event.save();

    return ResponseHandler.success(res, event, 'Event rejected');
  } catch (error) {
    console.error('Reject event error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Update event status
// @route   PATCH /api/events/:id/status
// @access  Private (Coordinator/Admin)
exports.updateEventStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const event = await Event.findById(req.params.id);

    if (!event) {
      return ResponseHandler.notFound(res, 'Event not found');
    }

    // Check permission
    if (req.user.role !== 'admin' && event.coordinator.id.toString() !== req.user._id.toString()) {
      return ResponseHandler.forbidden(res, 'Not authorized to update this event');
    }

    event.status = status;
    await event.save();

    return ResponseHandler.success(res, event, `Event status updated to ${status}`);
  } catch (error) {
    console.error('Update event status error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Toggle registration
// @route   PATCH /api/events/:id/toggle-registration
// @access  Private (Coordinator/Admin)
exports.toggleRegistration = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return ResponseHandler.notFound(res, 'Event not found');
    }

    // Check permission
    if (req.user.role !== 'admin' && event.coordinator.id.toString() !== req.user._id.toString()) {
      return ResponseHandler.forbidden(res, 'Not authorized to update this event');
    }

    // Admin-only toggle guard (route also enforces, this is a safety net)
    if (req.user.role !== 'admin') {
      return ResponseHandler.forbidden(res, 'Only admins can toggle registration');
    }

    // Only allow registration to be toggled for approved or ongoing events
    if (!['approved', 'ongoing'].includes(event.status)) {
      return ResponseHandler.badRequest(
        res,
        'Registration can only be toggled when the event is approved or ongoing'
      );
    }

    event.registration.isOpen = !event.registration.isOpen;
    await event.save();

    return ResponseHandler.success(
      res,
      { isOpen: event.registration.isOpen },
      `Registration ${event.registration.isOpen ? 'opened' : 'closed'} successfully`
    );
  } catch (error) {
    console.error('Toggle registration error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Get my events (created by me or coordinated by me)
// @route   GET /api/events/my-events
// @access  Private
exports.getMyEvents = async (req, res) => {
  try {
    // For faculty coordinators, show events they coordinate or created
    const query = {
      $or: [
        { createdBy: req.user._id },
        { 'coordinator.id': req.user._id }
      ]
    };
    
    // For admins, show all events
    if (req.user.role === 'admin') {
      const allEvents = await Event.find({}).sort({ createdAt: -1 });
      return ResponseHandler.success(res, allEvents);
    }
    
    const events = await Event.find(query)
      .sort({ createdAt: -1 });

    return ResponseHandler.success(res, events);
  } catch (error) {
    console.error('Get my events error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Get registered events
// @route   GET /api/events/registered
// @access  Private
exports.getRegisteredEvents = async (req, res) => {
  try {
    const registrations = await Registration.find({ 
      userId: req.user._id,
      status: { $ne: 'cancelled' }
    }).populate('eventId');

    const events = registrations.map(reg => reg.eventId);

    return ResponseHandler.success(res, events);
  } catch (error) {
    console.error('Get registered events error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Get event statistics
// @route   GET /api/events/:id/stats
// @access  Private (Coordinator/Admin)
exports.getEventStats = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return ResponseHandler.notFound(res, 'Event not found');
    }

    const registrationCount = await Registration.countDocuments({
      eventId: req.params.id,
      status: 'confirmed'
    });

    const stats = {
      ...event.stats,
      totalRegistered: registrationCount,
      registrationPercentage: event.registration.maxParticipants 
        ? (registrationCount / event.registration.maxParticipants) * 100 
        : 0
    };

    return ResponseHandler.success(res, stats);
  } catch (error) {
    console.error('Get event stats error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Get events overview analytics
// @route   GET /api/events/analytics/overview
// @access  Private/Admin
exports.getEventsOverview = async (req, res) => {
  try {
    const { timeframe = '30' } = req.query;
    
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - parseInt(timeframe));

    // Total events overview
    const totalEvents = await Event.countDocuments();
    const recentEvents = await Event.countDocuments({ 
      createdAt: { $gte: dateLimit } 
    });
    
    const activeEvents = await Event.countDocuments({ status: 'active' });
    const completedEvents = await Event.countDocuments({ status: 'completed' });
    const pendingEvents = await Event.countDocuments({ status: 'pending' });

    // Registration statistics
    const totalRegistrations = await Registration.countDocuments();
    const confirmedRegistrations = await Registration.countDocuments({ 
      status: 'confirmed' 
    });

    // Category-wise breakdown
    const categoryStats = await Event.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgRating: { $avg: '$stats.averageRating' },
          totalRegistrations: { $sum: '$stats.registrationCount' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Monthly trend
    const monthlyTrend = await Event.aggregate([
      {
        $match: {
          createdAt: { $gte: dateLimit }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          registrations: { $sum: '$stats.registrationCount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    return ResponseHandler.success(res, {
      overview: {
        totalEvents,
        recentEvents,
        activeEvents,
        completedEvents,
        pendingEvents,
        totalRegistrations,
        confirmedRegistrations
      },
      categoryStats,
      monthlyTrend
    });
  } catch (error) {
    console.error('Get events overview error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Get department analytics
// @route   GET /api/events/analytics/department/:department
// @access  Private (Coordinator/Admin)
exports.getDepartmentAnalytics = async (req, res) => {
  try {
    const { department } = req.params;
    const { timeframe = '90' } = req.query;
    
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - parseInt(timeframe));

    // Department events
    const departmentEvents = await Event.find({
      'targetAudience.departments': department,
      startDate: { $gte: dateLimit }
    });

    const eventIds = departmentEvents.map(e => e._id);

    // Registration statistics for department
    const departmentRegistrations = await Registration.find({
      eventId: { $in: eventIds },
      department
    });

    const participationRate = departmentRegistrations.length > 0
      ? (departmentRegistrations.filter(r => r.status === 'confirmed').length / departmentRegistrations.length) * 100
      : 0;

    // Attendance statistics
    const attendanceStats = departmentRegistrations.reduce((acc, reg) => {
      acc.totalSessions += reg.totalSessions;
      acc.attendedSessions += reg.attendedSessions;
      return acc;
    }, { totalSessions: 0, attendedSessions: 0 });

    const avgAttendanceRate = attendanceStats.totalSessions > 0
      ? (attendanceStats.attendedSessions / attendanceStats.totalSessions) * 100
      : 0;

    // Top performing events for department
    const topEvents = await Registration.aggregate([
      {
        $match: {
          eventId: { $in: eventIds },
          department
        }
      },
      {
        $group: {
          _id: '$eventId',
          avgAttendance: { $avg: '$attendancePercentage' },
          participantCount: { $sum: 1 }
        }
      },
      { $sort: { avgAttendance: -1 } },
      { $limit: 5 }
    ]);

    const populatedTopEvents = await Event.populate(topEvents, {
      path: '_id',
      select: 'title eventId'
    });

    return ResponseHandler.success(res, {
      department,
      overview: {
        totalEvents: departmentEvents.length,
        totalParticipants: departmentRegistrations.length,
        participationRate: parseFloat(participationRate.toFixed(2)),
        avgAttendanceRate: parseFloat(avgAttendanceRate.toFixed(2))
      },
      topEvents: populatedTopEvents,
      recentEvents: departmentEvents.slice(0, 5)
    });
  } catch (error) {
    console.error('Get department analytics error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Get detailed event analytics
// @route   GET /api/events/:id/analytics/detailed
// @access  Private (Coordinator/Admin)
exports.getDetailedEventAnalytics = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id).populate('coordinator.id', 'firstName lastName');
    if (!event) {
      return ResponseHandler.notFound(res, 'Event not found');
    }

    // Registration analytics
    const registrations = await Registration.find({ eventId: id });
    const registrationsByStatus = registrations.reduce((acc, reg) => {
      acc[reg.status] = (acc[reg.status] || 0) + 1;
      return acc;
    }, {});

    const registrationsByDepartment = registrations.reduce((acc, reg) => {
      acc[reg.department] = (acc[reg.department] || 0) + 1;
      return acc;
    }, {});

    const registrationsByYear = registrations.reduce((acc, reg) => {
      acc[reg.year] = (acc[reg.year] || 0) + 1;
      return acc;
    }, {});

    // Session analytics
    const Session = require('../models/Session');
    const sessions = await Session.find({ eventId: id }).sort({ date: 1 });
    
    const sessionAnalytics = sessions.map(session => ({
      sessionId: session._id,
      title: session.title,
      date: session.date,
      attendanceStats: session.attendance
    }));

    // Attendance trends
    const Attendance = require('../models/Attendance');
    const attendanceTrend = await Promise.all(sessions.map(async (session) => {
      const attendance = await Attendance.find({ sessionId: session._id });
      const presentCount = attendance.filter(a => a.present).length;
      
      return {
        sessionTitle: session.title,
        date: session.date,
        totalParticipants: attendance.length,
        presentCount,
        attendanceRate: attendance.length > 0 ? (presentCount / attendance.length) * 100 : 0
      };
    }));

    // Certificate eligibility
    const certificateEligible = registrations.filter(r => r.certificate.eligible).length;
    const certificateEligibilityRate = registrations.length > 0
      ? (certificateEligible / registrations.length) * 100
      : 0;

    return ResponseHandler.success(res, {
      event: {
        _id: event._id,
        title: event.title,
        eventId: event.eventId,
        status: event.status,
        coordinator: event.coordinator
      },
      registrationAnalytics: {
        total: registrations.length,
        byStatus: registrationsByStatus,
        byDepartment: registrationsByDepartment,
        byYear: registrationsByYear
      },
      sessionAnalytics,
      attendanceTrend,
      certificateStats: {
        eligible: certificateEligible,
        eligibilityRate: parseFloat(certificateEligibilityRate.toFixed(2))
      }
    });
  } catch (error) {
    console.error('Get detailed event analytics error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Get events for trainer (based on session assignments)
// @route   GET /api/events/trainer-events
// @access  Private (Trainer)
exports.getTrainerEvents = async (req, res) => {
  try {
    const Session = require('../models/Session');
    
    // Find all sessions assigned to this trainer
    const trainerSessions = await Session.find({ 'trainer.id': req.user._id });
    
    // Get unique event IDs from the sessions
    const eventIds = [...new Set(trainerSessions.map(session => session.eventId.toString()))];
    
    // Fetch the events
    const events = await Event.find({ 
      _id: { $in: eventIds },
      status: 'approved' // Only show approved events
    }).populate('coordinator.id', 'name email');
    
    // Add session count for each event
    const eventsWithSessions = events.map(event => {
      const eventSessionCount = trainerSessions.filter(
        session => session.eventId.toString() === event._id.toString()
      ).length;
      
      return {
        ...event.toObject(),
        sessionCount: eventSessionCount
      };
    });
    
    return ResponseHandler.success(res, eventsWithSessions);
  } catch (error) {
    console.error('Get trainer events error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};
