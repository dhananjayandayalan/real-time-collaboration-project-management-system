import { Server } from 'socket.io';
import { subscriberClient, REDIS_CHANNELS } from '../config/redis';
import {
  TaskEventData,
  CommentEventData,
} from '../types/socket.types';

/**
 * Set up Redis event subscriptions and broadcast to socket rooms
 */
export const setupEventSubscriptions = async (io: Server) => {
  try {
    // Subscribe to task:created events
    await subscriberClient.subscribe(REDIS_CHANNELS.TASK_CREATED, (message) => {
      try {
        const data = JSON.parse(message) as TaskEventData;
        const roomName = `project:${data.projectId}`;

        // Broadcast to all users in the project room
        io.to(roomName).emit('task:created', data);
        console.log(`Broadcasted task:created to ${roomName}`, data.id);
      } catch (error) {
        console.error('Error processing task:created event:', error);
      }
    });

    // Subscribe to task:updated events
    await subscriberClient.subscribe(REDIS_CHANNELS.TASK_UPDATED, (message) => {
      try {
        const data = JSON.parse(message) as TaskEventData;
        const roomName = `project:${data.projectId}`;

        // Broadcast to all users in the project room
        io.to(roomName).emit('task:updated', data);
        console.log(`Broadcasted task:updated to ${roomName}`, data.id);
      } catch (error) {
        console.error('Error processing task:updated event:', error);
      }
    });

    // Subscribe to task:deleted events
    await subscriberClient.subscribe(REDIS_CHANNELS.TASK_DELETED, (message) => {
      try {
        const data = JSON.parse(message) as { taskId: string; projectId: string };
        const roomName = `project:${data.projectId}`;

        // Broadcast to all users in the project room
        io.to(roomName).emit('task:deleted', data);
        console.log(`Broadcasted task:deleted to ${roomName}`, data.taskId);
      } catch (error) {
        console.error('Error processing task:deleted event:', error);
      }
    });

    // Subscribe to comment:added events
    await subscriberClient.subscribe(REDIS_CHANNELS.COMMENT_ADDED, (message) => {
      try {
        const data = JSON.parse(message) as CommentEventData;
        const taskRoomName = `task:${data.taskId}`;
        const projectRoomName = `project:${data.projectId}`;

        // Broadcast to users in the task room (for live comment updates)
        io.to(taskRoomName).emit('comment:added', data);

        // Also broadcast to project room (for notifications)
        io.to(projectRoomName).emit('comment:added', data);

        console.log(`Broadcasted comment:added to ${taskRoomName} and ${projectRoomName}`);
      } catch (error) {
        console.error('Error processing comment:added event:', error);
      }
    });

    console.log('✅ Subscribed to all Redis channels');
  } catch (error) {
    console.error('Failed to set up event subscriptions:', error);
    throw error;
  }
};

/**
 * Unsubscribe from all Redis channels
 */
export const cleanupEventSubscriptions = async () => {
  try {
    await subscriberClient.unsubscribe();
    console.log('Unsubscribed from all Redis channels');
  } catch (error) {
    console.error('Error unsubscribing from Redis channels:', error);
  }
};
