import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAppSelector } from '@/store';
import './AuthLayout.css';

export const AuthLayout: React.FC = () => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  // Redirect to dashboard if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/projects" replace />;
  }

  return (
    <div className="auth-layout">
      <div className="auth-layout__container">
        <div className="auth-layout__brand">
          <h1 className="auth-layout__logo">ProjectHub</h1>
          <p className="auth-layout__tagline">
            Real-time collaboration for modern teams
          </p>
        </div>
        <div className="auth-layout__content">
          <Outlet />
        </div>
      </div>
      <div className="auth-layout__footer">
        <p>&copy; {new Date().getFullYear()} ProjectHub. All rights reserved.</p>
      </div>
    </div>
  );
};

export default AuthLayout;
