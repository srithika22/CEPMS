const { validationResult } = require('express-validator');
const ResponseHandler = require('../utils/responseHandler');

exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const extractedErrors = errors.array().map(err => ({
      field: err.param,
      message: err.msg
    }));
    
    return ResponseHandler.badRequest(res, 'Validation failed', extractedErrors);
  }
  
  next();
};
