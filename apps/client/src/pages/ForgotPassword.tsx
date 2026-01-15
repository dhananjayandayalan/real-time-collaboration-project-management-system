import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '@/services/api';
import { Button, Input } from '@/components/common';
import './AuthPages.css';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setEmailError('');
    setError('');
  };

  const validate = (): boolean => {
    if (!email) {
      setEmailError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsLoading(true);
    setError('');

    try {
      await authService.forgotPassword(email);
      setIsSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="auth-page">
        <div className="auth-page__success-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <h2 className="auth-page__title">Check your email</h2>
        <p className="auth-page__subtitle">
          We've sent password reset instructions to <strong>{email}</strong>
        </p>
        <p className="auth-page__text">
          If you don't see the email, check your spam folder or make sure you entered the correct email address.
        </p>
        <div className="auth-page__actions">
          <Link to="/login">
            <Button variant="outline" fullWidth>
              Back to sign in
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <h2 className="auth-page__title">Forgot password?</h2>
      <p className="auth-page__subtitle">
        No worries, we'll send you reset instructions
      </p>

      {error && (
        <div className="auth-page__error" role="alert">
          {error}
        </div>
      )}

      <form className="auth-page__form" onSubmit={handleSubmit}>
        <Input
          label="Email"
          type="email"
          name="email"
          value={email}
          onChange={handleChange}
          error={emailError}
          placeholder="Enter your email"
          autoComplete="email"
        />

        <Button
          type="submit"
          fullWidth
          isLoading={isLoading}
        >
          Send reset instructions
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

export default ForgotPassword;
