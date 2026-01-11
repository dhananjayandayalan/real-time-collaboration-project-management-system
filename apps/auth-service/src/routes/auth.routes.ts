import { Router } from 'express';
import authController from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import {
  authLimiter,
  refreshTokenLimiter,
} from '../middleware/rateLimiter.middleware';

const router = Router();

// Auth routes with rate limiting
router.post('/register', authLimiter, authController.register.bind(authController));
router.post('/login', authLimiter, authController.login.bind(authController));
router.post('/refresh', refreshTokenLimiter, authController.refreshToken.bind(authController));
router.post('/logout', authenticateToken, authController.logout.bind(authController));

// User profile routes (requires authentication)
router.get('/me', authenticateToken, authController.getCurrentUser.bind(authController));
router.patch('/me', authenticateToken, authController.updateProfile.bind(authController));
router.patch('/me/password', authenticateToken, authController.changePassword.bind(authController));

export default router;
