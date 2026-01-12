import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express, { Express } from 'express';
import request from 'supertest';
import authRoutes from '../../routes/auth.routes';
import { createTestUser, generateTokensForUser } from '../utils/testHelpers';
import { prisma } from '../setup';
import redisClient from '../../config/redis';

describe('Auth Routes Integration Tests', () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
  });

  afterAll(async () => {
    await redisClient.quit();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'newuser@test.com',
        password: 'SecurePass@123',
        firstName: 'John',
        lastName: 'Doe',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.user.email).toBe(userData.email);
    });

    it('should return 400 for invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'SecurePass@123',
          firstName: 'John',
          lastName: 'Doe',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation error');
    });

    it('should return 400 for short password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@test.com',
          password: 'short',
          firstName: 'John',
          lastName: 'Doe',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should return 400 for duplicate email', async () => {
      const email = 'duplicate@test.com';
      await createTestUser({ email });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email,
          password: 'SecurePass@123',
          firstName: 'John',
          lastName: 'Doe',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const password = 'TestPassword@123';
      const user = await createTestUser({ password });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: user.email,
          password,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.id).toBe(user.id);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
    });

    it('should return 401 for invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'anypassword',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid');
    });

    it('should return 401 for invalid password', async () => {
      const user = await createTestUser({ password: 'CorrectPassword@123' });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: user.email,
          password: 'WrongPassword',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh access token with valid refresh token', async () => {
      const user = await createTestUser();
      const { refreshToken } = generateTokensForUser(user.id, user.email);

      await redisClient.setEx(
        `refresh_token:${user.id}`,
        7 * 24 * 60 * 60,
        refreshToken
      );

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
    });

    it('should return 401 for invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout user successfully', async () => {
      const user = await createTestUser();
      const { accessToken, refreshToken } = generateTokensForUser(
        user.id,
        user.email
      );

      await redisClient.setEx(
        `refresh_token:${user.id}`,
        7 * 24 * 60 * 60,
        refreshToken
      );

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      const storedToken = await redisClient.get(`refresh_token:${user.id}`);
      expect(storedToken).toBeNull();
    });

    it('should return 401 without authentication', async () => {
      await request(app).post('/api/auth/logout').expect(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user profile', async () => {
      const user = await createTestUser();
      const { accessToken } = generateTokensForUser(user.id, user.email);

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(user.id);
      expect(response.body.data.email).toBe(user.email);
    });

    it('should return 401 without authentication', async () => {
      await request(app).get('/api/auth/me').expect(401);
    });
  });

  describe('PATCH /api/auth/me', () => {
    it('should update user profile', async () => {
      const user = await createTestUser();
      const { accessToken } = generateTokensForUser(user.id, user.email);

      const response = await request(app)
        .patch('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          firstName: 'Updated',
          lastName: 'Name',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.firstName).toBe('Updated');
      expect(response.body.data.lastName).toBe('Name');
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .patch('/api/auth/me')
        .send({ firstName: 'Updated' })
        .expect(401);
    });
  });

  describe('PATCH /api/auth/me/password', () => {
    it('should change password successfully', async () => {
      const oldPassword = 'OldPassword@123';
      const newPassword = 'NewPassword@456';
      const user = await createTestUser({ password: oldPassword });
      const { accessToken } = generateTokensForUser(user.id, user.email);

      const response = await request(app)
        .patch('/api/auth/me/password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: oldPassword,
          newPassword,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return 400 with incorrect current password', async () => {
      const user = await createTestUser({ password: 'CorrectPassword@123' });
      const { accessToken } = generateTokensForUser(user.id, user.email);

      const response = await request(app)
        .patch('/api/auth/me/password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'WrongPassword',
          newPassword: 'NewPassword@456',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should request password reset', async () => {
      const user = await createTestUser();

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: user.email })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('reset link');

      const resetRecords = await prisma.passwordReset.findMany({
        where: { userId: user.id },
      });

      expect(resetRecords.length).toBeGreaterThan(0);
    });

    it('should not reveal if email does not exist', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@test.com' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('should reset password with valid token', async () => {
      const user = await createTestUser();
      const { generateResetToken, hashResetToken, getResetTokenExpiration } =
        await import('../../utils/resetToken');

      const plainToken = generateResetToken();
      const hashedToken = hashResetToken(plainToken);

      await prisma.passwordReset.create({
        data: {
          userId: user.id,
          token: hashedToken,
          expiresAt: getResetTokenExpiration(),
          used: false,
        },
      });

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: plainToken,
          newPassword: 'NewSecurePassword@123',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return 400 with invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'invalid-token',
          newPassword: 'NewPassword@123',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});