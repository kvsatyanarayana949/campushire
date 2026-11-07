const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { errorResponse } = require('../utils/response');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Authentication required. No token provided.', 401);
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'campushire_secret_jwt_key';

    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (jwtErr) {
      if (jwtErr.name === 'TokenExpiredError') {
        return errorResponse(res, 'Token has expired. Please log in again.', 401);
      }
      return errorResponse(res, 'Invalid token. Please authenticate.', 401);
    }

    // Verify user exists and is active in database
    const [users] = await pool.query(
      'SELECT id, name, email, role, is_active FROM users WHERE id = ? LIMIT 1',
      [decoded.userId]
    );

    if (users.length === 0) {
      return errorResponse(res, 'User account no longer exists.', 401);
    }

    const user = users[0];
    if (!user.is_active) {
      return errorResponse(res, 'Your account has been deactivated. Please contact administrator.', 403);
    }

    req.user = user;
    next();
  } catch (err) {
    return errorResponse(res, 'Internal server error during authentication.', 500);
  }
};

module.exports = authenticate;
