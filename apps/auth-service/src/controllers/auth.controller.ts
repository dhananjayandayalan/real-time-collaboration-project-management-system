import { Request, Response } from 'express';
import authService from '../services/auth.service';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  updateProfileSchema,
  changePasswordSchema,
} from '../utils/validation';

export class AuthController {
  // Register a new user
  async register(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const { error, value } = registerSchema.validate(req.body);

      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map((detail) => detail.message),
        });
        return;
      }

      // Register user
      const result = await authService.register(value);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result,
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
    }
  }

  // Login user
  async login(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const { error, value } = loginSchema.validate(req.body);

      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map((detail) => detail.message),
        });
        return;
      }

      // Login user
      const result = await authService.login(value);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result,
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(401).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
    }
  }

  // Refresh access token
  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const { error, value } = refreshTokenSchema.validate(req.body);

      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map((detail) => detail.message),
        });
        return;
      }

      // Refresh token
      const result = await authService.refreshAccessToken(value.refreshToken);

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: result,
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(401).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
    }
  }

  // Logout user
  async logout(req: Request, res: Response): Promise<void> {
    try {
      // Get userId from authenticated user (set by authenticateToken middleware)
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      await authService.logout(req.user.userId);

      res.status(200).json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Get current user profile
  async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const user = await authService.getCurrentUser(req.user.userId);

      res.status(200).json({
        success: true,
        message: 'User profile retrieved successfully',
        data: user,
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(404).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
    }
  }

  // Update user profile
  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      // Validate request body
      const { error, value } = updateProfileSchema.validate(req.body);

      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map((detail) => detail.message),
        });
        return;
      }

      const updatedUser = await authService.updateProfile(req.user.userId, value);

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedUser,
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
    }
  }

  // Change password
  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      // Validate request body
      const { error, value } = changePasswordSchema.validate(req.body);

      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map((detail) => detail.message),
        });
        return;
      }

      await authService.changePassword(req.user.userId, value);

      res.status(200).json({
        success: true,
        message: 'Password changed successfully. Please login again.',
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
    }
  }
}

export default new AuthController();
