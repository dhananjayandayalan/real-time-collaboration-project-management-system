import { describe, it, expect, vi, beforeEach } from 'vitest';
import authReducer, {
  clearError,
  setTokens,
  resetAuth,
  login,
  logout,
} from './authSlice';
import type { AuthTokens } from '@/types';

// Mock the authService
vi.mock('@/services/api/authService', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
  },
}));

describe('authSlice', () => {
  const initialState = {
    user: null,
    tokens: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('reducers', () => {
    it('should return the initial state', () => {
      expect(authReducer(undefined, { type: 'unknown' })).toEqual(initialState);
    });

    it('should handle clearError', () => {
      const stateWithError = { ...initialState, error: 'Some error' };
      expect(authReducer(stateWithError, clearError())).toEqual(initialState);
    });

    it('should handle setTokens', () => {
      const tokens: AuthTokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };
      const result = authReducer(initialState, setTokens(tokens));
      expect(result.tokens).toEqual(tokens);
      expect(result.isAuthenticated).toBe(true);
    });

    it('should handle resetAuth', () => {
      const authenticatedState = {
        ...initialState,
        user: { id: '1', email: 'test@test.com', name: 'Test', role: 'DEVELOPER' as const, createdAt: new Date(), updatedAt: new Date() },
        tokens: { accessToken: 'token', refreshToken: 'refresh' },
        isAuthenticated: true,
      };
      expect(authReducer(authenticatedState, resetAuth())).toEqual(initialState);
    });
  });

  describe('async thunks', () => {
    it('should set isLoading to true when login is pending', () => {
      const action = { type: login.pending.type };
      const result = authReducer(initialState, action);
      expect(result.isLoading).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should set error when login is rejected', () => {
      const action = { type: login.rejected.type, payload: 'Invalid credentials' };
      const result = authReducer({ ...initialState, isLoading: true }, action);
      expect(result.isLoading).toBe(false);
      expect(result.error).toBe('Invalid credentials');
    });

    it('should reset state when logout is fulfilled', () => {
      const authenticatedState = {
        ...initialState,
        user: { id: '1', email: 'test@test.com', name: 'Test', role: 'DEVELOPER' as const, createdAt: new Date(), updatedAt: new Date() },
        tokens: { accessToken: 'token', refreshToken: 'refresh' },
        isAuthenticated: true,
      };
      const action = { type: logout.fulfilled.type };
      expect(authReducer(authenticatedState, action)).toEqual(initialState);
    });
  });
});
