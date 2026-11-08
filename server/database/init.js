require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// Verify and migrate token_version column safely and idempotently
async function verifyAndMigrateTokenVersion(dbConn, tableName = 'users') {
  const verifyDefinition = async () => {
    const [cols] = await dbConn.query(`SHOW COLUMNS FROM \`${tableName}\` LIKE 'token_version'`);
    if (!cols || cols.length === 0) return { exists: false, valid: false };
    const col = cols[0];
    const isFieldMatch = col.Field === 'token_version';
    const typeStr = typeof col.Type === 'string' ? col.Type.toLowerCase().trim() : '';
    // Must strictly match standard signed 32-bit INT (e.g. 'int' or legacy display width 'int(11)'), explicitly rejecting unsigned or other types
    const isTypeExactSignedInt = /^int(\(\d+\))?$/.test(typeStr);
    const isNotNull = col.Null === 'NO';
    const isDefaultZero = col.Default === '0' || col.Default === 0;
    const valid = isFieldMatch && isTypeExactSignedInt && isNotNull && isDefaultZero;
    return { exists: true, valid, col };
  };

  const initialStatus = await verifyDefinition();

  if (initialStatus.exists) {
    if (!initialStatus.valid) {
      throw new Error(`FATAL: 'token_version' column exists on ${tableName} but definition is incorrect (Type: ${initialStatus.col?.Type}, Null: ${initialStatus.col?.Null}, Default: ${initialStatus.col?.Default}).`);
    }
    console.log(`'token_version' column verified on ${tableName} with correct definition (INT NOT NULL DEFAULT 0).`);
    return { status: 'ALREADY_EXISTS', valid: true };
  }

  console.log(`Migrating ${tableName} table: Adding 'token_version' column with default 0...`);
  let alterError = null;
  try {
    await dbConn.query(`ALTER TABLE \`${tableName}\` ADD COLUMN token_version INT NOT NULL DEFAULT 0 AFTER role`);
    console.log(`Successfully executed ALTER TABLE for 'token_version' on ${tableName}.`);
  } catch (err) {
    alterError = err;
    console.log(`ALTER TABLE encountered notice: ${err.message}. Rechecking schema for concurrent migration...`);
  }

  // Re-query database schema to verify column exists and has correct definition
  let postStatus;
  try {
    postStatus = await verifyDefinition();
  } catch (recheckErr) {
    throw new Error(`FATAL: Schema recheck failed after ALTER TABLE on ${tableName}: ${recheckErr.message}`);
  }

  if (postStatus.exists && postStatus.valid) {
    if (alterError) {
      console.log(`'token_version' column on ${tableName} was added concurrently by another instance and verified successfully.`);
      return { status: 'CONCURRENTLY_RESOLVED', valid: true };
    }
    console.log(`'token_version' column creation on ${tableName} verified successfully with correct definition.`);
    return { status: 'MIGRATED', valid: true };
  }

  if (postStatus.exists && !postStatus.valid) {
    throw new Error(`FATAL: 'token_version' column exists on ${tableName} after migration but definition is incorrect.`);
  }

  throw new Error(`FATAL: Failed to migrate 'token_version' column on ${tableName}. Column remains missing: ${alterError ? alterError.message : 'Unknown DDL error'}`);
}

async function runInit() {
  console.log('--- Initializing CampusHire Database ---');
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'campushire_db';
  const useSSL = process.env.DB_SSL === 'true' || 
                 process.env.DB_PORT === '4000' || 
                 (process.env.DB_HOST && process.env.DB_HOST.includes('tidbcloud'));
  const sslConfig = useSSL ? { minVersion: 'TLSv1.2', rejectUnauthorized: false } : undefined;

  console.log(`Connecting to MySQL at ${host}:${port} as ${user}... (TLS: ${useSSL ? 'Enabled' : 'Disabled'})`);

  let rootConn;
  try {
    rootConn = await mysql.createConnection({
      host,
      port,
      user,
      password,
      multipleStatements: true,
      connectTimeout: 20000,
      ssl: sslConfig
    });
    console.log('Connected to MySQL server.');

    await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    console.log(`Database '${database}' verified.`);
    await rootConn.end();
  } catch (err) {
    console.log(`Notice during database creation step (${err.message}). Proceeding directly with target database '${database}'...`);
    if (rootConn) await rootConn.end().catch(() => {});
  }

  // Connect to target database and run schema & seed
  let dbConn;
  try {
    dbConn = await mysql.createConnection({
      host,
      port,
      user,
      password,
      database,
      multipleStatements: true,
      connectTimeout: 20000,
      ssl: sslConfig
    });

    const schemaPath = path.join(__dirname, 'schema.sql');
    const seedPath = path.join(__dirname, 'seed.sql');

    console.log('Verifying schema tables...');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await dbConn.query(schemaSql);
    console.log('Schema tables verified successfully.');

    // Migration Check: Ensure token_version column exists on users table with correct definition (INT NOT NULL DEFAULT 0)
    try {
      await verifyAndMigrateTokenVersion(dbConn, 'users');
    } catch (migErr) {
      console.error(migErr.message);
      if (dbConn) await dbConn.end().catch(() => {});
      process.exit(1);
    }

    let shouldSeed = true;
    try {
      const [existingUsers] = await dbConn.query('SELECT COUNT(*) as count FROM users');
      if (existingUsers && existingUsers[0] && existingUsers[0].count > 0) {
        console.log(`Database already populated (${existingUsers[0].count} users found). Preserving data.`);
        shouldSeed = false;
      }
    } catch (e) {
      shouldSeed = true;
    }

    if (shouldSeed) {
      console.log('Executing seed.sql with initial demo records...');
      const seedSql = fs.readFileSync(seedPath, 'utf8');
      await dbConn.query(seedSql);
      console.log('Seed data inserted successfully.');
    }

    const [users] = await dbConn.query('SELECT id, name, email, role FROM users');
    console.log('Verified Users in Database:', users.length, 'users active.');

    const [jobs] = await dbConn.query('SELECT id, title, salary_range, min_cgpa FROM jobs');
    console.log('Verified Jobs in Database:', jobs.length, 'jobs loaded.');

    await dbConn.end();
    console.log('--- Database Initialization Completed Successfully! ---');
  } catch (err) {
    console.error('Error during schema/seed execution:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  runInit();
}

module.exports = runInit;
module.exports.runInit = runInit;
module.exports.verifyAndMigrateTokenVersion = verifyAndMigrateTokenVersion;
