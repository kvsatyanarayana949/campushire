const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const pool = require('../src/config/db');
const { verifyAndMigrateTokenVersion } = require('../database/init');
const { assertTestDatabaseSafety } = require('./testGuard');

describe('Database Migration & Concurrency Suite (Isolated Local Tables)', () => {
  const TEST_TABLE_EXISTING = '_test_mig_existing';
  const TEST_TABLE_MISSING = '_test_mig_missing';
  const TEST_TABLE_CONCURRENT = '_test_mig_concurrent';
  const TEST_TABLE_FAIL_MISSING = '_test_mig_fail_missing';
  const TEST_TABLE_WRONG_DEF = '_test_mig_wrong_def';

  before(async () => {
    assertTestDatabaseSafety();
    // Clean up any stale test tables
    await pool.query(`DROP TABLE IF EXISTS ${TEST_TABLE_EXISTING}, ${TEST_TABLE_MISSING}, ${TEST_TABLE_CONCURRENT}, ${TEST_TABLE_FAIL_MISSING}, ${TEST_TABLE_WRONG_DEF}`);
  });

  after(async () => {
    // Clean up all temporary test tables
    await pool.query(`DROP TABLE IF EXISTS ${TEST_TABLE_EXISTING}, ${TEST_TABLE_MISSING}, ${TEST_TABLE_CONCURRENT}, ${TEST_TABLE_FAIL_MISSING}, ${TEST_TABLE_WRONG_DEF}`);
    await pool.end();
  });

  test('1. Column already exists with correct definition (INT NOT NULL DEFAULT 0)', async () => {
    await pool.query(`
      CREATE TABLE ${TEST_TABLE_EXISTING} (
        id INT PRIMARY KEY,
        role VARCHAR(20),
        token_version INT NOT NULL DEFAULT 0
      )
    `);

    const result = await verifyAndMigrateTokenVersion(pool, TEST_TABLE_EXISTING);
    assert.strictEqual(result.status, 'ALREADY_EXISTS');
    assert.strictEqual(result.valid, true);
  });

  test('2. Column is missing and gets created successfully with valid definition', async () => {
    await pool.query(`
      CREATE TABLE ${TEST_TABLE_MISSING} (
        id INT PRIMARY KEY,
        name VARCHAR(50),
        role VARCHAR(20)
      )
    `);

    const result = await verifyAndMigrateTokenVersion(pool, TEST_TABLE_MISSING);
    assert.strictEqual(result.status, 'MIGRATED');
    assert.strictEqual(result.valid, true);

    // Verify column definition in database
    const [cols] = await pool.query(`SHOW COLUMNS FROM ${TEST_TABLE_MISSING} LIKE 'token_version'`);
    assert.strictEqual(cols.length, 1);
    assert.strictEqual(cols[0].Field, 'token_version');
    assert.strictEqual(cols[0].Null, 'NO');
    assert.strictEqual(cols[0].Default, '0');
    assert.ok(cols[0].Type.toLowerCase().startsWith('int'));
  });

  test('3. Concurrent migration race: Instance A creates column, Instance B fails ALTER TABLE but recovers via schema recheck', async () => {
    await pool.query(`
      CREATE TABLE ${TEST_TABLE_CONCURRENT} (
        id INT PRIMARY KEY,
        role VARCHAR(20)
      )
    `);

    // Simulate Instance A creating the column
    await pool.query(`ALTER TABLE ${TEST_TABLE_CONCURRENT} ADD COLUMN token_version INT NOT NULL DEFAULT 0 AFTER role`);

    // Simulate Instance B running verifyAndMigrateTokenVersion where an ALTER TABLE is attempted and throws duplicate column
    // Create a mock connection wrapper for Instance B that throws on ALTER TABLE
    const mockDbConnInstanceB = {
      query: async (sql, params) => {
        if (typeof sql === 'string' && sql.includes('ALTER TABLE')) {
          const dupErr = new Error("Duplicate column name 'token_version'");
          dupErr.code = 'ER_DUP_FIELDNAME';
          throw dupErr;
        }
        return pool.query(sql, params);
      }
    };

    const resultInstanceB = await verifyAndMigrateTokenVersion(mockDbConnInstanceB, TEST_TABLE_CONCURRENT);
    assert.ok(resultInstanceB.valid, 'Instance B must succeed when column is confirmed present');
  });

  test('4. ALTER TABLE fails and column remains missing: startup fails (throws FATAL error)', async () => {
    await pool.query(`
      CREATE TABLE ${TEST_TABLE_FAIL_MISSING} (
        id INT PRIMARY KEY,
        role VARCHAR(20)
      )
    `);

    // Mock connection where ALTER TABLE fails AND column is never created
    const mockFailingConn = {
      query: async (sql, params) => {
        if (typeof sql === 'string' && sql.includes('ALTER TABLE')) {
          throw new Error('Lock wait timeout exceeded / Disk failure');
        }
        return pool.query(sql, params);
      }
    };

    await assert.rejects(
      async () => {
        await verifyAndMigrateTokenVersion(mockFailingConn, TEST_TABLE_FAIL_MISSING);
      },
      {
        name: 'Error',
        message: /FATAL: Failed to migrate 'token_version' column.*Column remains missing/i
      }
    );
  });

  test('5. Column exists with an incorrect definition: startup fails (throws FATAL error)', async () => {
    // Create table with incorrect column definition (e.g. VARCHAR instead of INT, NULLable, no default)
    await pool.query(`
      CREATE TABLE ${TEST_TABLE_WRONG_DEF} (
        id INT PRIMARY KEY,
        role VARCHAR(20),
        token_version VARCHAR(50) NULL DEFAULT NULL
      )
    `);

    await assert.rejects(
      async () => {
        await verifyAndMigrateTokenVersion(pool, TEST_TABLE_WRONG_DEF);
      },
      {
        name: 'Error',
        message: /FATAL: 'token_version' column exists on .* but definition is incorrect/i
      }
    );
  });

  test('6. Schema recheck itself fails: startup fails (throws FATAL error)', async () => {
    const mockRecheckFailingConn = {
      query: async (sql, params) => {
        if (typeof sql === 'string' && sql.includes('SHOW COLUMNS')) {
          // Allow first check to report missing, but throw on recheck query
          if (!mockRecheckFailingConn._calledOnce) {
            mockRecheckFailingConn._calledOnce = true;
            return [[]];
          }
          throw new Error('Connection severed during schema recheck');
        }
        if (typeof sql === 'string' && sql.includes('ALTER TABLE')) {
          return [{ affectedRows: 0 }];
        }
        return pool.query(sql, params);
      }
    };

    await assert.rejects(
      async () => {
        await verifyAndMigrateTokenVersion(mockRecheckFailingConn, 'non_existent_table');
      },
      {
        name: 'Error',
        message: /FATAL: Schema recheck failed/i
      }
    );
  });

  test('7. Column exists with incorrect signedness (INT UNSIGNED): startup fails (throws FATAL error)', async () => {
    const TEST_TABLE_UNSIGNED = '_test_mig_unsigned';
    await pool.query(`DROP TABLE IF EXISTS ${TEST_TABLE_UNSIGNED}`);
    await pool.query(`
      CREATE TABLE ${TEST_TABLE_UNSIGNED} (
        id INT PRIMARY KEY,
        role VARCHAR(20),
        token_version INT UNSIGNED NOT NULL DEFAULT 0
      )
    `);

    try {
      await assert.rejects(
        async () => {
          await verifyAndMigrateTokenVersion(pool, TEST_TABLE_UNSIGNED);
        },
        {
          name: 'Error',
          message: /FATAL: 'token_version' column exists on .* but definition is incorrect/i
        }
      );
    } finally {
      await pool.query(`DROP TABLE IF EXISTS ${TEST_TABLE_UNSIGNED}`);
    }
  });

  test('8. Genuine two-connection migration race: two real connections attempt migration simultaneously and both succeed', async () => {
    const TEST_TABLE_REAL_CONCURRENT = '_test_mig_real_concurrent';
    await pool.query(`DROP TABLE IF EXISTS ${TEST_TABLE_REAL_CONCURRENT}`);
    await pool.query(`
      CREATE TABLE ${TEST_TABLE_REAL_CONCURRENT} (
        id INT PRIMARY KEY,
        name VARCHAR(50),
        role VARCHAR(20)
      )
    `);

    const conn1 = await pool.getConnection();
    const conn2 = await pool.getConnection();

    try {
      // Dispatch simultaneous migration checks on two distinct physical MySQL connections
      const [res1, res2] = await Promise.all([
        verifyAndMigrateTokenVersion(conn1, TEST_TABLE_REAL_CONCURRENT),
        verifyAndMigrateTokenVersion(conn2, TEST_TABLE_REAL_CONCURRENT)
      ]);

      // Both connections must report valid: true
      assert.strictEqual(res1.valid, true);
      assert.strictEqual(res2.valid, true);

      // One connection executes the DDL (MIGRATED), and the other resolves via concurrent recheck (CONCURRENTLY_RESOLVED)
      const statuses = [res1.status, res2.status];
      assert.ok(statuses.includes('MIGRATED'), 'At least one connection must perform the migration');
      assert.ok(
        statuses.includes('CONCURRENTLY_RESOLVED') || statuses.includes('ALREADY_EXISTS') || statuses.includes('MIGRATED'),
        'The concurrent connection must resolve cleanly'
      );

      // Verify the resulting column in the database has exact valid definition
      const [cols] = await pool.query(`SHOW COLUMNS FROM ${TEST_TABLE_REAL_CONCURRENT} LIKE 'token_version'`);
      assert.strictEqual(cols.length, 1);
      assert.strictEqual(cols[0].Field, 'token_version');
      assert.strictEqual(cols[0].Null, 'NO');
      assert.strictEqual(cols[0].Default, '0');
      assert.ok(/^int(\(\d+\))?$/.test(cols[0].Type.toLowerCase().trim()));
    } finally {
      conn1.release();
      conn2.release();
      await pool.query(`DROP TABLE IF EXISTS ${TEST_TABLE_REAL_CONCURRENT}`);
    }
  });
});
