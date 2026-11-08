const app = require('./app');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { initializeDatabase, stopLifecycleTimer } = require('./config/dbState');

const PORT = process.env.PORT || 5000;

// Catch and log any uncaught exceptions or unhandled promise rejections without abrupt crashes
process.on('uncaughtException', (err) => {
  console.error('[CRITICAL] Uncaught Exception:', err.stack || err.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('[CRITICAL] Unhandled Promise Rejection:', reason);
});

const server = app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`  CampusHire REST API Server Running           `);
  console.log(`  Port:    ${PORT}                             `);
  console.log(`  Env:     ${process.env.NODE_ENV || 'development'} `);
  console.log(`  Health:  http://localhost:${PORT}/api/health `);
  console.log(`===============================================`);

  // Asynchronous background database verification and automated recovery lifecycle
  if (process.env.NODE_ENV !== 'test') {
    initializeDatabase({ retryOnFailure: true, retryDelayMs: 5000 });
  }
});

// Graceful Shutdown: close HTTP server, stop background timers, and terminate MySQL pool cleanly
const handleShutdown = async (signal) => {
  console.log(`\nReceived ${signal}. Gracefully closing HTTP server and database pool...`);
  stopLifecycleTimer();

  server.close(async () => {
    console.log('HTTP server closed.');
    try {
      const pool = require('./config/db');
      await pool.end();
      console.log('Database connection pool closed successfully.');
    } catch (dbErr) {
      console.warn(`[Shutdown Warning] Error closing DB pool: ${dbErr.message}`);
    }
    process.exit(0);
  });
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

module.exports = server;
