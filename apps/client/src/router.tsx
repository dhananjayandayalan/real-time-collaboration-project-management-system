import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout, AuthLayout } from '@/layouts';
import {
  Login,
  Register,
  ForgotPassword,
  ResetPassword,
  Projects,
  NotFound,
} from '@/pages';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/projects" replace />,
  },
  {
    element: <AuthLayout />,
    children: [
      {
        path: 'login',
        element: <Login />,
      },
      {
        path: 'register',
        element: <Register />,
      },
      {
        path: 'forgot-password',
        element: <ForgotPassword />,
      },
      {
        path: 'reset-password',
        element: <ResetPassword />,
      },
    ],
  },
  {
    element: <AppLayout />,
    children: [
      {
        path: 'projects',
        element: <Projects />,
      },
      {
        path: 'projects/:id',
        element: <div>Project Detail (Coming soon)</div>,
      },
      {
        path: 'projects/:id/board',
        element: <div>Project Board (Coming soon)</div>,
      },
      {
        path: 'projects/:id/list',
        element: <div>Project List View (Coming soon)</div>,
      },
      {
        path: 'projects/:id/settings',
        element: <div>Project Settings (Coming soon)</div>,
      },
      {
        path: 'tasks',
        element: <div>My Tasks (Coming soon)</div>,
      },
      {
        path: 'team',
        element: <div>Team (Coming soon)</div>,
      },
      {
        path: 'settings',
        element: <div>Settings (Coming soon)</div>,
      },
      {
        path: 'profile',
        element: <div>Profile (Coming soon)</div>,
      },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);

export default router;
