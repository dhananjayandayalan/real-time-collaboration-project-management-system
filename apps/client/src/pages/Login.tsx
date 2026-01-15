import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store';
import { login, clearError } from '@/store/slices/authSlice';
import { Button, Input } from '@/components/common';
import './AuthPages.css';

export const Login: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [formErrors, setFormErrors] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: '' }));
    if (error) {
      dispatch(clearError());
    }
  };

  const validate = (): boolean => {
    const errors = { email: '', password: '' };
    let isValid = true;

    if (!formData.email) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email';
      isValid = false;
    }

    if (!formData.password) {
      errors.password = 'Password is required';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const result = await dispatch(login(formData));
    if (login.fulfilled.match(result)) {
      navigate('/projects');
    }
  };

  return (
    <div className="auth-page">
      <h2 className="auth-page__title">Welcome back</h2>
      <p className="auth-page__subtitle">Sign in to your account to continue</p>

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
          value={formData.email}
          onChange={handleChange}
          error={formErrors.email}
          placeholder="Enter your email"
          autoComplete="email"
        />

        <Input
          label="Password"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          error={formErrors.password}
          placeholder="Enter your password"
          autoComplete="current-password"
        />

        <div className="auth-page__forgot">
          <Link to="/forgot-password" className="auth-page__link">
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          fullWidth
          isLoading={isLoading}
        >
          Sign in
        </Button>
      </form>

      <p className="auth-page__footer">
        Don't have an account?{' '}
        <Link to="/register" className="auth-page__link">
          Sign up
        </Link>
      </p>
    </div>
  );
};

export default Login;
