import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  login,
  logout,
  register,
  getCurrentUser,
  clearError,
} from '@/store/slices/authSlice';
import type { LoginCredentials, RegisterData } from '@/types';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, error } = useAppSelector((state) => state.auth);

  // Check for existing session on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token && !user && !isLoading) {
      dispatch(getCurrentUser());
    }
  }, [dispatch, user, isLoading]);

  const signIn = useCallback(
    async (credentials: LoginCredentials) => {
      const result = await dispatch(login(credentials));
      if (login.fulfilled.match(result)) {
        navigate('/projects');
        return true;
      }
      return false;
    },
    [dispatch, navigate]
  );

  const signUp = useCallback(
    async (data: RegisterData) => {
      const result = await dispatch(register(data));
      if (register.fulfilled.match(result)) {
        navigate('/projects');
        return true;
      }
      return false;
    },
    [dispatch, navigate]
  );

  const signOut = useCallback(async () => {
    await dispatch(logout());
    navigate('/login');
  }, [dispatch, navigate]);

  const clearAuthError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    signIn,
    signUp,
    signOut,
    clearAuthError,
  };
};

export default useAuth;
