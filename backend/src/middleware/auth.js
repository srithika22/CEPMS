const User = require('../models/User');
const { verifyToken } = require('../utils/jwtUtils');
const ResponseHandler = require('../utils/responseHandler');

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
  try {
    let token;

    // 1. Check for token in Authorization header (Bearer token)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // 2. Check for token in cookies (if not in header)
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return ResponseHandler.unauthorized(res, 'Not authorized to access this route. Please login.');
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return ResponseHandler.unauthorized(res, 'Invalid or expired token');
    }

    req.user = await User.findById(decoded.id).select('-password');
    
    if (!req.user) {
      return ResponseHandler.unauthorized(res, 'User not found');
    }

    if (!req.user.isActive) {
      return ResponseHandler.forbidden(res, 'Account is inactive');
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return ResponseHandler.unauthorized(res, 'Not authorized to access this route');
  }
};

// Role-based access control
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return ResponseHandler.forbidden(
        res,
        `User role '${req.user.role}' is not authorized to access this route`
      );
    }
    next();
  };
};

// Check if user is coordinator
exports.checkCoordinator = async (req, res, next) => {
  try {
    if (req.user.role === 'admin') {
      return next();
    }

    if (req.user.role === 'faculty' && req.user.faculty?.canCoordinate) {
      return next();
    }

    return ResponseHandler.forbidden(res, 'Only coordinators can access this route');
  } catch (error) {
    console.error('Coordinator check error:', error);
    return ResponseHandler.serverError(res);
  }
};

// Check if user is coordinator OR trainer assigned to the session
exports.checkCoordinatorOrTrainer = async (req, res, next) => {
  try {
    // Allow admins
    if (req.user.role === 'admin') {
      return next();
    }

    // Allow faculty coordinators
    if (req.user.role === 'faculty' && req.user.faculty?.canCoordinate) {
      return next();
    }

    // Allow trainers assigned to the session
    if (req.user.role === 'trainer' && req.params.sessionId) {
      const Session = require('../models/Session');
      const session = await Session.findById(req.params.sessionId);
      
      if (session && session.trainer && session.trainer.id && 
          session.trainer.id.toString() === req.user._id.toString()) {
        return next();
      }
    }

    return ResponseHandler.forbidden(res, 'Access denied: Not authorized for this session');
  } catch (error) {
    console.error('Coordinator or trainer check error:', error);
    return ResponseHandler.serverError(res);
  }
};

// Check if user is coordinator OR trainer assigned to any session of the event
exports.checkCoordinatorOrEventTrainer = async (req, res, next) => {
  try {
    // Allow admins
    if (req.user.role === 'admin') {
      return next();
    }

    // Allow faculty coordinators
    if (req.user.role === 'faculty' && req.user.faculty?.canCoordinate) {
      return next();
    }

    // Allow trainers assigned to any session of the event
    if (req.user.role === 'trainer' && req.params.eventId) {
      const Session = require('../models/Session');
      const mongoose = require('mongoose');
      
      // Convert eventId to ObjectId if it's a string
      let eventId = req.params.eventId;
      if (typeof eventId === 'string' && mongoose.Types.ObjectId.isValid(eventId)) {
        eventId = new mongoose.Types.ObjectId(eventId);
      }
      
      const sessions = await Session.find({ 
        eventId: eventId,
        'trainer.id': req.user._id
      });
      
      if (sessions && sessions.length > 0) {
        return next();
      }
    }

    return ResponseHandler.forbidden(res, 'Access denied: Not authorized for this event');
  } catch (error) {
    console.error('Coordinator or event trainer check error:', error);
    return ResponseHandler.serverError(res);
  }
};

// Check if user can mark attendance (coordinators or trainers for their sessions)
exports.checkAttendancePermission = async (req, res, next) => {
  try {
    // Allow admins
    if (req.user.role === 'admin') {
      return next();
    }

    // For attendance marking, we need to check the session in request body
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return ResponseHandler.badRequest(res, 'Session ID is required');
    }

    const Session = require('../models/Session');
    const session = await Session.findById(sessionId).populate('eventId');
    
    if (!session) {
      return ResponseHandler.notFound(res, 'Session not found');
    }

    // Allow faculty coordinators for any session
    if (req.user.role === 'faculty' && req.user.faculty?.canCoordinate) {
      return next();
    }

    // Allow event coordinator
    if (session.eventId && session.eventId.coordinator && 
        session.eventId.coordinator.id && 
        session.eventId.coordinator.id.toString() === req.user._id.toString()) {
      return next();
    }

    // Allow trainers assigned to this specific session
    if (req.user.role === 'trainer' && 
        session.trainer && session.trainer.id && 
        session.trainer.id.toString() === req.user._id.toString()) {
      return next();
    }

    return ResponseHandler.forbidden(res, 'Not authorized to mark attendance for this session');
  } catch (error) {
    console.error('Attendance permission check error:', error);
    return ResponseHandler.serverError(res);
  }
};
