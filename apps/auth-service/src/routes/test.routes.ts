import { Router, Request, Response } from 'express';
import { authenticateToken, optionalAuth } from '../middleware/auth.middleware';
import { authorizeRoles, checkPermission, checkOwnership } from '../middleware/rbac.middleware';
import { generalLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

/**
 * Test Routes to Demonstrate Middleware
 *
 * These routes demonstrate how different middleware work together.
 * In a real application, these would be replaced by actual feature routes.
 */

// Public route - No authentication required
router.get('/public', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'This is a public route, no authentication required',
  });
});

// Protected route - Requires authentication
router.get('/protected', authenticateToken, (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'You are authenticated!',
    user: req.user,
  });
});

// Optional auth route - Works with or without token
router.get('/optional-auth', optionalAuth, (req: Request, res: Response) => {
  if (req.user) {
    res.json({
      success: true,
      message: 'You are logged in',
      user: req.user,
    });
  } else {
    res.json({
      success: true,
      message: 'You are browsing as a guest',
    });
  }
});

// Role-based route - Requires ADMIN role
router.get(
  '/admin-only',
  authenticateToken,
  authorizeRoles(['ADMIN']),
  (req: Request, res: Response) => {
    res.json({
      success: true,
      message: 'Welcome, admin!',
      user: req.user,
    });
  }
);

// Role-based route - Requires ADMIN or MANAGER role
router.get(
  '/management',
  authenticateToken,
  authorizeRoles(['ADMIN', 'MANAGER']),
  (req: Request, res: Response) => {
    res.json({
      success: true,
      message: 'Welcome to the management area',
      user: req.user,
    });
  }
);

// Permission-based route - Requires specific permission
router.get(
  '/with-permission',
  authenticateToken,
  checkPermission('users', 'read'),
  (req: Request, res: Response) => {
    res.json({
      success: true,
      message: 'You have permission to read users',
      user: req.user,
    });
  }
);

// Ownership check route - User can only access their own profile
router.get(
  '/users/:id/profile',
  authenticateToken,
  checkOwnership('user'),
  (req: Request, res: Response) => {
    res.json({
      success: true,
      message: 'Here is your profile',
      userId: req.params.id,
      user: req.user,
    });
  }
);

// Rate limited route - For testing rate limiting
router.post('/rate-limited', generalLimiter, (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Request successful',
    rateLimitInfo: {
      limit: res.getHeader('RateLimit-Limit'),
      remaining: res.getHeader('RateLimit-Remaining'),
      reset: res.getHeader('RateLimit-Reset'),
    },
  });
});

// Get current user info (demonstrates authenticateToken usage)
router.get('/me', authenticateToken, (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Current user information',
    user: req.user,
  });
});

/**
 * How to Test These Routes:
 * ─────────────────────────
 *
 * 1. Public Route (no token needed):
 *    curl http://localhost:3001/api/test/public
 *
 * 2. Protected Route (token required):
 *    curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
 *         http://localhost:3001/api/test/protected
 *
 * 3. Without token (should fail):
 *    curl http://localhost:3001/api/test/protected
 *
 * 4. With invalid token (should fail):
 *    curl -H "Authorization: Bearer invalid-token" \
 *         http://localhost:3001/api/test/protected
 *
 * 5. Optional Auth (works both ways):
 *    curl http://localhost:3001/api/test/optional-auth
 *    curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
 *         http://localhost:3001/api/test/optional-auth
 *
 * 6. Admin Only (requires ADMIN role):
 *    curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
 *         http://localhost:3001/api/test/admin-only
 *
 * 7. Rate Limited (try multiple times quickly):
 *    for i in {1..10}; do
 *      curl -X POST http://localhost:3001/api/test/rate-limited
 *    done
 *
 * 8. Ownership Check:
 *    curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
 *         http://localhost:3001/api/test/users/YOUR_USER_ID/profile
 */

export default router;
