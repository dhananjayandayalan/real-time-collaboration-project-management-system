import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { authService } from '@/services/api';
import { Button, Input } from '@/components/common';
import './AuthPages.css';

export const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [formErrors, setFormErrors] = useState({
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: '' }));
    setError('');
  };

  const validate = (): boolean => {
    const errors = { password: '', confirmPassword: '' };
    let isValid = true;

    if (!formData.password) {
      errors.password = 'Password is required';
      isValid = false;
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
      isValid = false;
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate() || !token) return;

    setIsLoading(true);
    setError('');

    try {
      await authService.resetPassword(token, formData.password);
      setIsSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  // No token in URL
  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-page__error-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        <h2 className="auth-page__title">Invalid reset link</h2>
        <p className="auth-page__subtitle">
          This password reset link is invalid or has expired.
        </p>
        <div className="auth-page__actions">
          <Link to="/forgot-password">
            <Button fullWidth>Request a new link</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="auth-page">
        <div className="auth-page__success-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <h2 className="auth-page__title">Password reset successful</h2>
        <p className="auth-page__subtitle">
          Your password has been reset successfully.
        </p>
        <div className="auth-page__actions">
          <Button fullWidth onClick={() => navigate('/login')}>
            Sign in with new password
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <h2 className="auth-page__title">Reset password</h2>
      <p className="auth-page__subtitle">
        Enter your new password below
      </p>

      {error && (
        <div className="auth-page__error" role="alert">
          {error}
        </div>
      )}

      <form className="auth-page__form" onSubmit={handleSubmit}>
        <Input
          label="New password"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          error={formErrors.password}
          placeholder="Enter new password"
          hint="Must be at least 8 characters"
          autoComplete="new-password"
        />

        <Input
          label="Confirm new password"
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          error={formErrors.confirmPassword}
          placeholder="Confirm new password"
          autoComplete="new-password"
        />

        <Button
          type="submit"
          fullWidth
          isLoading={isLoading}
        >
          Reset password
        </Button>
      </form>

      <p className="auth-page__footer">
        <Link to="/login" className="auth-page__link auth-page__link--back">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to sign in
        </Link>
      </p>
    </div>
  );
};

export default ResetPassword;
