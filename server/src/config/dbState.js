const { recordEvent } = require('../utils/startupDiagnostics');

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
 * Optimized for Render Free Tier:
 * - Ping test (SELECT 1)
 * - Schema verification (token_version on users table)
 * - Immediate readiness transition (<250ms)
 * - Non-blocking background demo data check with zero runtime CPU load
 */
async function initializeDatabase(options = {}) {
  const {
    retryOnFailure = true,
    maxRetries = Infinity,
    retryDelayMs = 4000,
    backoffMultiplier = 1.3,
    maxDelayMs = 20000
  } = options;

  if (isMigrating) {
    return;
  }
  isMigrating = true;

  try {
    const pool = require('./db');
    const { verifyAndMigrateTokenVersion } = require('../../database/init');

    recordEvent('DB_CONNECT_ATTEMPT', 'IN_PROGRESS', 'Initiating MySQL connection to TiDB Cloud pool');
    const conn = await pool.getConnection();
    recordEvent('DB_CONNECT_SUCCESS', 'SUCCESS', 'Acquired connection socket from pool');

    try {
      // 1. Ping database to confirm query execution
      const pingStart = Date.now();
      await conn.query('SELECT 1');
      const pingElapsed = Date.now() - pingStart;
      recordEvent('DB_PING_COMPLETED', 'SUCCESS', `SELECT 1 completed in ${pingElapsed}ms`);

      // 2. Schema verification: idempotent, race-safe migration verification
      const schemaStart = Date.now();
      await verifyAndMigrateTokenVersion(conn, 'users');
      const schemaElapsed = Date.now() - schemaStart;
      recordEvent('DB_SCHEMA_VERIFIED', 'SUCCESS', `'token_version' column verified in ${schemaElapsed}ms`);

      // 3. Mark database READY immediately: Unblocks all API endpoints in minimal time
      setDbState(DB_STATES.READY);
      recordEvent('DB_INIT_COMPLETED', 'SUCCESS', 'Database schema confirmed and database marked READY');
      recordEvent('APPLICATION_READY', 'SUCCESS', 'CampusHire backend and database are fully operational');

      // 4. Non-blocking idempotent demo maintenance in background (zero CPU overhead using pre-hashed credentials)
      if (!isTestEnv) {
        setImmediate(async () => {
          let bgConn = null;
          try {
            bgConn = await pool.getConnection();
            const demoHash = '$2a$10$HSHT4nHGiaa7z9hS1s4mYuQwy/0w2A7C3E8KxyMNxhqPVoNbvV.qe';
            await bgConn.query('UPDATE users SET password = ?, is_active = TRUE WHERE email IN (?, ?, ?)', [
              demoHash,
              'rohit.verma@student.edu',
              'priya.sharma@nexuscloud.com',
              'admin@campushire.io'
            ]);
            await bgConn.query('UPDATE jobs SET is_active = TRUE WHERE id IN (1, 2, 3, 4, 5, 6)');
            console.log('[DB Lifecycle] Background demo data sanity check verified.');
          } catch (bgErr) {
            console.warn('[DB Lifecycle Warning] Non-blocking demo check notice:', bgErr.message);
          } finally {
            if (bgConn) bgConn.release();
          }
        });
      }
    } finally {
      conn.release();
    }
  } catch (err) {
    recordEvent('DB_CONNECT_FAILED', 'FAILED', err.message);
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
