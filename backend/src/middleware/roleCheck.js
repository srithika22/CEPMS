const ResponseHandler = require('../utils/responseHandler');

// Role-based access control
exports.checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return ResponseHandler.unauthorized(res, 'User not authenticated');
    }

    if (!allowedRoles.includes(req.user.role)) {
      return ResponseHandler.forbidden(
        res,
        `Access denied. Required roles: ${allowedRoles.join(', ')}`
      );
    }

    next();
  };
};

// Check if user can coordinate events
exports.checkCanCoordinate = (req, res, next) => {
  if (!req.user) {
    return ResponseHandler.unauthorized(res, 'User not authenticated');
  }

  if (req.user.role === 'admin') {
    return next();
  }

  if (req.user.role === 'faculty' && req.user.faculty?.canCoordinate) {
    return next();
  }

  return ResponseHandler.forbidden(
    res,
    'Only coordinators can perform this action'
  );
};

// Check if user owns resource or is admin
exports.checkOwnership = (resourceUserId) => {
  return (req, res, next) => {
    if (!req.user) {
      return ResponseHandler.unauthorized(res, 'User not authenticated');
    }

    if (req.user.role === 'admin') {
      return next();
    }

    if (req.user._id.toString() === resourceUserId.toString()) {
      return next();
    }

    return ResponseHandler.forbidden(res, 'You can only access your own resources');
  };
};

