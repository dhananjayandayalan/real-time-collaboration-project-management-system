import { describe, it, expect, beforeAll } from 'vitest';
import express, { Express } from 'express';
import request from 'supertest';
import roleRoutes from '../../routes/role.routes';
import {
  createTestUser,
  createTestRole,
  createRoleWithPermissions,
  generateTokensForUser,
} from '../utils/testHelpers';

describe('Role Routes Integration Tests', () => {
  let app: Express;
  let adminToken: string;
  let userWithoutPermission: any;
  let userWithoutPermissionToken: string;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use('/api/roles', roleRoutes);

    // Create admin user with role:read permission
    const { role: adminRole } = await createRoleWithPermissions(
      'ADMIN',
      ['role:read', 'role:create', 'role:assign']
    );
    const adminUser = await createTestUser({ email: 'admin@test.com' });
    await (
      await import('../utils/testHelpers')
    ).assignRoleToUser(adminUser.id, adminRole.id);
    adminToken = generateTokensForUser(adminUser.id, adminUser.email).accessToken;

    // Create user without permissions
    userWithoutPermission = await createTestUser({ email: 'user@test.com' });
    userWithoutPermissionToken = generateTokensForUser(
      userWithoutPermission.id,
      userWithoutPermission.email
    ).accessToken;
  });

  describe('GET /api/roles', () => {
    it('should return all roles for authorized user', async () => {
      await createTestRole({ name: 'TEST_ROLE_1' });
      await createTestRole({ name: 'TEST_ROLE_2' });

      const response = await request(app)
        .get('/api/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return 403 for user without permission', async () => {
      const response = await request(app)
        .get('/api/roles')
        .set('Authorization', `Bearer ${userWithoutPermissionToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Insufficient permissions');
    });

    it('should return 401 without authentication', async () => {
      await request(app).get('/api/roles').expect(401);
    });
  });

  describe('POST /api/roles', () => {
    it('should create a new role for authorized user', async () => {
      const response = await request(app)
        .post('/api/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'NEW_ROLE',
          description: 'A new test role',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('NEW_ROLE');
    });

    it('should return 403 for user without permission', async () => {
      const response = await request(app)
        .post('/api/roles')
        .set('Authorization', `Bearer ${userWithoutPermissionToken}`)
        .send({
          name: 'UNAUTHORIZED_ROLE',
          description: 'Should fail',
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid data', async () => {
      const response = await request(app)
        .post('/api/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'A', // Too short
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/roles/assign', () => {
    it('should assign role to user for authorized user', async () => {
      const user = await createTestUser({ email: 'assign@test.com' });
      const role = await createTestRole({ name: 'ASSIGNABLE_ROLE' });

      const response = await request(app)
        .post('/api/roles/assign')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: user.id,
          roleId: role.id,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.userId).toBe(user.id);
      expect(response.body.data.roleId).toBe(role.id);
    });

    it('should return 403 for user without permission', async () => {
      const user = await createTestUser({ email: 'user2@test.com' });
      const role = await createTestRole({ name: 'ROLE2' });

      const response = await request(app)
        .post('/api/roles/assign')
        .set('Authorization', `Bearer ${userWithoutPermissionToken}`)
        .send({
          userId: user.id,
          roleId: role.id,
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });
});