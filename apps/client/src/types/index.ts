// Re-export shared types
export * from '@shared/types/common.types';
export * from '@shared/types/user.types';
export * from '@shared/types/project.types';
export * from '@shared/types/task.types';

// Client-specific types

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

export interface ModalState {
  isOpen: boolean;
  type: string | null;
  data?: unknown;
}

// API Response types for client
export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}

// Socket event types
export interface SocketEvent<T = unknown> {
  type: string;
  payload: T;
  timestamp: number;
}

// User presence
export interface UserPresence {
  userId: string;
  status: 'online' | 'away' | 'offline';
  lastSeen?: Date;
}

// Typing indicator
export interface TypingUser {
  userId: string;
  userName: string;
  taskId: string;
}
