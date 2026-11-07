/**
 * Test Environment Isolation Guard
 * Strictly forbids tests from executing against production or remote databases.
 */

const assertTestDatabaseSafety = () => {
  const host = (process.env.DB_HOST || '127.0.0.1').toLowerCase().trim();
  const port = String(process.env.DB_PORT || '3306').trim();

  // Allowed test database hosts: strictly local loopback interfaces
  const isLocalHost = host === '127.0.0.1' || host === 'localhost' || host === '::1';

  // Remote production signatures that MUST NEVER be targeted by test suites
  const isProductionTarget = host.includes('tidbcloud') ||
                             host.includes('aws') ||
                             host.includes('render') ||
                             host.includes('prod') ||
                             port === '4000';

  if (!isLocalHost || isProductionTarget) {
    throw new Error(
      `FATAL SAFETY VIOLATION: Test suite execution refused against non-local host '${host}:${port}'. ` +
      `Integration tests are strictly prohibited from targeting remote or production databases.`
    );
  }
};

module.exports = { assertTestDatabaseSafety };
