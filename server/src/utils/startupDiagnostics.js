/**
 * CampusHire Production Startup Diagnostics
 * Records precise, structured timestamped events across the server lifecycle.
 * All events record elapsed time from process launch without exposing secrets.
 */

const processStartTime = Date.now();
const events = [];

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
recordEvent('PROCESS_START', 'SUCCESS', `Node ${process.version} on ${process.platform} (${process.arch})`);

function getDiagnostics() {
  const currentElapsedMs = Date.now() - processStartTime;
  return {
    processStartTime: new Date(processStartTime).toISOString(),
    totalUptimeSeconds: +(currentElapsedMs / 1000).toFixed(2),
    eventCount: events.length,
    events
  };
}

module.exports = {
  recordEvent,
  getDiagnostics,
  processStartTime
};
