import prisma from '../config/prisma';
import redisClient from '../config/redis';
import { hashPassword, comparePassword } from '../utils/password';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt';

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
  };
  accessToken: string;
  refreshToken: string;
}

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  avatar?: string | null;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export class AuthService {
  // Register a new user
  async register(data: RegisterData): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
      },
    });

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
    });

    // Store refresh token in Redis (7 days TTL)
    await this.storeRefreshToken(user.id, refreshToken);

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  // Login user
  async login(data: LoginData): Promise<AuthResponse> {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      throw new Error('Account is not active');
    }

    // Verify password
    const isPasswordValid = await comparePassword(data.password, user.password);

    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
    });

    // Store refresh token in Redis
    await this.storeRefreshToken(user.id, refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
      },
      accessToken,
      refreshToken,
    };
  }

  // Refresh access token
  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      // Verify refresh token
      const payload = verifyRefreshToken(refreshToken);

      // Check if refresh token exists in Redis
      const storedToken = await redisClient.get(`refresh_token:${payload.userId}`);

      if (!storedToken || storedToken !== refreshToken) {
        throw new Error('Invalid refresh token');
      }

      // Generate new access token
      const accessToken = generateAccessToken({
        userId: payload.userId,
        email: payload.email,
      });

      return { accessToken };
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  // Logout user
  async logout(userId: string): Promise<void> {
    // Remove refresh token from Redis
    await redisClient.del(`refresh_token:${userId}`);
  }

  // Store refresh token in Redis
  private async storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const expiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';
    const seconds = this.parseExpiresIn(expiresIn);

    await redisClient.setEx(`refresh_token:${userId}`, seconds, refreshToken);
  }

  // Parse expires in string to seconds
  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 7 * 24 * 60 * 60; // Default 7 days

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 24 * 60 * 60;
      default:
        return 7 * 24 * 60 * 60;
    }
  }

  // Get current user profile
  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        isEmailVerified: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        userRoles: {
          select: {
            role: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return {
      ...user,
      roles: user.userRoles.map((ur) => ur.role),
      userRoles: undefined,
    };
  }

  // Update user profile
  async updateProfile(userId: string, data: UpdateProfileData) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.firstName && { firstName: data.firstName }),
        ...(data.lastName && { lastName: data.lastName }),
        ...(data.avatar !== undefined && { avatar: data.avatar }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        isEmailVerified: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  // Change password
  async changePassword(userId: string, data: ChangePasswordData): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isPasswordValid = await comparePassword(data.currentPassword, user.password);

    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await hashPassword(data.newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Invalidate all refresh tokens for security
    await redisClient.del(`refresh_token:${userId}`);
  }
}

export default new AuthService();
