import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../types/socket.types';

// Store typing users with timeout references
const typingUsers = new Map<string, Map<string, NodeJS.Timeout>>();

/**
 * Handle typing indicators for task comments
 */
export const setupTypingHandlers = (io: Server, socket: AuthenticatedSocket) => {
  /**
   * User started typing
   */
  socket.on('typing:start', (data: { taskId: string; userName: string }) => {
    try {
      const { taskId, userName } = data;

      if (!taskId) {
        socket.emit('error', 'Task ID is required');
        return;
      }

      if (!socket.userId) {
        return;
      }

      const roomName = `task:${taskId}`;

      // Initialize typing users map for this task if not exists
      if (!typingUsers.has(taskId)) {
        typingUsers.set(taskId, new Map());
      }

      const taskTypingUsers = typingUsers.get(taskId)!;

      // Clear existing timeout for this user if any
      const existingTimeout = taskTypingUsers.get(socket.userId);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      // Broadcast typing indicator to task room (excluding sender)
      socket.to(roomName).emit('typing:user', {
        taskId,
        userName: userName || socket.email?.split('@')[0] || 'Unknown User',
        userId: socket.userId,
      });

      // Set auto-stop timeout (10 seconds)
      const timeout = setTimeout(() => {
        handleTypingStop(taskId, socket.userId!, roomName);
      }, 10000);

      taskTypingUsers.set(socket.userId, timeout);

      console.log(`User ${socket.userId} started typing in task ${taskId}`);
    } catch (error) {
      console.error('Error handling typing start:', error);
      socket.emit('error', 'Failed to process typing indicator');
    }
  });

  /**
   * User stopped typing
   */
  socket.on('typing:stop', (data: { taskId: string }) => {
    try {
      const { taskId } = data;

      if (!taskId || !socket.userId) {
        return;
      }

      const roomName = `task:${taskId}`;
      handleTypingStop(taskId, socket.userId, roomName);

      console.log(`User ${socket.userId} stopped typing in task ${taskId}`);
    } catch (error) {
      console.error('Error handling typing stop:', error);
    }
  });

  /**
   * Clean up typing indicators when user disconnects
   */
  socket.on('disconnect', () => {
    if (!socket.userId) {
      return;
    }

    // Clear all typing indicators for this user
    typingUsers.forEach((taskTypingUsers, taskId) => {
      const timeout = taskTypingUsers.get(socket.userId!);
      if (timeout) {
        clearTimeout(timeout);
        taskTypingUsers.delete(socket.userId!);

        // Notify the task room that user stopped typing
        const roomName = `task:${taskId}`;
        io.to(roomName).emit('typing:stop', {
          taskId,
          userId: socket.userId,
        });
      }
    });
  });
};

/**
 * Helper function to handle typing stop
 */
const handleTypingStop = (taskId: string, userId: string, _roomName: string) => {
  const taskTypingUsers = typingUsers.get(taskId);

  if (taskTypingUsers) {
    const timeout = taskTypingUsers.get(userId);
    if (timeout) {
      clearTimeout(timeout);
    }
    taskTypingUsers.delete(userId);

    // Clean up task entry if no users are typing
    if (taskTypingUsers.size === 0) {
      typingUsers.delete(taskId);
    }
  }
};

/**
 * Get users currently typing in a task
 */
export const getTypingUsers = (taskId: string): string[] => {
  const taskTypingUsers = typingUsers.get(taskId);
  return taskTypingUsers ? Array.from(taskTypingUsers.keys()) : [];
};
