import { Server } from 'socket.io';
import { AuthenticatedSocket, UserPresenceData } from '../types/socket.types';
import { publisherClient } from '../config/redis';

// Store online users in memory (could be moved to Redis for multi-instance support)
const onlineUsers = new Map<string, UserPresenceData>();

/**
 * Handle user presence tracking
 */
export const setupPresenceHandlers = (io: Server, socket: AuthenticatedSocket) => {
  /**
   * Mark user as online when they connect
   */
  const handleUserOnline = async () => {
    if (!socket.userId || !socket.email) {
      return;
    }

    const presenceData: UserPresenceData = {
      userId: socket.userId,
      userName: socket.email.split('@')[0], // Simple username extraction
      email: socket.email,
      timestamp: new Date().toISOString(),
    };

    // Store in memory
    onlineUsers.set(socket.userId, presenceData);

    // Store in Redis with expiry (for multi-instance support)
    try {
      await publisherClient.setEx(
        `presence:${socket.userId}`,
        300, // 5 minutes TTL
        JSON.stringify(presenceData)
      );
    } catch (error) {
      console.error('Error storing presence in Redis:', error);
    }

    // Broadcast to all connected clients
    io.emit('user:online', presenceData);
    console.log(`User ${socket.userId} is now online`);
  };

  /**
   * Mark user as offline when they disconnect
   */
  const handleUserOffline = async () => {
    if (!socket.userId || !socket.email) {
      return;
    }

    const presenceData: UserPresenceData = {
      userId: socket.userId,
      userName: socket.email.split('@')[0],
      email: socket.email,
      timestamp: new Date().toISOString(),
    };

    // Remove from memory
    onlineUsers.delete(socket.userId);

    // Remove from Redis
    try {
      await publisherClient.del(`presence:${socket.userId}`);
    } catch (error) {
      console.error('Error removing presence from Redis:', error);
    }

    // Broadcast to all connected clients
    io.emit('user:offline', presenceData);
    console.log(`User ${socket.userId} is now offline`);
  };

  /**
   * Heartbeat mechanism to keep presence alive
   */
  socket.on('presence:heartbeat', async () => {
    if (!socket.userId) {
      return;
    }

    try {
      // Refresh TTL in Redis
      const presenceKey = `presence:${socket.userId}`;
      const exists = await publisherClient.exists(presenceKey);

      if (exists) {
        await publisherClient.expire(presenceKey, 300); // Reset to 5 minutes
      } else {
        // User was marked offline, mark them back online
        await handleUserOnline();
      }
    } catch (error) {
      console.error('Error handling heartbeat:', error);
    }
  });

  // Set up online presence when user connects
  handleUserOnline();

  // Handle offline presence when user disconnects
  socket.on('disconnect', () => {
    handleUserOffline();
  });
};

/**
 * Get list of currently online users
 */
export const getOnlineUsers = (): UserPresenceData[] => {
  return Array.from(onlineUsers.values());
};

/**
 * Check if a user is online
 */
export const isUserOnline = (userId: string): boolean => {
  return onlineUsers.has(userId);
};
