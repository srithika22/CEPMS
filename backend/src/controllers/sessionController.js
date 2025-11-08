const Session = require('../models/Session');
const Event = require('../models/Event');
const ResponseHandler = require('../utils/responseHandler');
const { emitToRoom } = require('../utils/socket');

// @desc    Create session
// @route   POST /api/sessions
// @access  Private (Coordinator/Admin)
exports.createSession = async (req, res) => {
  try {
    const { eventId, ...sessionData } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return ResponseHandler.notFound(res, 'Event not found');
    }

    // Check permission
    if (req.user.role !== 'admin' && event.coordinator.id.toString() !== req.user._id.toString()) {
      return ResponseHandler.forbidden(res, 'Not authorized');
    }

    const session = await Session.create({
      eventId,
      ...sessionData
    });

    return ResponseHandler.created(res, session, 'Session created successfully');
  } catch (error) {
    console.error('Create session error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Get event sessions
// @route   GET /api/sessions/event/:eventId
// @access  Public
exports.getEventSessions = async (req, res) => {
  try {
    const sessions = await Session.find({ eventId: req.params.eventId })
      .sort({ date: 1, startTime: 1 });

    return ResponseHandler.success(res, sessions);
  } catch (error) {
    console.error('Get event sessions error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Get session by ID
// @route   GET /api/sessions/:id
// @access  Public
exports.getSessionById = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate('eventId')
      .populate('trainer.id');

    if (!session) {
      return ResponseHandler.notFound(res, 'Session not found');
    }

    return ResponseHandler.success(res, session);
  } catch (error) {
    console.error('Get session by ID error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Get all sessions for faculty/coordinator
// @route   GET /api/sessions
// @access  Private (Faculty/Coordinator/Admin)
exports.getAllSessions = async (req, res) => {
  try {
    let query = {};
    
    // If not admin, filter by user's events or assigned sessions
    if (req.user.role !== 'admin') {
      if (req.user.role === 'trainer') {
        // For trainers, show sessions where they are assigned
        query['trainer.id'] = req.user._id;
      } else if (req.user.role === 'faculty') {
        // For faculty, show sessions from their coordinated events
        const userEvents = await Event.find({ 'coordinator.id': req.user._id });
        const eventIds = userEvents.map(event => event._id);
        query.eventId = { $in: eventIds };
      }
    }
    
    const sessions = await Session.find(query)
      .populate('eventId', 'title description category')
      .populate('trainer.id', 'firstName lastName email')
      .sort({ date: -1, startTime: 1 });

    return ResponseHandler.success(res, sessions);
  } catch (error) {
    console.error('Get all sessions error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Update session
// @route   PUT /api/sessions/:id
// @access  Private (Coordinator/Admin)
exports.updateSession = async (req, res) => {
  try {
    let session = await Session.findById(req.params.id).populate('eventId');

    if (!session) {
      return ResponseHandler.notFound(res, 'Session not found');
    }

    const event = session.eventId;

    // Check permission
    if (req.user.role !== 'admin' && event.coordinator.id.toString() !== req.user._id.toString()) {
      return ResponseHandler.forbidden(res, 'Not authorized');
    }

    session = await Session.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    return ResponseHandler.success(res, session, 'Session updated successfully');
  } catch (error) {
    console.error('Update session error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Delete session
// @route   DELETE /api/sessions/:id
// @access  Private (Coordinator/Admin)
exports.deleteSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id).populate('eventId');

    if (!session) {
      return ResponseHandler.notFound(res, 'Session not found');
    }

    const event = session.eventId;

    // Check permission
    if (req.user.role !== 'admin' && event.coordinator.id.toString() !== req.user._id.toString()) {
      return ResponseHandler.forbidden(res, 'Not authorized');
    }

    await session.deleteOne();

    return ResponseHandler.success(res, null, 'Session deleted successfully');
  } catch (error) {
    console.error('Delete session error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Add session material
// @route   POST /api/sessions/:id/materials
// @access  Private (Trainer/Coordinator/Admin)
exports.addSessionMaterial = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return ResponseHandler.notFound(res, 'Session not found');
    }

    const { name, url, type } = req.body;

    session.materials.push({
      name,
      url,
      type,
      uploadedAt: new Date()
    });

    await session.save();

    return ResponseHandler.success(res, session, 'Material added successfully');
  } catch (error) {
    console.error('Add session material error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Update session status
// @route   PATCH /api/sessions/:id/status
// @access  Private (Coordinator/Admin)
exports.updateSessionStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const session = await Session.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!session) {
      return ResponseHandler.notFound(res, 'Session not found');
    }

    return ResponseHandler.success(res, session, `Session status updated to ${status}`);
  } catch (error) {
    console.error('Update session status error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Get session analytics for an event
// @route   GET /api/sessions/analytics/:eventId
// @access  Private (Coordinator/Admin)
exports.getSessionAnalytics = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      return ResponseHandler.notFound(res, 'Event not found');
    }

    const sessions = await Session.find({ eventId }).sort({ date: 1 });
    
    const Attendance = require('../models/Attendance');
    
    const sessionAnalytics = await Promise.all(sessions.map(async (session) => {
      const attendanceRecords = await Attendance.find({ sessionId: session._id });
      const presentCount = attendanceRecords.filter(a => a.present).length;
      const totalParticipants = attendanceRecords.length;
      
      return {
        sessionId: session._id,
        title: session.title,
        date: session.date,
        startTime: session.startTime,
        endTime: session.endTime,
        status: session.status,
        attendance: {
          total: totalParticipants,
          present: presentCount,
          absent: totalParticipants - presentCount,
          percentage: totalParticipants > 0 ? (presentCount / totalParticipants) * 100 : 0
        },
        materials: session.materials.length,
        duration: session.duration
      };
    }));

    // Overall event analytics
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(s => s.status === 'completed').length;
    const upcomingSessions = sessions.filter(s => s.status === 'scheduled' && new Date(s.date) > new Date()).length;
    
    const avgAttendance = sessionAnalytics.length > 0
      ? sessionAnalytics.reduce((sum, s) => sum + s.attendance.percentage, 0) / sessionAnalytics.length
      : 0;

    return ResponseHandler.success(res, {
      event: {
        _id: event._id,
        title: event.title,
        eventId: event.eventId
      },
      overview: {
        totalSessions,
        completedSessions,
        upcomingSessions,
        avgAttendance: parseFloat(avgAttendance.toFixed(2))
      },
      sessions: sessionAnalytics
    });
  } catch (error) {
    console.error('Get session analytics error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Start session (real-time notification)
// @route   POST /api/sessions/:id/start
// @access  Private (Trainer/Coordinator/Admin)
exports.startSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id).populate('eventId');

    if (!session) {
      return ResponseHandler.notFound(res, 'Session not found');
    }

    // Update session status
    session.status = 'ongoing';
    session.actualStartTime = new Date();
    await session.save();

    // Emit real-time notification
    const sessionUpdate = {
      sessionId: session._id,
      eventId: session.eventId._id,
      title: session.title,
      status: 'ongoing',
      startedBy: {
        id: req.user._id,
        name: `${req.user.firstName} ${req.user.lastName}`
      },
      startTime: session.actualStartTime
    };

    // Notify event participants and coordinators
    emitToRoom(`event_${session.eventId._id}`, 'session-started', sessionUpdate);
    emitToRoom('admin', 'session-started', sessionUpdate);
    emitToRoom('faculty', 'session-started', sessionUpdate);

    return ResponseHandler.success(res, session, 'Session started successfully');
  } catch (error) {
    console.error('Start session error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    End session (real-time notification)
// @route   POST /api/sessions/:id/end
// @access  Private (Trainer/Coordinator/Admin)
exports.endSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id).populate('eventId');

    if (!session) {
      return ResponseHandler.notFound(res, 'Session not found');
    }

    // Update session status
    session.status = 'completed';
    session.actualEndTime = new Date();
    
    // Calculate actual duration
    if (session.actualStartTime) {
      const durationMs = session.actualEndTime - session.actualStartTime;
      session.actualDuration = Math.round(durationMs / (1000 * 60)); // minutes
    }

    await session.save();

    // Emit real-time notification
    const sessionUpdate = {
      sessionId: session._id,
      eventId: session.eventId._id,
      title: session.title,
      status: 'completed',
      endedBy: {
        id: req.user._id,
        name: `${req.user.firstName} ${req.user.lastName}`
      },
      endTime: session.actualEndTime,
      duration: session.actualDuration
    };

    // Notify event participants and coordinators
    emitToRoom(`event_${session.eventId._id}`, 'session-ended', sessionUpdate);
    emitToRoom('admin', 'session-ended', sessionUpdate);
    emitToRoom('faculty', 'session-ended', sessionUpdate);

    return ResponseHandler.success(res, session, 'Session ended successfully');
  } catch (error) {
    console.error('End session error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};
