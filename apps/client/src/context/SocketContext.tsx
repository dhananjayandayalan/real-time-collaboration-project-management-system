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
} from '@/store/slices/uiSlice';
import type { Task, TaskComment, UserPresence, TypingUser } from '@/types';
import { SocketContext } from './socketContextHelper';

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const dispatch = useAppDispatch();
  const { isAuthenticated, tokens, user } = useAppSelector((state) => state.auth);
  const tasks = useAppSelector((state) => state.tasks.tasks);
  const currentUserId = user?.id;
  const reconnectAttempts = useRef(0);
  const socketRef = useRef<Socket | null>(null);
  const pendingUpdatesRef = useRef<Set<string>>(new Set());
  const tasksRef = useRef<Task[]>([]);
  const maxReconnectAttempts = 5;

  // Keep tasks ref updated
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

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
      // Only show notification if another user created the task
      if (task.reporterId !== currentUserId) {
        // Check if the task is assigned to the current user
        if (task.assigneeId === currentUserId) {
          dispatch(addNotification({
            type: 'info',
            message: `You've been assigned to new task: ${task.title}`,
          }));
        } else {
          dispatch(addNotification({
            type: 'info',
            message: `New task created: ${task.title}`,
          }));
        }
      }
    });

    newSocket.on('task:updated', (task: Task) => {
      // Find the previous task state to determine what changed
      const previousTask = tasksRef.current.find(t => t.id === task.id);

      dispatch(taskUpdated(task));

      // Only show notification if this update wasn't initiated by the current user
      if (!pendingUpdatesRef.current.has(task.id)) {
        // Check for specific changes
        if (previousTask) {
          // Check if current user was assigned to this task
          if (task.assigneeId === currentUserId && previousTask.assigneeId !== currentUserId) {
            dispatch(addNotification({
              type: 'info',
              message: `You've been assigned to: ${task.title}`,
            }));
            return;
          }

          // Check for status changes
          if (task.status !== previousTask.status) {
            const statusLabels: Record<string, string> = {
              'TODO': 'To Do',
              'IN_PROGRESS': 'In Progress',
              'IN_REVIEW': 'In Review',
              'DONE': 'Done'
            };
            dispatch(addNotification({
              type: 'info',
              message: `Task "${task.title}" moved to ${statusLabels[task.status] || task.status}`,
            }));
            return;
          }

          // Check for priority changes
          if (task.priority !== previousTask.priority) {
            dispatch(addNotification({
              type: 'info',
              message: `Task "${task.title}" priority changed to ${task.priority}`,
            }));
            return;
          }
        }

        // Default notification for other updates
        dispatch(addNotification({
          type: 'info',
          message: `Task updated: ${task.title}`,
        }));
      } else {
        // Clear the pending update flag
        pendingUpdatesRef.current.delete(task.id);
      }
    });

    newSocket.on('task:deleted', (data: { taskId: string; projectId: string }) => {
      dispatch(taskDeleted(data.taskId));
      dispatch(addNotification({
        type: 'info',
        message: `Task ${data.taskId} was deleted`,
      }));
    });

    // Comment events
    newSocket.on('comment:added', (comment: TaskComment & { userName?: string }) => {
      dispatch(commentAdded(comment));
      // Only show notification if another user added the comment
      if (comment.userId !== currentUserId) {
        dispatch(addNotification({
          type: 'info',
          message: comment.userName
            ? `${comment.userName} added a comment`
            : 'New comment added',
        }));
      }
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

  // Track pending task updates to avoid showing notifications for own actions
  const trackPendingUpdate = useCallback((taskId: string) => {
    pendingUpdatesRef.current.add(taskId);
    // Auto-clear after 5 seconds in case the socket event never comes back
    setTimeout(() => {
      pendingUpdatesRef.current.delete(taskId);
    }, 5000);
  }, []);

  const value = {
    getSocket,
    isConnected,
    joinProject,
    leaveProject,
    joinTask,
    leaveTask,
    emitTypingStart,
    emitTypingStop,
    trackPendingUpdate,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketProvider;
