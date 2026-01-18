import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAppSelector } from '@/store';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import './AppLayout.css';

export const AppLayout: React.FC = () => {
  const { isAuthenticated, isLoading, isInitialized } = useAppSelector((state) => state.auth);

  // Show nothing while checking auth status (initial session verification)
  if (!isInitialized || isLoading) {
    return null;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <Header />
      <main className="app-layout__main">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
