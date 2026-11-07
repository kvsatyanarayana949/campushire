const { errorResponse } = require('../utils/response');

/**
 * Role-Based Access Control Middleware
 * @param  {...string} roles Allowed roles ('STUDENT', 'RECRUITER', 'ADMIN')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Authentication required before checking permissions.', 401);
    }

    if (!roles.includes(req.user.role)) {
      return errorResponse(
        res,
        `Access forbidden. Required role(s): ${roles.join(', ')}. Your role: ${req.user.role}`,
        403
      );
    }

    next();
  };
};

module.exports = authorize;
