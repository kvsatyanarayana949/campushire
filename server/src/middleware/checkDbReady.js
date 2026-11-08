const { isDbReady, getDbState, DB_STATES } = require('../config/dbState');

/**
 * Middleware that ensures database-dependent endpoints cannot execute queries
 * before database migrations have completed and the database is marked READY.
 * Returns HTTP 503 Service Unavailable with Retry-After header during cold starts/recovery.
 */
const checkDbReady = (req, res, next) => {
  if (isDbReady()) {
    return next();
  }

  const state = getDbState();
  const isInitializing = state === DB_STATES.INITIALIZING || state === DB_STATES.RETRYING;

  res.set('Retry-After', '5');
  return res.status(503).json({
    success: false,
    code: isInitializing ? 'DATABASE_INITIALIZING' : 'DATABASE_UNAVAILABLE',
    message: isInitializing
      ? 'Database service is warming up. Please retry in a few moments.'
      : 'Database service is temporarily unavailable. Automated recovery is in progress.',
    dbState: state,
    retryAfter: 5
  });
};

module.exports = checkDbReady;
