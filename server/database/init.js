require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function runInit() {
  console.log('--- Initializing CampusHire Database ---');
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'campushire_db';

  console.log(`Connecting to MySQL at ${host}:${port} as ${user}...`);

  let rootConn;
  try {
    rootConn = await mysql.createConnection({
      host,
      port,
      user,
      password,
      multipleStatements: true,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
    });
    console.log('Connected to MySQL server.');

    await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    console.log(`Database '${database}' verified.`);
    await rootConn.end();
  } catch (err) {
    console.error('Failed to connect to MySQL server:', err.message);
    process.exit(1);
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
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
    });

    const schemaPath = path.join(__dirname, 'schema.sql');
    const seedPath = path.join(__dirname, 'seed.sql');

    console.log('Executing schema.sql...');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await dbConn.query(schemaSql);
    console.log('Schema tables created successfully.');

    console.log('Executing seed.sql with demo records...');
    const seedSql = fs.readFileSync(seedPath, 'utf8');
    await dbConn.query(seedSql);
    console.log('Seed data inserted successfully.');

    const [users] = await dbConn.query('SELECT id, name, email, role FROM users');
    console.log('Verified Users in Database:', users);

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
