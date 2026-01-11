# Authentication & Authorization Middleware Guide

This guide explains how to use the authentication and authorization middleware in our application.

## Table of Contents

1. [Overview](#overview)
2. [Authentication Middleware](#authentication-middleware)
3. [Authorization Middleware (RBAC)](#authorization-middleware-rbac)
4. [Rate Limiting](#rate-limiting)
5. [Usage Examples](#usage-examples)
6. [Testing](#testing)
7. [Best Practices](#best-practices)

---

## Overview

Our application uses several middleware layers to secure endpoints:

```
┌─────────────────────────────────────────────────────────┐
│ REQUEST FLOW                                            │
└─────────────────────────────────────────────────────────┘

Client Request
      ↓
┌─────────────────┐
│ Rate Limiting   │ ← Prevents abuse
└────────┬────────┘
         ↓
┌─────────────────┐
│ Authentication  │ ← Verifies JWT token
└────────┬────────┘
         ↓
┌─────────────────┐
│ Authorization   │ ← Checks roles/permissions
└────────┬────────┘
         ↓
┌─────────────────┐
│ Controller      │ ← Handles business logic
└─────────────────┘
```

### Middleware Types

| Middleware | Purpose | Location |
|------------|---------|----------|
| `authenticateToken` | Verify JWT token | `middleware/auth.middleware.ts` |
| `optionalAuth` | Optional token verification | `middleware/auth.middleware.ts` |
| `authorizeRoles` | Check user roles | `middleware/rbac.middleware.ts` |
| `checkPermission` | Check specific permissions | `middleware/rbac.middleware.ts` |
| `checkOwnership` | Verify resource ownership | `middleware/rbac.middleware.ts` |
| `authLimiter` | Rate limit auth endpoints | `middleware/rateLimiter.middleware.ts` |
| `generalLimiter` | Rate limit general APIs | `middleware/rateLimiter.middleware.ts` |

---

## Authentication Middleware

### 1. `authenticateToken`

**Purpose:** Verifies JWT token and attaches user info to request.

**How it works:**
```typescript
// 1. Extracts token from Authorization header
const authHeader = req.headers.authorization;
// Expected: "Bearer eyJhbGci..."

// 2. Verifies token signature and expiration
const decoded = verifyAccessToken(token);

// 3. Attaches user to request
req.user = { userId: "...", email: "..." };

// 4. Calls next middleware
next();
```

**Usage:**
```typescript
import { authenticateToken } from '../middleware/auth.middleware';

// Protected route - requires authentication
router.get('/profile', authenticateToken, (req, res) => {
  res.json({
    user: req.user  // Available after authenticateToken
  });
});
```

**Responses:**

Success (passes to next middleware):
```json
// req.user is now available
{
  "userId": "281227a0-a6b4-4ca4-9aa2-6457c310e741",
  "email": "user@example.com"
}
```

Failure (401 Unauthorized):
```json
// No token provided
{
  "success": false,
  "message": "Access token is required"
}

// Invalid token format
{
  "success": false,
  "message": "Invalid token format. Expected: Bearer <token>"
}

// Token expired
{
  "success": false,
  "message": "Token expired",
  "code": "TOKEN_EXPIRED"
}

// Invalid token
{
  "success": false,
  "message": "Invalid token",
  "code": "INVALID_TOKEN"
}
```

---

### 2. `optionalAuth`

**Purpose:** Authenticates if token is present, but doesn't fail if absent.

**Use Case:** Endpoints that work with or without authentication (e.g., public content that shows extra info for logged-in users).

**Usage:**
```typescript
import { optionalAuth } from '../middleware/auth.middleware';

router.get('/posts', optionalAuth, (req, res) => {
  if (req.user) {
    // User is authenticated - show personalized content
    const posts = await getPostsWithLikes(req.user.userId);
  } else {
    // User is guest - show public content only
    const posts = await getPublicPosts();
  }

  res.json({ posts });
});
```

---

## Authorization Middleware (RBAC)

### 1. `authorizeRoles`

**Purpose:** Checks if user has one of the required roles.

**How it works:**
```typescript
// 1. Fetches user's roles from database
const userRoles = await getUserRoles(req.user.userId);
// Example: ["DEVELOPER", "VIEWER"]

// 2. Checks if user has any required role
const hasRequiredRole = allowedRoles.some(role => userRoles.includes(role));

// 3. Allows or denies access
if (hasRequiredRole) {
  next();  // Proceed
} else {
  res.status(403);  // Forbidden
}
```

**Usage:**
```typescript
import { authenticateToken } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/rbac.middleware';

// Only ADMIN can access
router.delete(
  '/users/:id',
  authenticateToken,
  authorizeRoles(['ADMIN']),
  deleteUserController
);

// ADMIN or MANAGER can access
router.post(
  '/projects',
  authenticateToken,
  authorizeRoles(['ADMIN', 'MANAGER']),
  createProjectController
);

// Multiple roles allowed
router.get(
  '/reports',
  authenticateToken,
  authorizeRoles(['ADMIN', 'MANAGER', 'ANALYST']),
  getReportsController
);
```

**Responses:**

Success (passes to next middleware):
```
// User has required role, continues to controller
```

Failure (403 Forbidden):
```json
{
  "success": false,
  "message": "Insufficient permissions",
  "required": ["ADMIN"],
  "current": ["DEVELOPER", "VIEWER"]
}
```

---

### 2. `checkPermission`

**Purpose:** Checks if user has a specific permission (more granular than roles).

**How it works:**
```typescript
// 1. Fetches user's roles and their permissions
const permissions = await getUserPermissions(req.user.userId);
// Example: [
//   { resource: "projects", action: "create" },
//   { resource: "projects", action: "read" },
//   { resource: "tasks", action: "update" }
// ]

// 2. Checks for specific permission
const hasPermission = permissions.some(
  p => p.resource === "projects" && p.action === "create"
);

// 3. Allows or denies
if (hasPermission) next();
else res.status(403);
```

**Usage:**
```typescript
import { checkPermission } from '../middleware/rbac.middleware';

// User needs "projects:create" permission
router.post(
  '/projects',
  authenticateToken,
  checkPermission('projects', 'create'),
  createProjectController
);

// User needs "users:delete" permission
router.delete(
  '/users/:id',
  authenticateToken,
  checkPermission('users', 'delete'),
  deleteUserController
);

// Different permissions for different actions
router.get(
  '/tasks',
  authenticateToken,
  checkPermission('tasks', 'read'),
  getTasksController
);

router.post(
  '/tasks',
  authenticateToken,
  checkPermission('tasks', 'create'),
  createTaskController
);
```

**Permission Structure:**

In the database:
```sql
-- Permissions table
permissions:
  - { resource: "projects", action: "create" }
  - { resource: "projects", action: "read" }
  - { resource: "projects", action: "update" }
  - { resource: "projects", action: "delete" }
  - { resource: "tasks", action: "create" }
  - { resource: "tasks", action: "read" }
  ...

-- Role-Permission mapping
ADMIN role has:
  - All permissions

MANAGER role has:
  - projects:* (all project permissions)
  - tasks:create, tasks:read, tasks:update

DEVELOPER role has:
  - tasks:* (all task permissions)
  - projects:read

VIEWER role has:
  - projects:read
  - tasks:read
```

**Responses:**

Failure (403 Forbidden):
```json
{
  "success": false,
  "message": "Insufficient permissions",
  "required": {
    "resource": "projects",
    "action": "delete"
  }
}
```

---

### 3. `checkOwnership`

**Purpose:** Ensures users can only access/modify their own resources.

**Usage:**
```typescript
import { checkOwnership } from '../middleware/rbac.middleware';

// User can only update their own profile
router.patch(
  '/users/:id',
  authenticateToken,
  checkOwnership('user'),
  updateProfileController
);

// Custom param name
router.patch(
  '/profiles/:profileId',
  authenticateToken,
  checkOwnership('user', 'profileId'),
  updateProfileController
);
```

**How it works:**
```typescript
// 1. Extracts resource ID from params
const resourceId = req.params.id;  // or req.params[paramName]

// 2. Checks if it matches authenticated user
if (resourceId !== req.user.userId) {
  res.status(403).json({
    message: "You can only access your own profile"
  });
}
```

---

## Rate Limiting

### Available Rate Limiters

| Limiter | Limit | Window | Use Case |
|---------|-------|--------|----------|
| `generalLimiter` | 100 requests | 15 min | General API endpoints |
| `authLimiter` | 5 requests | 15 min | Login, register |
| `passwordResetLimiter` | 3 requests | 1 hour | Password reset |
| `refreshTokenLimiter` | 10 requests | 15 min | Token refresh |

### 1. `authLimiter`

**Purpose:** Prevents brute force attacks on authentication endpoints.

**Usage:**
```typescript
import { authLimiter } from '../middleware/rateLimiter.middleware';

router.post('/login', authLimiter, loginController);
router.post('/register', authLimiter, registerController);
```

**How it works:**
```
Request 1: ✓ Allowed (1/5)
Request 2: ✓ Allowed (2/5)
Request 3: ✓ Allowed (3/5)
Request 4: ✓ Allowed (4/5)
Request 5: ✓ Allowed (5/5)
Request 6: ❌ BLOCKED (rate limit exceeded)
...
After 15 minutes: Window resets, back to 0/5
```

**Response when rate limited:**
```json
{
  "success": false,
  "message": "Too many authentication attempts from this IP, please try again after 15 minutes.",
  "retryAfter": 900
}
```

**HTTP Status:** 429 Too Many Requests

---

### 2. `generalLimiter`

**Purpose:** Prevents API abuse on regular endpoints.

**Usage:**
```typescript
import { generalLimiter } from '../middleware/rateLimiter.middleware';

// Apply to all API routes
app.use('/api', generalLimiter);

// Or specific routes
router.get('/data', generalLimiter, getDataController);
```

---

### 3. `passwordResetLimiter`

**Purpose:** Prevents password reset abuse and email enumeration.

**Usage:**
```typescript
import { passwordResetLimiter } from '../middleware/rateLimiter.middleware';

router.post('/forgot-password', passwordResetLimiter, forgotPasswordController);
router.post('/reset-password', passwordResetLimiter, resetPasswordController);
```

---

### 4. `refreshTokenLimiter`

**Purpose:** Prevents refresh token endpoint abuse.

**Usage:**
```typescript
import { refreshTokenLimiter } from '../middleware/rateLimiter.middleware';

router.post('/refresh', refreshTokenLimiter, refreshTokenController);
```

---

### Rate Limit Headers

Clients receive information about rate limits in response headers:

```
RateLimit-Policy: 100;w=900       ← 100 requests per 900 seconds
RateLimit-Limit: 100              ← Total requests allowed
RateLimit-Remaining: 95           ← Requests remaining
RateLimit-Reset: 900              ← Seconds until reset
```

---

## Usage Examples

### Example 1: Public Endpoint

```typescript
// No middleware needed
router.get('/public/posts', getPublicPostsController);
```

### Example 2: Authenticated Endpoint

```typescript
// Requires valid JWT token
router.get('/profile', authenticateToken, getProfileController);
```

### Example 3: Role-Based Endpoint

```typescript
// Requires authentication + ADMIN role
router.delete(
  '/users/:id',
  authenticateToken,
  authorizeRoles(['ADMIN']),
  deleteUserController
);
```

### Example 4: Permission-Based Endpoint

```typescript
// Requires authentication + specific permission
router.post(
  '/projects',
  authenticateToken,
  checkPermission('projects', 'create'),
  createProjectController
);
```

### Example 5: Multiple Middleware

```typescript
// Combines rate limiting, authentication, and authorization
router.post(
  '/admin/config',
  authLimiter,                      // 1. Rate limit
  authenticateToken,                 // 2. Verify token
  authorizeRoles(['ADMIN']),         // 3. Check role
  updateConfigController            // 4. Handle request
);
```

### Example 6: Complex Authorization

```typescript
// User must be authenticated AND (ADMIN OR owner of resource)
router.patch(
  '/projects/:id',
  authenticateToken,
  async (req, res, next) => {
    // Check if user is admin
    const userRoles = await getUserRoles(req.user.userId);
    if (userRoles.includes('ADMIN')) {
      return next();  // Admin can edit any project
    }

    // Check if user owns the project
    const project = await getProject(req.params.id);
    if (project.ownerId === req.user.userId) {
      return next();  // Owner can edit their project
    }

    // Neither admin nor owner
    res.status(403).json({ message: 'Insufficient permissions' });
  },
  updateProjectController
);
```

---

## Testing

### Test Endpoints

Test routes are available at `/api/test/*`:

```bash
# Public route
curl http://localhost:3001/api/test/public

# Protected route (requires token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3001/api/test/protected

# Optional auth
curl http://localhost:3001/api/test/optional-auth
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3001/api/test/optional-auth

# Admin only
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3001/api/test/admin-only

# Management (ADMIN or MANAGER)
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3001/api/test/management

# Permission check
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3001/api/test/with-permission

# Ownership check
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3001/api/test/users/YOUR_USER_ID/profile

# Rate limiting (try multiple times)
for i in {1..10}; do
  curl -X POST http://localhost:3001/api/test/rate-limited
done
```

### Test Scenarios

#### Scenario 1: Successful Authentication
```bash
# 1. Login to get token
TOKEN=$(curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}' \
  | jq -r '.data.accessToken')

# 2. Use token to access protected route
curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:3001/api/test/protected
```

#### Scenario 2: Token Expired
```bash
# Use an old/expired token
curl -H "Authorization: Bearer EXPIRED_TOKEN" \
     http://localhost:3001/api/test/protected

# Response:
# {
#   "success": false,
#   "message": "Token expired",
#   "code": "TOKEN_EXPIRED"
# }

# Solution: Use refresh token to get new access token
curl -X POST http://localhost:3001/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"YOUR_REFRESH_TOKEN"}'
```

#### Scenario 3: Insufficient Permissions
```bash
# User tries to access admin-only endpoint
curl -H "Authorization: Bearer USER_TOKEN" \
     http://localhost:3001/api/test/admin-only

# Response:
# {
#   "success": false,
#   "message": "Insufficient permissions",
#   "required": ["ADMIN"],
#   "current": ["DEVELOPER"]
# }
```

#### Scenario 4: Rate Limit Exceeded
```bash
# Try to login 6 times (limit is 5)
for i in {1..6}; do
  curl -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
done

# 6th request response:
# {
#   "success": false,
#   "message": "Too many authentication attempts from this IP, please try again after 15 minutes.",
#   "retryAfter": 900
# }
```

---

## Best Practices

### 1. Order of Middleware Matters

**Correct Order:**
```typescript
router.post(
  '/endpoint',
  rateLimiter,        // 1. Block abusers first
  authenticateToken,  // 2. Verify identity
  authorizeRoles,     // 3. Check permissions
  controller         // 4. Business logic
);
```

**Why?**
- Rate limiting first: Don't waste resources on blocked IPs
- Authentication next: Don't check roles for unauthenticated users
- Authorization last: Only check after identity is confirmed

---

### 2. Choose the Right Middleware

| Requirement | Use This |
|------------|----------|
| "Only logged-in users" | `authenticateToken` |
| "Only admins" | `authenticateToken` + `authorizeRoles(['ADMIN'])` |
| "Only if user can create projects" | `authenticateToken` + `checkPermission('projects', 'create')` |
| "Only the owner" | `authenticateToken` + `checkOwnership('resource')` |
| "Works with or without login" | `optionalAuth` |
| "Prevent abuse" | Rate limiter |

---

### 3. Error Handling

Always handle middleware errors gracefully:

```typescript
// Bad
router.get('/data', authenticateToken, (req, res) => {
  // What if authenticateToken failed?
  const data = getData(req.user.userId);  // ❌ req.user might be undefined
  res.json(data);
});

// Good
router.get('/data', authenticateToken, (req, res) => {
  // authenticateToken ensures req.user exists
  // If token is invalid, middleware returns 401 before reaching here
  const data = getData(req.user.userId);  // ✅ Safe
  res.json(data);
});
```

---

### 4. Don't Over-Protect

```typescript
// Bad - too much middleware for simple endpoints
router.get(
  '/public-info',
  rateLimiter,
  authenticateToken,      // ❌ Unnecessary for public data
  authorizeRoles(['ALL']), // ❌ Everyone can access anyway
  getPublicInfoController
);

// Good - only what's needed
router.get(
  '/public-info',
  rateLimiter,  // ✅ Just rate limiting
  getPublicInfoController
);
```

---

### 5. Combine Middleware Efficiently

Create reusable middleware combinations:

```typescript
// middleware/combinations.ts

import { authenticateToken } from './auth.middleware';
import { authorizeRoles } from './rbac.middleware';
import { authLimiter } from './rateLimiter.middleware';

// Common combinations
export const adminOnly = [
  authenticateToken,
  authorizeRoles(['ADMIN'])
];

export const managerOrAdmin = [
  authenticateToken,
  authorizeRoles(['ADMIN', 'MANAGER'])
];

export const secureAuth = [
  authLimiter,
  authenticateToken
];

// Usage
import { adminOnly, secureAuth } from './middleware/combinations';

router.delete('/users/:id', ...adminOnly, deleteUserController);
router.post('/login', ...secureAuth, loginController);
```

---

### 6. Testing Middleware

Always test your protected endpoints:

```typescript
// tests/middleware.test.ts

describe('Authentication Middleware', () => {
  it('should reject requests without token', async () => {
    const res = await request(app)
      .get('/api/test/protected')
      .expect(401);

    expect(res.body.message).toBe('Access token is required');
  });

  it('should accept requests with valid token', async () => {
    const token = await getValidToken();

    const res = await request(app)
      .get('/api/test/protected')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.user).toBeDefined();
  });

  it('should reject expired tokens', async () => {
    const expiredToken = generateExpiredToken();

    const res = await request(app)
      .get('/api/test/protected')
      .set('Authorization', `Bearer ${expiredToken}`)
      .expect(401);

    expect(res.body.code).toBe('TOKEN_EXPIRED');
  });
});
```

---

## Summary

### Middleware Checklist

When creating a new endpoint, ask:

- [ ] Does it need authentication? → Use `authenticateToken`
- [ ] Does it need role-based access? → Add `authorizeRoles(['ROLE'])`
- [ ] Does it need specific permissions? → Add `checkPermission('resource', 'action')`
- [ ] Should only the owner access it? → Add `checkOwnership('resource')`
- [ ] Is it sensitive (login, register)? → Add rate limiting
- [ ] Can it work without auth? → Use `optionalAuth`

### Quick Reference

```typescript
// Public endpoint
router.get('/public', controller);

// Authenticated endpoint
router.get('/protected', authenticateToken, controller);

// Role-based endpoint
router.get('/admin', authenticateToken, authorizeRoles(['ADMIN']), controller);

// Permission-based endpoint
router.post('/create', authenticateToken, checkPermission('resource', 'create'), controller);

// Ownership-based endpoint
router.patch('/users/:id', authenticateToken, checkOwnership('user'), controller);

// Rate-limited auth endpoint
router.post('/login', authLimiter, controller);

// Optional authentication
router.get('/feed', optionalAuth, controller);

// Combined middleware
router.post(
  '/sensitive',
  rateLimiter,
  authenticateToken,
  authorizeRoles(['ADMIN']),
  controller
);
```

---

**Next Steps:** Continue to Phase 1, Task 4 (Password Management) or explore the JWT explanation in `JWT_EXPLAINED.md`.
