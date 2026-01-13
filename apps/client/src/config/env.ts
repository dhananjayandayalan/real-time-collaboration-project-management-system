/**
 * Environment configuration
 * All environment variables should be accessed through this file
 */

export const env = {
  // API URLs
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
  authServiceUrl: import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:3001',
  projectServiceUrl: import.meta.env.VITE_PROJECT_SERVICE_URL || 'http://localhost:3002',
  taskServiceUrl: import.meta.env.VITE_TASK_SERVICE_URL || 'http://localhost:3003',
  realtimeServiceUrl: import.meta.env.VITE_REALTIME_SERVICE_URL || 'http://localhost:3004',

  // Environment
  nodeEnv: import.meta.env.VITE_NODE_ENV || 'development',
  isDevelopment: import.meta.env.VITE_NODE_ENV === 'development',
  isProduction: import.meta.env.VITE_NODE_ENV === 'production',

  // App config
  appName: import.meta.env.VITE_APP_NAME || 'Project Management System',
  appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
} as const;

// Type for environment config
export type Env = typeof env;
