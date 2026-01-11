import { Request } from 'express';

// Extend Express Request type to include user information
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
      };
    }
  }
}

export {};
