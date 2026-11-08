const DB_STATES = Object.freeze({
  INITIALIZING: 'INITIALIZING',
  READY: 'READY',
  FAILED: 'FAILED',
  RETRYING: 'RETRYING'
});

// In test environment, default to READY so existing unit/integration tests run without delay
const isTestEnv = process.env.NODE_ENV === 'test' || 
                  process.argv.includes('--test') || 
                  Boolean(process.env.NODE_TEST_CONTEXT);

let currentState = isTestEnv ? DB_STATES.READY : DB_STATES.INITIALIZING;
let lastError = null;
let lastStateChange = new Date().toISOString();
let retryTimer = null;
let isMigrating = false;

function getDbState() {
  return currentState;
}

function isDbReady() {
  return currentState === DB_STATES.READY;
}

function setDbState(newState, err = null) {
  if (!Object.values(DB_STATES).includes(newState)) {
    throw new Error(`Invalid DB state: ${newState}`);
  }
  currentState = newState;
  lastError = err ? (err.message || String(err)) : null;
  lastStateChange = new Date().toISOString();

  if (newState === DB_STATES.READY && retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
}

function getDbDetails() {
  return {
    state: currentState,
    isReady: isDbReady(),
    lastError,
    lastStateChange
  };
}

/**
 * Initializes database connection and verifies required schema migrations asynchronously.
 * Automatically schedules retries with exponential backoff if database is cold-starting.
 */
async function initializeDatabase(options = {}) {
  const {
    retryOnFailure = true,
    maxRetries = Infinity,
    retryDelayMs = 5000,
    backoffMultiplier = 1.5,
    maxDelayMs = 30000
  } = options;

  if (isMigrating) {
    return;
  }
  isMigrating = true;

  try {
    const pool = require('./db');
    const { verifyAndMigrateTokenVersion } = require('../../database/init');

    console.log('[DB Lifecycle] Initiating database connection and schema verification...');
    const conn = await pool.getConnection();

    try {
      // Run idempotent, race-safe migration verification
      await verifyAndMigrateTokenVersion(conn, 'users');

      setDbState(DB_STATES.READY);
      console.log('[DB Lifecycle] Database successfully verified and marked READY. API endpoints active.');
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error(`[DB Lifecycle Error] Database initialization failed: ${err.message}`);
    setDbState(DB_STATES.FAILED, err);

    if (retryOnFailure) {
      setDbState(DB_STATES.RETRYING, err);
      const nextDelay = Math.min(retryDelayMs * backoffMultiplier, maxDelayMs);
      console.log(`[DB Lifecycle] Scheduling automated recovery attempt in ${(nextDelay / 1000).toFixed(1)}s...`);

      if (retryTimer) clearTimeout(retryTimer);
      retryTimer = setTimeout(() => {
        isMigrating = false;
        initializeDatabase({
          ...options,
          retryDelayMs: nextDelay
        });
      }, nextDelay);

      // Allow node to exit cleanly during tests/shutdown
      if (retryTimer.unref) retryTimer.unref();
    }
  } finally {
    isMigrating = false;
  }
}

function stopLifecycleTimer() {
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
  isMigrating = false;
}

module.exports = {
  DB_STATES,
  getDbState,
  isDbReady,
  setDbState,
  getDbDetails,
  initializeDatabase,
  stopLifecycleTimer
};
