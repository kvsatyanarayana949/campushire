const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { getJwtSecret } = require('./config/jwt');

// Enforce required security configuration on startup: fail fast if JWT_SECRET is missing
getJwtSecret();

const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const checkDbReady = require('./middleware/checkDbReady');
const { isDbReady, getDbState, getDbDetails } = require('./config/dbState');
const { recordEvent, recordInboundRequest, getDiagnostics, instanceId, processStartTime } = require('./utils/startupDiagnostics');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const recruiterRoutes = require('./routes/recruiterRoutes');
const companyRoutes = require('./routes/companyRoutes');
const jobRoutes = require('./routes/jobRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

// Security Headers
app.use(helmet());

// CORS Configuration
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(origin => origin.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server) or matching origins
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*') || origin.startsWith('http://localhost:')) {
        return callback(null, true);
      }
      return callback(new Error(`CORS policy does not allow access from origin ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
);

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Body Parsing
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Inbound Request Telemetry for Cold-Start & Inactivity Verification
app.use((req, res, next) => {
  recordInboundRequest(req);
  next();
});

// Global Request Timeout Guard (25s) to prevent stalled connections
app.use((req, res, next) => {
  if (req.path.startsWith('/api/health')) return next();
  const timer = setTimeout(() => {
    if (!res.headersSent) {
      res.set('Retry-After', '5');
      res.status(504).json({
        success: false,
        code: 'REQUEST_TIMEOUT',
        message: 'The server took longer than expected to process the request. Please retry.'
      });
    }
  }, 25000);

  res.on('finish', () => clearTimeout(timer));
  res.on('close', () => clearTimeout(timer));
  next();
});

// Rate Limiting for Authentication Endpoints (Brute force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // max 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.'
  }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Root & Platform Health Probes (immediate 200 OK without database overhead)
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'CampusHire REST API Backend',
    timestamp: new Date().toISOString()
  });
});

app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

// 1. Process Health Check Endpoint (Render probe - never blocked by database)
app.get('/api/health', async (req, res) => {
  const dbState = getDbState();
  const diagnostics = getDiagnostics();
  const responseData = {
    status: 'UP',
    service: 'CampusHire API Backend',
    instanceId: diagnostics.instanceId,
    pid: diagnostics.pid,
    processStartTime: diagnostics.processStartTime,
    database: dbState,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    startupTimeline: {
      uptimeSeconds: diagnostics.totalUptimeSeconds,
      eventsRecorded: diagnostics.eventCount,
      lastEvent: diagnostics.events[diagnostics.events.length - 1] || null
    }
  };

  // Explicit readiness assertion query
  if (req.query.ready === 'true') {
    if (!isDbReady()) {
      res.set('Retry-After', '5');
      return res.status(503).json({
        status: 'DEGRADED',
        service: 'CampusHire API Backend',
        database: dbState,
        message: 'Database is warming up or undergoing automated schema verification.',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    }
  }

  // Explicit live database query probe
  if (req.query.check_db === 'true') {
    try {
      const pool = require('./config/db');
      await pool.query('SELECT 1');
      responseData.database = 'CONNECTED';
    } catch (dbErr) {
      responseData.database = 'DISCONNECTED';
      responseData.databaseError = dbErr.message;
      return res.status(503).json(responseData);
    }
  }

  return res.status(200).json(responseData);
});

// Dedicated Startup Diagnostics Endpoint (complete event timeline)
app.get('/api/health/diagnostics', (req, res) => {
  return res.status(200).json({
    status: 'SUCCESS',
    diagnostics: getDiagnostics()
  });
});

// 2. Dedicated Database Readiness Endpoint
app.get('/api/health/ready', (req, res) => {
  const dbDetails = getDbDetails();
  const diagnostics = getDiagnostics();
  if (isDbReady()) {
    return res.status(200).json({
      status: 'READY',
      service: 'CampusHire API Backend',
      instanceId: diagnostics.instanceId,
      pid: diagnostics.pid,
      processStartTime: diagnostics.processStartTime,
      database: 'READY',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  }
  res.set('Retry-After', '5');
  return res.status(503).json({
    status: 'NOT_READY',
    service: 'CampusHire API Backend',
    instanceId: diagnostics.instanceId,
    pid: diagnostics.pid,
    processStartTime: diagnostics.processStartTime,
    database: dbDetails.state,
    lastError: dbDetails.lastError,
    message: 'Database is warming up or undergoing automated schema verification. Please retry in a few moments.',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 3. Database Readiness Enforcement: Block database-dependent requests until migrations are verified
app.use('/api', checkDbReady);

// API Routes Mount
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/recruiters', recruiterRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

// Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

recordEvent('EXPRESS_INIT', 'SUCCESS', 'Middleware, security policies, and 8 API route modules configured.');

module.exports = app;
