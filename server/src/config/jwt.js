/**
 * Centralized JWT Configuration & Enforcement
 * Ensures JWT_SECRET is strictly configured without insecure defaults or fallbacks.
 */

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || typeof secret !== 'string' || secret.trim() === '') {
    throw new Error('FATAL: JWT_SECRET environment variable is required but is missing or empty.');
  }
  return secret.trim();
};

const getJwtExpiresIn = () => {
  return process.env.JWT_EXPIRES_IN || '7d';
};

module.exports = {
  getJwtSecret,
  getJwtExpiresIn
};
