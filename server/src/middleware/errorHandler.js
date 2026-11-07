const { errorResponse } = require('../utils/response');

// Centralized Express Error Handler
const errorHandler = (err, req, res, next) => {
  console.error('[Unhandled Server Error]', err);

  // MySQL Duplicate Entry Error
  if (err.code === 'ER_DUP_ENTRY') {
    let message = 'A record with these unique details already exists.';
    if (err.sqlMessage && err.sqlMessage.includes('uq_job_student')) {
      message = 'You have already applied for this job opening.';
    } else if (err.sqlMessage && err.sqlMessage.includes('email')) {
      message = 'An account with this email address is already registered.';
    } else if (err.sqlMessage && err.sqlMessage.includes('roll_number')) {
      message = 'A student profile with this roll number is already registered.';
    }
    return errorResponse(res, message, 409);
  }

  // MySQL Foreign Key Constraint Error
  if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_ROW_IS_REFERENCED_2') {
    return errorResponse(res, 'Database relational integrity constraint violated.', 400);
  }

  // Payload too large
  if (err.type === 'entity.too.large') {
    return errorResponse(res, 'Request body is too large.', 413);
  }

  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'An unexpected error occurred on the server.' 
    : err.message || 'Internal Server Error';

  return errorResponse(res, message, statusCode);
};

// 404 Route Not Found Handler
const notFoundHandler = (req, res) => {
  return errorResponse(res, `Endpoint ${req.method} ${req.originalUrl} not found on this server.`, 404);
};

module.exports = {
  errorHandler,
  notFoundHandler
};
