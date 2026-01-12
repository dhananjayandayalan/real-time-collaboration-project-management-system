import crypto from 'crypto';

/**
 * Generate a secure random token for password reset
 * @returns A 32-byte random token encoded as hex string
 */
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash a reset token for secure storage
 * @param token - The plain token to hash
 * @returns SHA256 hash of the token
 */
export function hashResetToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Get expiration time for reset token (1 hour from now)
 * @returns Date object representing token expiration
 */
export function getResetTokenExpiration(): Date {
  const expirationMinutes = parseInt(process.env.RESET_TOKEN_EXPIRES_IN || '60', 10);
  return new Date(Date.now() + expirationMinutes * 60 * 1000);
}
