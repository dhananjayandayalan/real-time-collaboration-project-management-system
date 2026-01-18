import React, { createContext, /* useContext, */ useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { env } from '@/config/env';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  taskCreated,
  taskUpdated,
  taskDeleted,
  commentAdded,
} from '@/store/slices/tasksSlice';
import {
  userOnline,
  userOffline,
  userTyping,
  userStoppedTyping,
} from '@/store/slices/uiSlice';
import type { Task, TaskComment, UserPresence, TypingUser } from '@/types';

interface SocketContextType {
  getSocket: () => Socket | null;
  isConnected: boolean;
  joinProject: (projectId: string) => void;
  leaveProject: (projectId: string) => void;
  joinTask: (taskId: string) => void;
  leaveTask: (taskId: string) => void;
  emitTypingStart: (taskId: string) => void;
  emitTypingStop: (taskId: string) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

// export const useSocket = () => {
//   const context = useContext(SocketContext);
//   if (!context) {
//     throw new Error('useSocket must be used within a SocketProvider');
//   }
//   return context;
// };

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const dispatch = useAppDispatch();
  const { isAuthenticated, tokens } = useAppSelector((state) => state.auth);
  const reconnectAttempts = useRef(0);
  const socketRef = useRef<Socket | null>(null);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    if (!isAuthenticated || !tokens?.accessToken) {
      return;
    }

    // Create socket connection
    const newSocket = io(env.realtimeServiceUrl, {
      auth: {
        token: tokens.accessToken,
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = newSocket;

    // Connection events
    newSocket.on('connect', () => {
      setIsConnected(true);
      reconnectAttempts.current = 0;
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      reconnectAttempts.current += 1;
      if (reconnectAttempts.current >= maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
      }
    });

    // Task events
    newSocket.on('task:created', (task: Task) => {
      dispatch(taskCreated(task));
    });

    newSocket.on('task:updated', (task: Task) => {
      dispatch(taskUpdated(task));
    });

    newSocket.on('task:deleted', (taskId: string) => {
      dispatch(taskDeleted(taskId));
    });

    // Comment events
    newSocket.on('comment:added', (comment: TaskComment) => {
      dispatch(commentAdded(comment));
    });

    // Presence events
    newSocket.on('user:online', (presence: UserPresence) => {
      dispatch(userOnline(presence));
    });

    newSocket.on('user:offline', (userId: string) => {
      dispatch(userOffline(userId));
    });

    // Typing events
    newSocket.on('typing:user', (typingUser: TypingUser) => {
      dispatch(userTyping(typingUser));
    });

    newSocket.on('typing:stopped', ({ userId, taskId }: { userId: string; taskId: string }) => {
      dispatch(userStoppedTyping({ userId, taskId }));
    });

    // Cleanup
    return () => {
      newSocket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [isAuthenticated, tokens?.accessToken, dispatch]);

  const joinProject = useCallback((projectId: string) => {
    socketRef.current?.emit('join:project', projectId);
  }, []);

  const leaveProject = useCallback((projectId: string) => {
    socketRef.current?.emit('leave:project', projectId);
  }, []);

  const joinTask = useCallback((taskId: string) => {
    socketRef.current?.emit('join:task', taskId);
  }, []);

  const leaveTask = useCallback((taskId: string) => {
    socketRef.current?.emit('leave:task', taskId);
  }, []);

  const emitTypingStart = useCallback((taskId: string) => {
    socketRef.current?.emit('typing:start', { taskId });
  }, []);

  const emitTypingStop = useCallback((taskId: string) => {
    socketRef.current?.emit('typing:stop', { taskId });
  }, []);

  const getSocket = useCallback(() => socketRef.current, []);

  const value: SocketContextType = {
    getSocket,
    isConnected,
    joinProject,
    leaveProject,
    joinTask,
    leaveTask,
    emitTypingStart,
    emitTypingStop,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;
