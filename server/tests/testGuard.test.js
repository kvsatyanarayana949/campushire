const { test, describe } = require('node:test');
const assert = require('node:assert');
const { assertTestDatabaseSafety } = require('./testGuard');

describe('Test Environment Isolation Guard Suite', () => {
  const origHost = process.env.DB_HOST;
  const origPort = process.env.DB_PORT;

  test('1. Passes when connected to local loopback (127.0.0.1:3306)', () => {
    process.env.DB_HOST = '127.0.0.1';
    process.env.DB_PORT = '3306';
    assert.doesNotThrow(() => {
      assertTestDatabaseSafety();
    });
  });

  test('2. Throws fatal safety violation when DB_HOST contains tidbcloud', () => {
    process.env.DB_HOST = 'gateway01.us-west-2.prod.aws.tidbcloud.com';
    process.env.DB_PORT = '4000';
    assert.throws(
      () => {
        assertTestDatabaseSafety();
      },
      {
        name: 'Error',
        message: /FATAL SAFETY VIOLATION.*refused against non-local host/i
      }
    );
  });

  test('3. Throws fatal safety violation when DB_PORT is 4000', () => {
    process.env.DB_HOST = '127.0.0.1';
    process.env.DB_PORT = '4000';
    assert.throws(
      () => {
        assertTestDatabaseSafety();
      },
      {
        name: 'Error',
        message: /FATAL SAFETY VIOLATION/i
      }
    );
  });

  test('4. Throws fatal safety violation when DB_HOST is an external IP or remote server', () => {
    process.env.DB_HOST = '192.168.1.100';
    process.env.DB_PORT = '3306';
    assert.throws(
      () => {
        assertTestDatabaseSafety();
      },
      {
        name: 'Error',
        message: /FATAL SAFETY VIOLATION/i
      }
    );
  });

  // Cleanup: Restore original environment
  test('Cleanup: Restore test environment', () => {
    process.env.DB_HOST = origHost;
    process.env.DB_PORT = origPort;
  });
});
