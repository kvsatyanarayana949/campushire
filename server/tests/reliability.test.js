const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');

// Safety Guard: ensure tests NEVER run against production databases
require('./testGuard');

const app = require('../src/app');
const { DB_STATES, getDbState, isDbReady, setDbState, getDbDetails } = require('../src/config/dbState');
const pool = require('../src/config/db');

let server;
let baseUrl;

before(async () => {
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

after(async () => {
  // Ensure state is restored to READY after tests
  setDbState(DB_STATES.READY);
  await new Promise((resolve) => {
    if (server) server.close(resolve);
    else resolve();
  });
  await pool.end();
});

describe('CampusHire Production Reliability & Resilience Suite', () => {

  test('1. Process health endpoint (/api/health) returns HTTP 200 and reports db state', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.status, 'UP');
    assert.strictEqual(json.service, 'CampusHire API Backend');
    assert.ok(json.database);
    assert.ok(typeof json.uptime === 'number');
  });

  test('2. Process health (/api/health) returns 200 even when database is INITIALIZING (Render survival)', async () => {
    setDbState(DB_STATES.INITIALIZING);
    const res = await fetch(`${baseUrl}/api/health`);
    assert.strictEqual(res.status, 200, 'Process health MUST return 200 so hosting platform does not kill container');
    const json = await res.json();
    assert.strictEqual(json.database, DB_STATES.INITIALIZING);
    setDbState(DB_STATES.READY);
  });

  test('3. Dedicated readiness endpoint (/api/health/ready) returns 200 when READY and 503 when NOT_READY', async () => {
    // When READY
    setDbState(DB_STATES.READY);
    const resReady = await fetch(`${baseUrl}/api/health/ready`);
    assert.strictEqual(resReady.status, 200);
    const jsonReady = await resReady.json();
    assert.strictEqual(jsonReady.status, 'READY');
    assert.strictEqual(jsonReady.database, 'READY');

    // When INITIALIZING
    setDbState(DB_STATES.INITIALIZING);
    const resInit = await fetch(`${baseUrl}/api/health/ready`);
    assert.strictEqual(resInit.status, 503);
    assert.strictEqual(resInit.headers.get('retry-after'), '5');
    const jsonInit = await resInit.json();
    assert.strictEqual(jsonInit.status, 'NOT_READY');
    assert.strictEqual(jsonInit.database, DB_STATES.INITIALIZING);

    // When FAILED
    setDbState(DB_STATES.FAILED, new Error('Simulated network timeout'));
    const resFail = await fetch(`${baseUrl}/api/health/ready`);
    assert.strictEqual(resFail.status, 503);
    assert.strictEqual(resFail.headers.get('retry-after'), '5');

    // Restore
    setDbState(DB_STATES.READY);
  });

  test('4. Database-dependent endpoints (/api/jobs) are blocked with 503 while database is INITIALIZING', async () => {
    setDbState(DB_STATES.INITIALIZING);

    const res = await fetch(`${baseUrl}/api/jobs?limit=2`);
    assert.strictEqual(res.status, 503);
    assert.strictEqual(res.headers.get('retry-after'), '5');

    const json = await res.json();
    assert.strictEqual(json.success, false);
    assert.strictEqual(json.code, 'DATABASE_INITIALIZING');
    assert.match(json.message, /warming up/i);

    // Restore
    setDbState(DB_STATES.READY);
  });

  test('5. Database-dependent endpoints (/api/jobs) are blocked with 503 while database is FAILED', async () => {
    setDbState(DB_STATES.FAILED, new Error('Simulated TiDB cold start timeout'));

    const res = await fetch(`${baseUrl}/api/jobs?limit=2`);
    assert.strictEqual(res.status, 503);
    assert.strictEqual(res.headers.get('retry-after'), '5');

    const json = await res.json();
    assert.strictEqual(json.success, false);
    assert.strictEqual(json.code, 'DATABASE_UNAVAILABLE');
    assert.match(json.message, /temporarily unavailable/i);

    // Restore
    setDbState(DB_STATES.READY);
  });

  test('6. Database Recovery: Transition from FAILED to READY immediately restores 200 OK responses', async () => {
    // 1. Simulate outage
    setDbState(DB_STATES.FAILED, new Error('Temporary TiDB outage'));
    const failRes = await fetch(`${baseUrl}/api/jobs?limit=2`);
    assert.strictEqual(failRes.status, 503);

    // 2. Simulate automated recovery
    setDbState(DB_STATES.READY);
    const recoveredRes = await fetch(`${baseUrl}/api/jobs?limit=2`);
    assert.strictEqual(recoveredRes.status, 200);

    const json = await recoveredRes.json();
    assert.strictEqual(json.success, true);
    assert.ok(Array.isArray(json.data));
  });

  test('7. Authentication endpoints (/api/auth/login) are protected by checkDbReady during cold starts', async () => {
    setDbState(DB_STATES.INITIALIZING);

    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'rohit.verma@student.edu', password: 'Password@123' })
    });

    assert.strictEqual(res.status, 503);
    const json = await res.json();
    assert.strictEqual(json.success, false);
    assert.strictEqual(json.code, 'DATABASE_INITIALIZING');

    // Restore
    setDbState(DB_STATES.READY);
  });

  test('8. Live database query probe (/api/health?check_db=true) tests actual pool connectivity', async () => {
    setDbState(DB_STATES.READY);
    const res = await fetch(`${baseUrl}/api/health?check_db=true`);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.status, 'UP');
    assert.strictEqual(json.database, 'CONNECTED');
  });

  test('9. Database pool error handler safely handles connection resets without crashing', () => {
    // Verify that the pool has an error listener attached
    const listeners = pool.listeners('error');
    assert.ok(listeners.length > 0, 'Connection pool must register an error listener to prevent uncaught socket errors');

    // Emit a simulated connection reset event to ensure no crash
    assert.doesNotThrow(() => {
      pool.emit('error', Object.assign(new Error('Connection reset by peer'), { code: 'ECONNRESET' }));
    });
  });

  test('10. Process error listeners for uncaughtException and unhandledRejection are active', () => {
    const uncaughtListeners = process.listeners('uncaughtException');
    const rejectionListeners = process.listeners('unhandledRejection');

    assert.ok(uncaughtListeners.length > 0, 'Must have uncaughtException listener');
    assert.ok(rejectionListeners.length > 0, 'Must have unhandledRejection listener');
  });
});
