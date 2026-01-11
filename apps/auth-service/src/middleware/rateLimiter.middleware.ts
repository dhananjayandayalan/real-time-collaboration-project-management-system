import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * Rate Limiting Configuration
 *
 * Rate limiting prevents abuse by limiting the number of requests
 * a client can make in a given time window.
 *
 * Why it's important:
 * - Prevents brute force attacks on login/register
 * - Protects against DoS attacks
 * - Ensures fair resource usage
 * - Prevents automated bots from abusing APIs
 */

/**
 * General API Rate Limiter
 *
 * Limits: 100 requests per 15 minutes per IP
 * Applied to all API endpoints by default
 *
 * Usage:
 * app.use('/api', generalLimiter);
 */
export const generalLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // Limit each IP to 100 requests per window
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
  // Skip rate limiting for successful requests (optional)
  skipSuccessfulRequests: false,
  // Skip rate limiting for failed requests (optional)
  skipFailedRequests: false,
});

/**
 * Strict Rate Limiter for Authentication Endpoints
 *
 * Limits: 5 requests per 15 minutes per IP
 * Applied to login, register, and password reset endpoints
 *
 * Why stricter?
 * - Login/register are prime targets for brute force attacks
 * - An attacker might try to guess passwords
 * - Or flood the system with fake registrations
 * - 5 attempts in 15 min is reasonable for legitimate users
 *
 * Usage:
 * app.post('/api/auth/login', authLimiter, controller);
 * app.post('/api/auth/register', authLimiter, controller);
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes.',
  },
  // Don't skip any requests for auth endpoints
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts from this IP, please try again after 15 minutes.',
      retryAfter: 15 * 60, // seconds
    });
  },
});

/**
 * Password Reset Rate Limiter
 *
 * Limits: 3 requests per hour per IP
 * Applied to forgot password and reset password endpoints
 *
 * Why even stricter?
 * - Password reset can be abused to spam users
 * - Or to enumerate valid email addresses
 * - 3 attempts per hour is generous for legitimate use
 *
 * Usage:
 * app.post('/api/auth/forgot-password', passwordResetLimiter, controller);
 * app.post('/api/auth/reset-password', passwordResetLimiter, controller);
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 requests per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again after 1 hour.',
  },
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Too many password reset attempts from this IP, please try again after 1 hour.',
      retryAfter: 60 * 60, // seconds
    });
  },
});

/**
 * Refresh Token Rate Limiter
 *
 * Limits: 10 requests per 15 minutes per IP
 * Applied to token refresh endpoint
 *
 * Why?
 * - Normal users shouldn't need to refresh tokens frequently
 * - Access tokens last 15 minutes, so refreshing 10 times per 15 min is generous
 * - Prevents abuse of refresh token endpoint
 *
 * Usage:
 * app.post('/api/auth/refresh', refreshTokenLimiter, controller);
 */
export const refreshTokenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many token refresh requests, please try again later.',
  },
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Too many token refresh attempts from this IP, please try again later.',
      retryAfter: 15 * 60, // seconds
    });
  },
});

/**
 * How Rate Limiting Works:
 * ────────────────────────
 *
 * Example: authLimiter (5 requests per 15 min)
 *
 * Request 1 (0:00): ✓ Allowed (1/5)
 * Request 2 (0:01): ✓ Allowed (2/5)
 * Request 3 (0:02): ✓ Allowed (3/5)
 * Request 4 (0:03): ✓ Allowed (4/5)
 * Request 5 (0:04): ✓ Allowed (5/5)
 * Request 6 (0:05): ❌ BLOCKED (rate limit exceeded)
 * Request 7 (0:10): ❌ BLOCKED (still within 15 min window)
 * Request 8 (15:01): ✓ Allowed (window reset, back to 1/5)
 *
 * Headers sent to client:
 * ────────────────────────
 * RateLimit-Limit: 5              ← Total allowed in window
 * RateLimit-Remaining: 3          ← Requests left
 * RateLimit-Reset: 1680001500     ← When window resets (timestamp)
 *
 * When rate limit exceeded:
 * ─────────────────────────
 * Status: 429 Too Many Requests
 * Body: { message: "Too many attempts...", retryAfter: 900 }
 *
 * Security Benefits:
 * ──────────────────
 * ✓ Prevents brute force password attacks
 * ✓ Prevents account enumeration
 * ✓ Prevents DoS attacks
 * ✓ Ensures fair API usage
 * ✓ Protects server resources
 */

/**
 * Create a custom rate limiter
 *
 * Use this to create rate limiters for specific endpoints
 *
 * Example:
 * const customLimiter = createRateLimiter({
 *   windowMs: 60000,     // 1 minute
 *   max: 10,             // 10 requests
 *   message: 'Slow down!'
 * });
 */
export const createRateLimiter = (options: {
  windowMs: number;
  max: number;
  message: string;
}) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: options.message,
    },
  });
};
