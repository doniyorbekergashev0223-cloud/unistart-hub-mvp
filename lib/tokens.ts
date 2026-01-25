import crypto from 'crypto'

/**
 * Token generation utilities for password reset.
 * Uses cryptographically secure random generation.
 */

/**
 * Generates a secure 6-digit numeric code for password reset.
 * Uses crypto.randomInt for cryptographically secure generation.
 */
export function generateResetCode(): string {
  // Generate a random 6-digit number (100000 to 999999)
  const min = 100000
  const max = 999999
  const code = crypto.randomInt(min, max + 1)
  return code.toString()
}

/**
 * Generates a secure random token string for password reset.
 * Uses crypto.randomBytes for cryptographically secure generation.
 */
export function generateResetToken(): string {
  // Generate 32 random bytes and convert to hex (64 characters)
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Hashes a reset token using SHA-256.
 * This allows storing tokens securely in the database.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

/**
 * Verifies a reset token against a stored hash.
 */
export function verifyToken(token: string, hash: string): boolean {
  const tokenHash = hashToken(token)
  return tokenHash === hash
}
