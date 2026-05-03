import { describe, it, expect, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../../middleware/auth.middleware';
import {
  requirePermission,
  authorizeRoles,
  checkPermission,
} from '../../middleware/rbac.middleware';
import {
  createTestUser,
  createRoleWithPermissions,
  assignRoleToUser,
  generateTokensForUser,
} from '../utils/testHelpers';

describe('Middleware Tests', () => {
  describe('authenticateToken', () => {
    it('should authenticate valid token', async () => {
      const user = await createTestUser();
      const { accessToken } = generateTokensForUser(user.id, user.email);

      const req = {
        headers: { authorization: `Bearer ${accessToken}` },
      } as Request;

      const res = {} as Response;
      const next = vi.fn() as unknown as NextFunction;

      await authenticateToken(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user?.userId).toBe(user.id);
    });

    it('should reject missing token', async () => {
      const req = { headers: {} } as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as unknown as NextFunction;

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject invalid token', async () => {
      const req = {
        headers: { authorization: 'Bearer invalid-token' },
      } as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as unknown as NextFunction;

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requirePermission', () => {
    it('should allow access with required permission', async () => {
      const { role } = await createRoleWithPermissions('ADMIN', [
        'user:read',
      ]);
      const user = await createTestUser();
      await assignRoleToUser(user.id, role.id);

      const middleware = requirePermission('user:read');

      const req = { user: { userId: user.id, email: user.email } } as Request;
      const res = {} as Response;
      const next = vi.fn() as unknown as NextFunction;

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should deny access without required permission', async () => {
      const user = await createTestUser();

      const middleware = requirePermission('user:delete');

      const req = { user: { userId: user.id, email: user.email } } as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as unknown as NextFunction;

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('authorizeRoles', () => {
    it('should allow access with required role', async () => {
      const { role } = await createRoleWithPermissions('ADMIN', []);
      const user = await createTestUser();
      await assignRoleToUser(user.id, role.id);

      const middleware = authorizeRoles(['ADMIN']);

      const req = { user: { userId: user.id, email: user.email } } as Request;
      const res = {} as Response;
      const next = vi.fn() as unknown as NextFunction;

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should deny access without required role', async () => {
      const user = await createTestUser();

      const middleware = authorizeRoles(['ADMIN']);

      const req = { user: { userId: user.id, email: user.email } } as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as unknown as NextFunction;

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow access if user has any of the required roles', async () => {
      const { role } = await createRoleWithPermissions('MANAGER', []);
      const user = await createTestUser();
      await assignRoleToUser(user.id, role.id);

      const middleware = authorizeRoles(['ADMIN', 'MANAGER']);

      const req = { user: { userId: user.id, email: user.email } } as Request;
      const res = {} as Response;
      const next = vi.fn() as unknown as NextFunction;

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('checkPermission', () => {
    it('should allow access with required permission by resource and action', async () => {
      const { role } = await createRoleWithPermissions('ADMIN', ['user:read']);
      const user = await createTestUser();
      await assignRoleToUser(user.id, role.id);

      const middleware = checkPermission('user', 'read');

      const req = { user: { userId: user.id, email: user.email } } as Request;
      const res = {} as Response;
      const next = vi.fn() as unknown as NextFunction;

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should deny access without required permission', async () => {
      const user = await createTestUser();

      const middleware = checkPermission('user', 'delete');

      const req = { user: { userId: user.id, email: user.email } } as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as unknown as NextFunction;

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });
});