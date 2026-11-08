/**
 * CampusHire Production Startup Diagnostics
 * Records precise, structured timestamped events across the server lifecycle.
 * Tracks unique container instance ID, process PID, startup timeline, and recent inbound traffic.
 */

const crypto = require('crypto');

const instanceId = crypto.randomUUID();
const processStartTime = Date.now();
const events = [];
const recentInboundRequests = [];
const MAX_REQUEST_LOG = 30;

function recordEvent(name, status = 'SUCCESS', details = null) {
  const now = Date.now();
  const elapsedMs = now - processStartTime;
  const event = {
    event: name,
    timestamp: new Date(now).toISOString(),
    elapsedMs,
    elapsedSec: +(elapsedMs / 1000).toFixed(2),
    status,
    details: details ? String(details).replace(/password=[^&;\s]+/gi, 'password=***') : null
  };
  events.push(event);

  const prefix = `[STARTUP DIAGNOSTIC] [+${event.elapsedSec}s] [${name}]`;
  if (status === 'FAILED') {
    console.error(`${prefix} FAILED: ${event.details || 'Unknown error'}`);
  } else if (status === 'IN_PROGRESS') {
    console.log(`${prefix} ${event.details || 'In progress...'}`);
  } else {
    console.log(`${prefix} SUCCESS ${event.details ? `- ${event.details}` : ''}`);
  }

  return event;
}

// Initial event on module load
recordEvent(
  'PROCESS_START',
  'SUCCESS',
  `Instance: ${instanceId} | PID: ${process.pid} | Node ${process.version} on ${process.platform} (${process.arch})`
);

function recordInboundRequest(req) {
  const now = Date.now();
  const uptimeSec = +((now - processStartTime) / 1000).toFixed(2);
  const entry = {
    timestamp: new Date(now).toISOString(),
    uptimeSec,
    method: req.method,
    path: req.path,
    query: req.query && Object.keys(req.query).length > 0 ? req.query : undefined,
    benchmarkRunId: req.headers['x-benchmark-run-id'] || req.query?.benchmark_run_id || null,
    requestId: req.headers['x-request-id'] || req.query?.request_id || null,
    userAgent: req.headers['user-agent'] ? req.headers['user-agent'].substring(0, 100) : 'unknown',
    ip: req.ip || req.connection?.remoteAddress || 'unknown'
  };

  recentInboundRequests.push(entry);
  if (recentInboundRequests.length > MAX_REQUEST_LOG) {
    recentInboundRequests.shift();
  }
}

function getDiagnostics() {
  const currentElapsedMs = Date.now() - processStartTime;
  return {
    instanceId,
    pid: process.pid,
    processStartTime: new Date(processStartTime).toISOString(),
    processStartTimestampMs: processStartTime,
    currentServerTime: new Date().toISOString(),
    totalUptimeSeconds: +(currentElapsedMs / 1000).toFixed(2),
    eventCount: events.length,
    events,
    recentInboundRequests
  };
}

module.exports = {
  instanceId,
  processStartTime,
  recordEvent,
  recordInboundRequest,
  getDiagnostics
};
