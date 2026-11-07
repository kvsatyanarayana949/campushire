const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const jwt = require('jsonwebtoken');
const { getJwtSecret, getJwtExpiresIn } = require('../src/config/jwt');

describe('JWT Configuration & Secret Enforcement Suite', () => {
  const originalSecret = process.env.JWT_SECRET;
  const TEST_VALID_SECRET = 'isolated_unit_test_jwt_secret_key_987654321';

  test('1. Missing JWT_SECRET: startup/configuration fails with clear fatal error', () => {
    delete process.env.JWT_SECRET;
    assert.throws(
      () => {
        getJwtSecret();
      },
      {
        name: 'Error',
        message: /FATAL: JWT_SECRET environment variable is required but is missing or empty/i
      }
    );
  });

  test('2. Empty or whitespace JWT_SECRET: startup/configuration fails with clear fatal error', () => {
    process.env.JWT_SECRET = '';
    assert.throws(
      () => {
        getJwtSecret();
      },
      {
        name: 'Error',
        message: /FATAL: JWT_SECRET environment variable is required but is missing or empty/i
      }
    );

    process.env.JWT_SECRET = '   ';
    assert.throws(
      () => {
        getJwtSecret();
      },
      {
        name: 'Error',
        message: /FATAL: JWT_SECRET environment variable is required but is missing or empty/i
      }
    );
  });

  test('3. Valid JWT_SECRET: configuration succeeds and returns trimmed secret', () => {
    process.env.JWT_SECRET = TEST_VALID_SECRET;
    const secret = getJwtSecret();
    assert.strictEqual(secret, TEST_VALID_SECRET);
  });

  test('4. Signing and verification use the same configured secret', () => {
    process.env.JWT_SECRET = TEST_VALID_SECRET;
    const activeSecret = getJwtSecret();
    const token = jwt.sign({ userId: 42, role: 'STUDENT', tokenVersion: 0 }, activeSecret, { expiresIn: '1h' });

    // Verifying with the exact same centralized getter succeeds
    const decoded = jwt.verify(token, getJwtSecret());
    assert.strictEqual(decoded.userId, 42);
    assert.strictEqual(decoded.role, 'STUDENT');
  });

  test('5. A token signed using a different secret is rejected (invalid signature)', () => {
    process.env.JWT_SECRET = TEST_VALID_SECRET;
    const attackerSecret = 'attacker_unauthorized_signing_key_999';
    const forgedToken = jwt.sign({ userId: 1, role: 'ADMIN', tokenVersion: 0 }, attackerSecret, { expiresIn: '1h' });

    assert.throws(
      () => {
        jwt.verify(forgedToken, getJwtSecret());
      },
      {
        name: 'JsonWebTokenError',
        message: 'invalid signature'
      }
    );
  });

  test('6. No hardcoded fallback remains anywhere in the backend source code', () => {
    const srcDir = path.resolve(__dirname, '../src');
    const filesToCheck = [
      path.join(srcDir, 'config/jwt.js'),
      path.join(srcDir, 'controllers/authController.js'),
      path.join(srcDir, 'controllers/adminController.js'),
      path.join(srcDir, 'middleware/auth.js'),
      path.join(srcDir, 'app.js'),
      path.join(srcDir, 'server.js')
    ];

    for (const filePath of filesToCheck) {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        assert.strictEqual(
          content.includes('campushire_secret_jwt_key'),
          false,
          `File ${filePath} must not contain hardcoded default fallback 'campushire_secret_jwt_key'`
        );
      }
    }
  });

  test('7. Secret value is never leaked in exception messages', () => {
    process.env.JWT_SECRET = '';
    try {
      getJwtSecret();
      assert.fail('Should have thrown an error');
    } catch (err) {
      assert.strictEqual(err.message.includes('campushire'), false);
      assert.strictEqual(err.message.includes('secret_key'), false);
      assert.strictEqual(err.message.includes(TEST_VALID_SECRET), false);
    }
  });

  // Cleanup: Restore environment variable
  test('Cleanup: Restore environment', () => {
    if (originalSecret) {
      process.env.JWT_SECRET = originalSecret;
    }
  });
});
