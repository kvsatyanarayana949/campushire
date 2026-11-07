const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const pool = require('../src/config/db');
const { getJwtSecret } = require('../src/config/jwt');
const { assertTestDatabaseSafety } = require('./testGuard');

let server;
let baseUrl;
const PORT = 5056;

const TEST_ADMIN_EMAIL = 'test.sec.admin@campushire.test';
const INITIAL_PASSWORD = 'Initial@AdminPass123';
const ROTATED_PASSWORD = 'Rotated@AdminPass456';

let testAdminUserId;
let initialAdminToken;
let rotatedAdminToken;
let studentToken;
let recruiterToken;

before(async () => {
  assertTestDatabaseSafety();
  // Start test server on distinct port to avoid collisions
  await new Promise((resolve) => {
    server = app.listen(PORT, () => {
      baseUrl = `http://localhost:${PORT}`;
      resolve();
    });
  });

  // Ensure clean state: delete test user if previously left over
  await pool.query('DELETE FROM users WHERE email = ?', [TEST_ADMIN_EMAIL]);

  // Create isolated test admin user with default token_version = 0
  const hashedPassword = await bcrypt.hash(INITIAL_PASSWORD, 10);
  const [result] = await pool.query(
    'INSERT INTO users (name, email, password, role, token_version, is_active) VALUES (?, ?, ?, ?, ?, ?)',
    ['Security Test Admin', TEST_ADMIN_EMAIL, hashedPassword, 'ADMIN', 0, 1]
  );
  testAdminUserId = result.insertId;

  // Obtain Student token for RBAC tests
  const studentLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'rohit.verma@student.edu',
      password: 'Password@123'
    })
  });
  const studentJson = await studentLoginRes.json();
  studentToken = studentJson.data.token;

  // Obtain Recruiter token for RBAC tests
  const recruiterLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'priya.sharma@nexuscloud.com',
      password: 'Password@123'
    })
  });
  const recruiterJson = await recruiterLoginRes.json();
  recruiterToken = recruiterJson.data.token;
});

after(async () => {
  // Clean up isolated test admin
  if (testAdminUserId) {
    await pool.query('DELETE FROM users WHERE id = ?', [testAdminUserId]);
  }
  await new Promise((resolve) => server.close(resolve));
  await pool.end();
});

describe('Admin Password Change & Database-Backed Token Version Security Suite', () => {
  test('1. Unauthenticated request to /api/admin/change-password is rejected (401)', async () => {
    const res = await fetch(`${baseUrl}/api/admin/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentPassword: INITIAL_PASSWORD,
        newPassword: ROTATED_PASSWORD
      })
    });

    assert.strictEqual(res.status, 401);
    const json = await res.json();
    assert.strictEqual(json.success, false);
    assert.match(json.message, /authentication required/i);
  });

  test('2. Student role cannot access /api/admin/change-password (403 RBAC)', async () => {
    const res = await fetch(`${baseUrl}/api/admin/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        currentPassword: INITIAL_PASSWORD,
        newPassword: ROTATED_PASSWORD
      })
    });

    assert.strictEqual(res.status, 403);
    const json = await res.json();
    assert.strictEqual(json.success, false);
    assert.match(json.message, /access forbidden/i);
  });

  test('3. Recruiter role cannot access /api/admin/change-password (403 RBAC)', async () => {
    const res = await fetch(`${baseUrl}/api/admin/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${recruiterToken}`
      },
      body: JSON.stringify({
        currentPassword: INITIAL_PASSWORD,
        newPassword: ROTATED_PASSWORD
      })
    });

    assert.strictEqual(res.status, 403);
    const json = await res.json();
    assert.strictEqual(json.success, false);
    assert.match(json.message, /access forbidden/i);
  });

  test('4. Test admin logs in: token contains tokenVersion = 0 and no password hash', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_ADMIN_EMAIL,
        password: INITIAL_PASSWORD
      })
    });

    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.ok(json.data.token);
    initialAdminToken = json.data.token;

    // Decode token to verify claims
    const decoded = jwt.decode(initialAdminToken);
    assert.strictEqual(decoded.tokenVersion, 0);
    assert.strictEqual(decoded.pwdKey, undefined, 'Must not contain pwdKey');
    assert.strictEqual(decoded.password, undefined, 'Must not contain password');

    // Verify initial token works on protected admin endpoint
    const checkRes = await fetch(`${baseUrl}/api/admin/dashboard`, {
      headers: { Authorization: `Bearer ${initialAdminToken}` }
    });
    assert.strictEqual(checkRes.status, 200);
  });

  test('5. Validation error: Missing required fields rejected (422)', async () => {
    const res = await fetch(`${baseUrl}/api/admin/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${initialAdminToken}`
      },
      body: JSON.stringify({})
    });

    assert.strictEqual(res.status, 422);
    const json = await res.json();
    assert.strictEqual(json.success, false);
  });

  test('6. Validation error: Weak password rejected (422)', async () => {
    const res = await fetch(`${baseUrl}/api/admin/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${initialAdminToken}`
      },
      body: JSON.stringify({
        currentPassword: INITIAL_PASSWORD,
        newPassword: 'weak'
      })
    });

    assert.strictEqual(res.status, 422);
    const json = await res.json();
    assert.strictEqual(json.success, false);
  });

  test('7. Validation error: New password identical to current password rejected (422)', async () => {
    const res = await fetch(`${baseUrl}/api/admin/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${initialAdminToken}`
      },
      body: JSON.stringify({
        currentPassword: INITIAL_PASSWORD,
        newPassword: INITIAL_PASSWORD
      })
    });

    assert.strictEqual(res.status, 422);
    const json = await res.json();
    assert.strictEqual(json.success, false);
    assert.match(json.message, /different from/i);
  });

  test('8. Failed password change does NOT increment token_version or alter stored password hash', async () => {
    // Record DB state before failed attempt
    const [beforeRows] = await pool.query(
      'SELECT password, token_version FROM users WHERE id = ?',
      [testAdminUserId]
    );
    const hashBefore = beforeRows[0].password;
    const versionBefore = beforeRows[0].token_version;
    assert.strictEqual(versionBefore, 0);

    const res = await fetch(`${baseUrl}/api/admin/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${initialAdminToken}`
      },
      body: JSON.stringify({
        currentPassword: 'WrongPassword@999',
        newPassword: ROTATED_PASSWORD
      })
    });

    assert.strictEqual(res.status, 400);
    const json = await res.json();
    assert.strictEqual(json.success, false);
    assert.match(json.message, /current password is incorrect/i);

    // Verify DB state is completely unchanged
    const [afterRows] = await pool.query(
      'SELECT password, token_version FROM users WHERE id = ?',
      [testAdminUserId]
    );
    assert.strictEqual(afterRows[0].password, hashBefore, 'Password hash must remain unchanged');
    assert.strictEqual(afterRows[0].token_version, 0, 'token_version must remain 0');

    // Existing session must still work because no password change occurred
    const checkRes = await fetch(`${baseUrl}/api/admin/dashboard`, {
      headers: { Authorization: `Bearer ${initialAdminToken}` }
    });
    assert.strictEqual(checkRes.status, 200);
  });

  test('9. Successful password change increments token_version to 1 and returns fresh JWT (200)', async () => {
    const res = await fetch(`${baseUrl}/api/admin/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${initialAdminToken}`
      },
      body: JSON.stringify({
        currentPassword: INITIAL_PASSWORD,
        newPassword: ROTATED_PASSWORD
      })
    });

    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.ok(json.data.token);
    assert.match(json.message, /updated successfully/i);
    rotatedAdminToken = json.data.token;

    // Verify token_version in database was incremented from 0 to 1
    const [afterRows] = await pool.query(
      'SELECT token_version FROM users WHERE id = ?',
      [testAdminUserId]
    );
    assert.strictEqual(afterRows[0].token_version, 1, 'token_version must be incremented to 1');

    // Verify newly issued token claims
    const decodedNew = jwt.decode(rotatedAdminToken);
    assert.strictEqual(decodedNew.tokenVersion, 1, 'New token must have tokenVersion = 1');
    assert.strictEqual(decodedNew.pwdKey, undefined);
    assert.strictEqual(decodedNew.password, undefined);
  });

  test('10. JWT Session Revocation: Old JWT token (version 0) is immediately rejected (401)', async () => {
    const res = await fetch(`${baseUrl}/api/admin/dashboard`, {
      headers: { Authorization: `Bearer ${initialAdminToken}` }
    });

    assert.strictEqual(res.status, 401);
    const json = await res.json();
    assert.strictEqual(json.success, false);
    assert.match(json.message, /session invalidated due to password change/i);
  });

  test('11. Legacy token without tokenVersion claim is also rejected (401)', async () => {
    const secret = getJwtSecret();
    const legacyToken = jwt.sign(
      { userId: testAdminUserId, role: 'ADMIN' },
      secret,
      { expiresIn: '1h' }
    );

    const res = await fetch(`${baseUrl}/api/admin/dashboard`, {
      headers: { Authorization: `Bearer ${legacyToken}` }
    });

    assert.strictEqual(res.status, 401);
    const json = await res.json();
    assert.strictEqual(json.success, false);
    assert.match(json.message, /session invalidated due to password change/i);
  });

  test('12. Newly issued JWT token (version 1) is valid and accesses protected admin routes (200)', async () => {
    const res = await fetch(`${baseUrl}/api/admin/dashboard`, {
      headers: { Authorization: `Bearer ${rotatedAdminToken}` }
    });

    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
  });

  test('13. Login with old password fails (401)', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_ADMIN_EMAIL,
        password: INITIAL_PASSWORD
      })
    });

    assert.strictEqual(res.status, 401);
    const json = await res.json();
    assert.strictEqual(json.success, false);
    assert.match(json.message, /invalid email or password/i);
  });

  test('14. Login with new password succeeds and returns token with tokenVersion = 1 (200)', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_ADMIN_EMAIL,
        password: ROTATED_PASSWORD
      })
    });

    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.ok(json.data.token);
    assert.strictEqual(json.data.user.role, 'ADMIN');

    const decoded = jwt.decode(json.data.token);
    assert.strictEqual(decoded.tokenVersion, 1);
  });

  test('15. Student & Recruiter authorization behavior remains completely unchanged', async () => {
    // Student token works on student-accessible endpoint
    const studentCheck = await fetch(`${baseUrl}/api/jobs?limit=2`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert.strictEqual(studentCheck.status, 200);

    // Student cannot access admin dashboard
    const studentAdminCheck = await fetch(`${baseUrl}/api/admin/dashboard`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert.strictEqual(studentAdminCheck.status, 403);

    // Recruiter token works on recruiter-accessible endpoint
    const recruiterCheck = await fetch(`${baseUrl}/api/recruiters/profile`, {
      headers: { Authorization: `Bearer ${recruiterToken}` }
    });
    assert.strictEqual(recruiterCheck.status, 200);

    // Recruiter cannot access admin dashboard
    const recruiterAdminCheck = await fetch(`${baseUrl}/api/admin/dashboard`, {
      headers: { Authorization: `Bearer ${recruiterToken}` }
    });
    assert.strictEqual(recruiterAdminCheck.status, 403);
  });

  test('16. Route canonicalization: redundant /api/auth/change-password does not exist (404)', async () => {
    const res = await fetch(`${baseUrl}/api/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${rotatedAdminToken}`
      },
      body: JSON.stringify({
        currentPassword: ROTATED_PASSWORD,
        newPassword: INITIAL_PASSWORD
      })
    });

    assert.strictEqual(res.status, 404);
  });

  test('17. Concurrent password-change protection: only one concurrent request succeeds and token_version increments exactly once', async () => {
    const CONCURRENT_ADMIN_EMAIL = 'concurrent.admin.sec@campushire.test';
    const CONCURRENT_INITIAL_PWD = 'Concurrent@Initial123';
    const PWD_CANDIDATE_A = 'Concurrent@Winner456';
    const PWD_CANDIDATE_B = 'Concurrent@Runner789';

    // 1. Create a dedicated test admin for concurrency test
    await pool.query('DELETE FROM users WHERE email = ?', [CONCURRENT_ADMIN_EMAIL]);
    const hashed = await bcrypt.hash(CONCURRENT_INITIAL_PWD, 10);
    const [insRes] = await pool.query(
      'INSERT INTO users (name, email, password, role, token_version, is_active) VALUES (?, ?, ?, ?, ?, ?)',
      ['Concurrent Admin', CONCURRENT_ADMIN_EMAIL, hashed, 'ADMIN', 0, 1]
    );
    const concurrentAdminId = insRes.insertId;

    try {
      // 2. Obtain valid token for this concurrent admin (token_version = 0)
      const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: CONCURRENT_ADMIN_EMAIL, password: CONCURRENT_INITIAL_PWD })
      });
      const loginJson = await loginRes.json();
      assert.strictEqual(loginRes.status, 200);
      const concurrentToken = loginJson.data.token;

      // 3. Dispatch two concurrent password change requests simultaneously
      const [resA, resB] = await Promise.all([
        fetch(`${baseUrl}/api/admin/change-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${concurrentToken}`
          },
          body: JSON.stringify({
            currentPassword: CONCURRENT_INITIAL_PWD,
            newPassword: PWD_CANDIDATE_A
          })
        }),
        fetch(`${baseUrl}/api/admin/change-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${concurrentToken}`
          },
          body: JSON.stringify({
            currentPassword: CONCURRENT_INITIAL_PWD,
            newPassword: PWD_CANDIDATE_B
          })
        })
      ]);

      const jsonA = await resA.json();
      const jsonB = await resB.json();

      // Exactly ONE request must succeed (200), and the other must be rejected (400 or 409)
      const statuses = [resA.status, resB.status];
      assert.ok(statuses.includes(200), 'At least one request must succeed with 200');
      assert.ok(
        statuses.includes(400) || statuses.includes(409),
        'The conflicting request must be rejected with 400 or 409'
      );
      assert.strictEqual(statuses.filter(s => s === 200).length, 1, 'Only one request can succeed');

      // Verify the winning request received a fresh token with tokenVersion = 1
      const winningJson = resA.status === 200 ? jsonA : jsonB;
      assert.ok(winningJson.data.token);
      const decodedWinningToken = jwt.decode(winningJson.data.token);
      assert.strictEqual(decodedWinningToken.tokenVersion, 1);

      // Verify database state: token_version incremented EXACTLY ONCE (from 0 to 1)
      const [dbRows] = await pool.query(
        'SELECT token_version FROM users WHERE id = ?',
        [concurrentAdminId]
      );
      assert.strictEqual(dbRows[0].token_version, 1, 'token_version must increment exactly once');

      // Verify that the initial token (version 0) is now completely invalidated
      const oldCheckRes = await fetch(`${baseUrl}/api/admin/dashboard`, {
        headers: { Authorization: `Bearer ${concurrentToken}` }
      });
      assert.strictEqual(oldCheckRes.status, 401);
    } finally {
      // Clean up concurrent test admin
      await pool.query('DELETE FROM users WHERE id = ?', [concurrentAdminId]);
    }
  });
});
