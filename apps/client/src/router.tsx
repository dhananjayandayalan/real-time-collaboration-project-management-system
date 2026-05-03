import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout, AuthLayout } from '@/layouts';
import { LoadingSpinner } from '@/components/common';

const Login = lazy(() => import('@/pages/Login').then((m) => ({ default: m.Login })));
const Register = lazy(() => import('@/pages/Register').then((m) => ({ default: m.Register })));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword').then((m) => ({ default: m.ForgotPassword })));
const ResetPassword = lazy(() => import('@/pages/ResetPassword').then((m) => ({ default: m.ResetPassword })));
const Projects = lazy(() => import('@/pages/Projects').then((m) => ({ default: m.Projects })));
const ProjectDetail = lazy(() => import('@/pages/ProjectDetail').then((m) => ({ default: m.ProjectDetail })));
const ProjectBoard = lazy(() => import('@/pages/ProjectBoard').then((m) => ({ default: m.ProjectBoard })));
const ProjectList = lazy(() => import('@/pages/ProjectList').then((m) => ({ default: m.ProjectList })));
const ProjectSettings = lazy(() => import('@/pages/ProjectSettings').then((m) => ({ default: m.ProjectSettings })));
const ProjectMembers = lazy(() => import('@/pages/ProjectMembers').then((m) => ({ default: m.ProjectMembers })));
const MyTasks = lazy(() => import('@/pages/MyTasks').then((m) => ({ default: m.MyTasks })));
const Profile = lazy(() => import('@/pages/Profile').then((m) => ({ default: m.Profile })));
const Team = lazy(() => import('@/pages/Team').then((m) => ({ default: m.Team })));
const UserSettings = lazy(() => import('@/pages/UserSettings').then((m) => ({ default: m.UserSettings })));
const NotFound = lazy(() => import('@/pages/NotFound').then((m) => ({ default: m.NotFound })));

const PageLoader = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
    <LoadingSpinner size="lg" />
  </div>
);

const withSuspense = (element: React.ReactNode) => (
  <Suspense fallback={<PageLoader />}>{element}</Suspense>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/projects" replace />,
  },
  {
    element: <AuthLayout />,
    children: [
      { path: 'login', element: withSuspense(<Login />) },
      { path: 'register', element: withSuspense(<Register />) },
      { path: 'forgot-password', element: withSuspense(<ForgotPassword />) },
      { path: 'reset-password', element: withSuspense(<ResetPassword />) },
    ],
  },
  {
    element: <AppLayout />,
    children: [
      { path: 'projects', element: withSuspense(<Projects />) },
      {
        path: 'projects/:id',
        element: withSuspense(<ProjectDetail />),
        children: [
          { index: true, element: <Navigate to="board" replace /> },
          { path: 'board', element: withSuspense(<ProjectBoard />) },
          { path: 'list', element: withSuspense(<ProjectList />) },
          { path: 'members', element: withSuspense(<ProjectMembers />) },
          { path: 'settings', element: withSuspense(<ProjectSettings />) },
        ],
      },
      { path: 'tasks', element: withSuspense(<MyTasks />) },
      { path: 'team', element: withSuspense(<Team />) },
      { path: 'settings', element: withSuspense(<UserSettings />) },
      { path: 'profile', element: withSuspense(<Profile />) },
    ],
  },
  {
    path: '*',
    element: withSuspense(<NotFound />),
  },
]);

export default router;
