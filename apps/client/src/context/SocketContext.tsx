import React, { useEffect, useState, useCallback, useRef } from 'react';
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
  addNotification,
  setProjectViewers,
  userJoinedProject,
  userLeftProject,
  setTaskViewers,
  userJoinedTask,
  userLeftTask,
} from '@/store/slices/uiSlice';
import type { RoomViewer } from '@/store/slices/uiSlice';
import type { Task, TaskComment, UserPresence, TypingUser } from '@/types';
import { SocketContext } from './socketContextHelper';

// Room events from server
interface RoomMembersEvent {
  roomType: 'project' | 'task';
  roomId: string;
  members: RoomViewer[];
}

interface RoomUserJoinedEvent {
  roomType: 'project' | 'task';
  roomId: string;
  user: RoomViewer;
}

interface RoomUserLeftEvent {
  roomType: 'project' | 'task';
  roomId: string;
  userId: string;
}

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

    // Task events with notifications
    newSocket.on('task:created', (task: Task) => {
      dispatch(taskCreated(task));
      dispatch(addNotification({
        type: 'info',
        message: `New task created: ${task.title}`,
        duration: 4000,
      }));
    });

    newSocket.on('task:updated', (task: Task) => {
      dispatch(taskUpdated(task));
      dispatch(addNotification({
        type: 'info',
        message: `Task "${task.title}" was updated`,
        duration: 3000,
      }));
    });

    newSocket.on('task:deleted', (taskId: string) => {
      dispatch(taskDeleted(taskId));
      dispatch(addNotification({
        type: 'info',
        message: 'A task was deleted',
        duration: 3000,
      }));
    });

    // Comment events with notifications
    newSocket.on('comment:added', (comment: TaskComment & { userName?: string }) => {
      dispatch(commentAdded(comment));
      const userName = comment.userName || 'Someone';
      dispatch(addNotification({
        type: 'info',
        message: `${userName} commented on a task`,
        duration: 4000,
      }));
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

    // Room presence events
    newSocket.on('room:members', (data: RoomMembersEvent) => {
      if (data.roomType === 'project') {
        dispatch(setProjectViewers({ projectId: data.roomId, viewers: data.members }));
      } else if (data.roomType === 'task') {
        dispatch(setTaskViewers({ taskId: data.roomId, viewers: data.members }));
      }
    });

    newSocket.on('room:userJoined', (data: RoomUserJoinedEvent) => {
      if (data.roomType === 'project') {
        dispatch(userJoinedProject({ projectId: data.roomId, user: data.user }));
      } else if (data.roomType === 'task') {
        dispatch(userJoinedTask({ taskId: data.roomId, user: data.user }));
      }
    });

    newSocket.on('room:userLeft', (data: RoomUserLeftEvent) => {
      if (data.roomType === 'project') {
        dispatch(userLeftProject({ projectId: data.roomId, userId: data.userId }));
      } else if (data.roomType === 'task') {
        dispatch(userLeftTask({ taskId: data.roomId, userId: data.userId }));
      }
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

  const value = {
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

export default SocketProvider;
