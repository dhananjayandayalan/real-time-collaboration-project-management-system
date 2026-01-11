import jwt, { SignOptions } from 'jsonwebtoken';

export interface TokenPayload {
  userId: string;
  email: string;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as string,
  } as SignOptions);
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET!, {
    expiresIn: (process.env.REFRESH_TOKEN_EXPIRES_IN || '7d') as string,
  } as SignOptions);
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET!) as TokenPayload;
};
