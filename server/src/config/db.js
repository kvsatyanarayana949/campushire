const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const useSSL = process.env.DB_SSL === 'true' || 
               process.env.DB_PORT === '4000' || 
               (process.env.DB_HOST && process.env.DB_HOST.includes('tidbcloud'));

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'campushire_db',
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
  connectTimeout: 20000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  timezone: '+00:00',
  dateStrings: true,
  ssl: useSSL ? { minVersion: 'TLSv1.2', rejectUnauthorized: false } : undefined
});

// Resilient pool error handling for dropped idle sockets (common in serverless/cloud DBs)
pool.on('error', (err) => {
  console.error('[DB Pool Error]', err.message);
  if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNRESET') {
    console.warn('[DB Pool Notice] Remote connection reset. Pool will reconnect on next acquire.');
  }
});

module.exports = pool;
