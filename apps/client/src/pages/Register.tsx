import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store';
import { register, clearError } from '@/store/slices/authSlice';
import { Button, Input } from '@/components/common';
import './AuthPages.css';

export const Register: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [formErrors, setFormErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
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
    const errors = { name: '', email: '', password: '', confirmPassword: '' };
    let isValid = true;

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
      isValid = false;
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
      isValid = false;
    }

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

    if (!validate()) return;

    const result = await dispatch(
      register({
        name: formData.name.trim(),
        email: formData.email,
        password: formData.password,
      })
    );

    if (register.fulfilled.match(result)) {
      navigate('/projects');
    }
  };

  return (
    <div className="auth-page">
      <h2 className="auth-page__title">Create an account</h2>
      <p className="auth-page__subtitle">Get started with ProjectHub today</p>

      {error && (
        <div className="auth-page__error" role="alert">
          {error}
        </div>
      )}

      <form className="auth-page__form" onSubmit={handleSubmit}>
        <Input
          label="Full name"
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          error={formErrors.name}
          placeholder="Enter your full name"
          autoComplete="name"
        />

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
          placeholder="Create a password"
          hint="Must be at least 8 characters"
          autoComplete="new-password"
        />

        <Input
          label="Confirm password"
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          error={formErrors.confirmPassword}
          placeholder="Confirm your password"
          autoComplete="new-password"
        />

        <Button
          type="submit"
          fullWidth
          isLoading={isLoading}
        >
          Create account
        </Button>
      </form>

      <p className="auth-page__footer">
        Already have an account?{' '}
        <Link to="/login" className="auth-page__link">
          Sign in
        </Link>
      </p>
    </div>
  );
};

export default Register;
