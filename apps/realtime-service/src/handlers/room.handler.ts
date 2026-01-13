import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../types/socket.types';

/**
 * Handle room management for projects and tasks
 */
export const setupRoomHandlers = (_io: Server, socket: AuthenticatedSocket) => {
  /**
   * Join a project room
   * Users in a project room will receive all updates for tasks in that project
   */
  socket.on('join:project', (projectId: string) => {
    try {
      if (!projectId) {
        socket.emit('error', 'Project ID is required');
        return;
      }

      const roomName = `project:${projectId}`;
      socket.join(roomName);
      console.log(`User ${socket.userId} joined project room: ${roomName}`);

      // Notify the user they've joined successfully
      socket.emit('room:joined', { room: 'project', id: projectId });
    } catch (error) {
      console.error('Error joining project room:', error);
      socket.emit('error', 'Failed to join project room');
    }
  });

  /**
   * Leave a project room
   */
  socket.on('leave:project', (projectId: string) => {
    try {
      if (!projectId) {
        socket.emit('error', 'Project ID is required');
        return;
      }

      const roomName = `project:${projectId}`;
      socket.leave(roomName);
      console.log(`User ${socket.userId} left project room: ${roomName}`);

      // Notify the user they've left
      socket.emit('room:left', { room: 'project', id: projectId });
    } catch (error) {
      console.error('Error leaving project room:', error);
      socket.emit('error', 'Failed to leave project room');
    }
  });

  /**
   * Join a task room
   * Users in a task room will receive detailed updates like comments and typing indicators
   */
  socket.on('join:task', (taskId: string) => {
    try {
      if (!taskId) {
        socket.emit('error', 'Task ID is required');
        return;
      }

      const roomName = `task:${taskId}`;
      socket.join(roomName);
      console.log(`User ${socket.userId} joined task room: ${roomName}`);

      // Notify the user they've joined successfully
      socket.emit('room:joined', { room: 'task', id: taskId });
    } catch (error) {
      console.error('Error joining task room:', error);
      socket.emit('error', 'Failed to join task room');
    }
  });

  /**
   * Leave a task room
   */
  socket.on('leave:task', (taskId: string) => {
    try {
      if (!taskId) {
        socket.emit('error', 'Task ID is required');
        return;
      }

      const roomName = `task:${taskId}`;
      socket.leave(roomName);
      console.log(`User ${socket.userId} left task room: ${roomName}`);

      // Notify the user they've left
      socket.emit('room:left', { room: 'task', id: taskId });
    } catch (error) {
      console.error('Error leaving task room:', error);
      socket.emit('error', 'Failed to leave task room');
    }
  });
};
