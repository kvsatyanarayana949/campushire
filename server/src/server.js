const app = require('./app');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`  CampusHire REST API Server Running           `);
  console.log(`  Port:    ${PORT}                             `);
  console.log(`  Env:     ${process.env.NODE_ENV || 'development'} `);
  console.log(`  Health:  http://localhost:${PORT}/api/health `);
  console.log(`===============================================`);

  // Non-blocking background migration check on startup (does not block HTTP server or health check)
  if (process.env.NODE_ENV !== 'test') {
    (async () => {
      try {
        const pool = require('./config/db');
        const { verifyAndMigrateTokenVersion } = require('../database/init');
        const conn = await pool.getConnection();
        try {
          await verifyAndMigrateTokenVersion(conn, 'users');
        } finally {
          conn.release();
        }
      } catch (err) {
        console.warn(`[Startup DB Check] ${err.message}`);
      }
    })();
  }
});

// Graceful Shutdown
const handleShutdown = (signal) => {
  console.log(`\nReceived ${signal}. Gracefully closing HTTP server...`);
  server.close(() => {
    console.log('HTTP server closed. Exiting process.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

module.exports = server;
