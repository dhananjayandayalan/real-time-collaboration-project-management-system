import { authApi } from './axiosInstance';
import type {
  User,
  AuthResponse,
  AuthTokens,
  LoginCredentials,
  RegisterData,
} from '@/types';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await authApi.post('/auth/login', credentials);
    return response.data.data;
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await authApi.post('/auth/register', data);
    return response.data.data;
  },

  async logout(): Promise<void> {
    await authApi.post('/auth/logout');
  },

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const response = await authApi.post('/auth/refresh', { refreshToken });
    return response.data.data;
  },

  async getCurrentUser(): Promise<User> {
    const response = await authApi.get('/auth/me');
    return response.data.data;
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await authApi.patch('/auth/me', data);
    return response.data.data;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await authApi.patch('/auth/me/password', {
      currentPassword,
      newPassword,
    });
  },

  async forgotPassword(email: string): Promise<void> {
    await authApi.post('/auth/forgot-password', { email });
  },

  async resetPassword(token: string, password: string): Promise<void> {
    await authApi.post('/auth/reset-password', { token, password });
  },
};
