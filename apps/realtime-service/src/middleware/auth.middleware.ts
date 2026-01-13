import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { AuthenticatedSocket } from '../types/socket.types';

interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * Middleware to authenticate socket connections using JWT
 */
export const authenticateSocket = (socket: Socket, next: (err?: Error) => void) => {
  try {
    // Get token from handshake auth or query
    const token = socket.handshake.auth.token || socket.handshake.query.token;

    if (!token) {
      return next(new Error('Authentication token required'));
    }

    // Verify JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET is not configured');
      return next(new Error('Server configuration error'));
    }

    const decoded = jwt.verify(token as string, jwtSecret) as JwtPayload;

    // Attach user info to socket
    const authSocket = socket as AuthenticatedSocket;
    authSocket.userId = decoded.userId;
    authSocket.email = decoded.email;

    console.log(`User authenticated: ${decoded.email} (${decoded.userId})`);
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new Error('Invalid token'));
    }
    if (error instanceof jwt.TokenExpiredError) {
      return next(new Error('Token expired'));
    }
    console.error('Socket authentication error:', error);
    return next(new Error('Authentication failed'));
  }
};
