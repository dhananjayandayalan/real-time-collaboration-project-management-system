import { describe, it, expect, beforeEach } from 'vitest';
import { AuthService } from '../../services/auth.service';
import { createTestUser, generateTokensForUser } from '../utils/testHelpers';
import { prisma } from '../setup';
import { comparePassword } from '../../utils/password';
import redisClient from '../../config/redis';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'newuser@test.com',
        password: 'Password@123',
        firstName: 'New',
        lastName: 'User',
      };

      const result = await authService.register(userData);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe(userData.email);
      expect(result.user.firstName).toBe(userData.firstName);
      expect(result.user).not.toHaveProperty('password');
    });

    it('should hash the password', async () => {
      const userData = {
        email: 'test@test.com',
        password: 'PlainPassword123',
        firstName: 'Test',
        lastName: 'User',
      };

      await authService.register(userData);

      const user = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      expect(user?.password).not.toBe(userData.password);
      expect(user?.password.length).toBeGreaterThan(20);
    });

    it('should throw error if email already exists', async () => {
      const userData = {
        email: 'duplicate@test.com',
        password: 'Password@123',
        firstName: 'Test',
        lastName: 'User',
      };

      await authService.register(userData);

      await expect(authService.register(userData)).rejects.toThrow(
        'User with this email already exists'
      );
    });

    it('should store refresh token in Redis', async () => {
      const userData = {
        email: 'redis@test.com',
        password: 'Password@123',
        firstName: 'Redis',
        lastName: 'Test',
      };

      const result = await authService.register(userData);

      const storedToken = await redisClient.get(
        `refresh_token:${result.user.id}`
      );

      expect(storedToken).toBe(result.refreshToken);
    });
  });

  describe('login', () => {
    it('should login with valid credentials', async () => {
      const password = 'TestPassword@123';
      const user = await createTestUser({ password });

      const result = await authService.login({
        email: user.email,
        password,
      });

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.id).toBe(user.id);
      expect(result.user.email).toBe(user.email);
    });

    it('should throw error with invalid email', async () => {
      await expect(
        authService.login({
          email: 'nonexistent@test.com',
          password: 'anypassword',
        })
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw error with invalid password', async () => {
      const user = await createTestUser({ password: 'CorrectPassword@123' });

      await expect(
        authService.login({
          email: user.email,
          password: 'WrongPassword',
        })
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw error if user is not active', async () => {
      const user = await createTestUser();
      await prisma.user.update({
        where: { id: user.id },
        data: { status: 'SUSPENDED' },
      });

      await expect(
        authService.login({
          email: user.email,
          password: 'Test@123456',
        })
      ).rejects.toThrow('Account is not active');
    });

    it('should update lastLoginAt timestamp', async () => {
      const password = 'TestPassword@123';
      const user = await createTestUser({ password });
      const beforeLogin = user.lastLoginAt;

      await authService.login({
        email: user.email,
        password,
      });

      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id },
      });

      expect(updatedUser?.lastLoginAt).not.toBe(beforeLogin);
      expect(updatedUser?.lastLoginAt).toBeInstanceOf(Date);
    });
  });

  describe('refreshAccessToken', () => {
    it('should generate new access token with valid refresh token', async () => {
      const user = await createTestUser();
      const { refreshToken } = generateTokensForUser(user.id, user.email);

      // Store refresh token in Redis
      await redisClient.setEx(
        `refresh_token:${user.id}`,
        7 * 24 * 60 * 60,
        refreshToken
      );

      const result = await authService.refreshAccessToken(refreshToken);

      expect(result).toHaveProperty('accessToken');
      expect(result.accessToken).toBeTruthy();
    });

    it('should throw error with invalid refresh token', async () => {
      await expect(
        authService.refreshAccessToken('invalid-token')
      ).rejects.toThrow('Invalid or expired refresh token');
    });

    it('should throw error if token not in Redis', async () => {
      const user = await createTestUser();
      const { refreshToken } = generateTokensForUser(user.id, user.email);

      // Don't store in Redis

      await expect(
        authService.refreshAccessToken(refreshToken)
      ).rejects.toThrow('Invalid or expired refresh token');
    });
  });

  describe('logout', () => {
    it('should remove refresh token from Redis', async () => {
      const user = await createTestUser();
      const { refreshToken } = generateTokensForUser(user.id, user.email);

      await redisClient.setEx(
        `refresh_token:${user.id}`,
        7 * 24 * 60 * 60,
        refreshToken
      );

      await authService.logout(user.id);

      const storedToken = await redisClient.get(`refresh_token:${user.id}`);
      expect(storedToken).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    it('should return user profile with roles', async () => {
      const user = await createTestUser();

      const result = await authService.getCurrentUser(user.id);

      expect(result.id).toBe(user.id);
      expect(result.email).toBe(user.email);
      expect(result).toHaveProperty('roles');
      expect(Array.isArray(result.roles)).toBe(true);
    });

    it('should throw error if user not found', async () => {
      await expect(
        authService.getCurrentUser('non-existent-id')
      ).rejects.toThrow('User not found');
    });
  });

  describe('updateProfile', () => {
    it('should update user firstName', async () => {
      const user = await createTestUser();

      const result = await authService.updateProfile(user.id, {
        firstName: 'Updated',
      });

      expect(result.firstName).toBe('Updated');
      expect(result.lastName).toBe(user.lastName);
    });

    it('should update user avatar', async () => {
      const user = await createTestUser();
      const avatarUrl = 'https://example.com/avatar.png';

      const result = await authService.updateProfile(user.id, {
        avatar: avatarUrl,
      });

      expect(result.avatar).toBe(avatarUrl);
    });

    it('should allow setting avatar to null', async () => {
      const user = await createTestUser();

      const result = await authService.updateProfile(user.id, {
        avatar: null,
      });

      expect(result.avatar).toBeNull();
    });

    it('should throw error if user not found', async () => {
      await expect(
        authService.updateProfile('non-existent-id', { firstName: 'Test' })
      ).rejects.toThrow('User not found');
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const oldPassword = 'OldPassword@123';
      const newPassword = 'NewPassword@456';
      const user = await createTestUser({ password: oldPassword });

      await authService.changePassword(user.id, {
        currentPassword: oldPassword,
        newPassword,
      });

      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id },
      });

      const isNewPasswordValid = await comparePassword(
        newPassword,
        updatedUser!.password
      );
      expect(isNewPasswordValid).toBe(true);
    });

    it('should throw error with incorrect current password', async () => {
      const user = await createTestUser({ password: 'CorrectPassword@123' });

      await expect(
        authService.changePassword(user.id, {
          currentPassword: 'WrongPassword',
          newPassword: 'NewPassword@456',
        })
      ).rejects.toThrow('Current password is incorrect');
    });

    it('should invalidate refresh tokens after password change', async () => {
      const oldPassword = 'OldPassword@123';
      const user = await createTestUser({ password: oldPassword });
      const { refreshToken } = generateTokensForUser(user.id, user.email);

      await redisClient.setEx(
        `refresh_token:${user.id}`,
        7 * 24 * 60 * 60,
        refreshToken
      );

      await authService.changePassword(user.id, {
        currentPassword: oldPassword,
        newPassword: 'NewPassword@456',
      });

      const storedToken = await redisClient.get(`refresh_token:${user.id}`);
      expect(storedToken).toBeNull();
    });

    it('should throw error if user not found', async () => {
      await expect(
        authService.changePassword('non-existent-id', {
          currentPassword: 'any',
          newPassword: 'new',
        })
      ).rejects.toThrow('User not found');
    });
  });

  describe('forgotPassword', () => {
    it('should create password reset token', async () => {
      const user = await createTestUser();

      await authService.forgotPassword(user.email);

      const resetRecords = await prisma.passwordReset.findMany({
        where: { userId: user.id },
      });

      expect(resetRecords.length).toBeGreaterThan(0);
      expect(resetRecords[0].used).toBe(false);
      expect(resetRecords[0].expiresAt).toBeInstanceOf(Date);
    });

    it('should not throw error for non-existent email', async () => {
      // Should not reveal if email exists
      await expect(
        authService.forgotPassword('nonexistent@test.com')
      ).resolves.not.toThrow();
    });

    it('should invalidate previous unused tokens', async () => {
      const user = await createTestUser();

      // Create first reset token
      await authService.forgotPassword(user.email);

      const firstTokens = await prisma.passwordReset.findMany({
        where: { userId: user.id, used: false },
      });
      expect(firstTokens.length).toBe(1);

      // Create second reset token
      await authService.forgotPassword(user.email);

      const allTokens = await prisma.passwordReset.findMany({
        where: { userId: user.id },
      });

      const unusedTokens = allTokens.filter((t) => !t.used);
      expect(unusedTokens.length).toBe(1);
    });

    it('should not create token for inactive user', async () => {
      const user = await createTestUser();
      await prisma.user.update({
        where: { id: user.id },
        data: { status: 'SUSPENDED' },
      });

      await authService.forgotPassword(user.email);

      const resetRecords = await prisma.passwordReset.findMany({
        where: { userId: user.id },
      });

      expect(resetRecords.length).toBe(0);
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      const user = await createTestUser();
      const newPassword = 'NewSecurePassword@123';

      // Create a reset token manually for testing
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

      await authService.resetPassword(plainToken, newPassword);

      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id },
      });

      const isNewPasswordValid = await comparePassword(
        newPassword,
        updatedUser!.password
      );
      expect(isNewPasswordValid).toBe(true);
    });

    it('should mark token as used after reset', async () => {
      const user = await createTestUser();

      const { generateResetToken, hashResetToken, getResetTokenExpiration } =
        await import('../../utils/resetToken');

      const plainToken = generateResetToken();
      const hashedToken = hashResetToken(plainToken);

      const resetRecord = await prisma.passwordReset.create({
        data: {
          userId: user.id,
          token: hashedToken,
          expiresAt: getResetTokenExpiration(),
          used: false,
        },
      });

      await authService.resetPassword(plainToken, 'NewPassword@123');

      const updatedRecord = await prisma.passwordReset.findUnique({
        where: { id: resetRecord.id },
      });

      expect(updatedRecord?.used).toBe(true);
    });

    it('should throw error with invalid token', async () => {
      await expect(
        authService.resetPassword('invalid-token', 'NewPassword@123')
      ).rejects.toThrow('Invalid or expired reset token');
    });

    it('should throw error with expired token', async () => {
      const user = await createTestUser();

      const { generateResetToken, hashResetToken } = await import(
        '../../utils/resetToken'
      );

      const plainToken = generateResetToken();
      const hashedToken = hashResetToken(plainToken);

      // Create an expired token
      await prisma.passwordReset.create({
        data: {
          userId: user.id,
          token: hashedToken,
          expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
          used: false,
        },
      });

      await expect(
        authService.resetPassword(plainToken, 'NewPassword@123')
      ).rejects.toThrow('Invalid or expired reset token');
    });

    it('should throw error with already used token', async () => {
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
          used: true, // Already used
        },
      });

      await expect(
        authService.resetPassword(plainToken, 'NewPassword@123')
      ).rejects.toThrow('Invalid or expired reset token');
    });

    it('should invalidate all refresh tokens after password reset', async () => {
      const user = await createTestUser();
      const { refreshToken } = generateTokensForUser(user.id, user.email);

      await redisClient.setEx(
        `refresh_token:${user.id}`,
        7 * 24 * 60 * 60,
        refreshToken
      );

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

      await authService.resetPassword(plainToken, 'NewPassword@123');

      const storedToken = await redisClient.get(`refresh_token:${user.id}`);
      expect(storedToken).toBeNull();
    });
  });
});