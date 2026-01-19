import { createContext } from 'react';
import type { Socket } from 'socket.io-client';

export interface SocketContextType {
  getSocket: () => Socket | null;
  isConnected: boolean;
  joinProject: (projectId: string) => void;
  leaveProject: (projectId: string) => void;
  joinTask: (taskId: string) => void;
  leaveTask: (taskId: string) => void;
  emitTypingStart: (taskId: string) => void;
  emitTypingStop: (taskId: string) => void;
}

export const SocketContext = createContext<SocketContextType | null>(null);
