import { Server } from 'socket.io';
import { AuthenticatedSocket, RoomMemberData } from '../types/socket.types';
import { publisherClient } from '../config/redis';

// Redis key prefixes for room members
const ROOM_MEMBERS_PREFIX = 'room:members:';
const MEMBER_TTL = 3600; // 1 hour TTL for member data

/**
 * Get Redis key for room members
 */
const getRoomMembersKey = (roomType: 'project' | 'task', roomId: string): string => {
  return `${ROOM_MEMBERS_PREFIX}${roomType}:${roomId}`;
};

/**
 * Add a member to a room in Redis
 */
const addRoomMember = async (
  roomType: 'project' | 'task',
  roomId: string,
  userId: string,
  userName: string,
  email?: string
): Promise<RoomMemberData[]> => {
  const key = getRoomMembersKey(roomType, roomId);
  const memberData: RoomMemberData = {
    userId,
    userName,
    email,
    joinedAt: new Date().toISOString(),
  };

  try {
    // Add member to hash
    await publisherClient.hSet(key, userId, JSON.stringify(memberData));
    // Refresh TTL
    await publisherClient.expire(key, MEMBER_TTL);

    // Get all members
    const allMembers = await publisherClient.hGetAll(key);
    return Object.values(allMembers).map(m => JSON.parse(m));
  } catch (error) {
    console.error('Error adding room member:', error);
    return [];
  }
};

/**
 * Remove a member from a room in Redis
 */
const removeRoomMember = async (
  roomType: 'project' | 'task',
  roomId: string,
  userId: string
): Promise<void> => {
  const key = getRoomMembersKey(roomType, roomId);
  try {
    await publisherClient.hDel(key, userId);
  } catch (error) {
    console.error('Error removing room member:', error);
  }
};

/**
 * Remove user from all rooms they're in (called on disconnect)
 */
export const removeUserFromAllRooms = async (
  _io: Server,
  socket: AuthenticatedSocket
): Promise<void> => {
  const userId = socket.userId;
  if (!userId) return;

  // Get all rooms the socket is in
  const rooms = Array.from(socket.rooms);

  for (const room of rooms) {
    if (room.startsWith('project:')) {
      const projectId = room.replace('project:', '');
      await removeRoomMember('project', projectId, userId);

      // Notify others in the room
      socket.to(room).emit('room:userLeft', {
        roomType: 'project',
        roomId: projectId,
        userId,
      });
    } else if (room.startsWith('task:')) {
      const taskId = room.replace('task:', '');
      await removeRoomMember('task', taskId, userId);

      // Notify others in the room
      socket.to(room).emit('room:userLeft', {
        roomType: 'task',
        roomId: taskId,
        userId,
      });
    }
  }
};

/**
 * Handle room management for projects and tasks
 */
export const setupRoomHandlers = (io: Server, socket: AuthenticatedSocket) => {
  /**
   * Join a project room
   * Users in a project room will receive all updates for tasks in that project
   */
  socket.on('join:project', async (projectId: string) => {
    try {
      if (!projectId) {
        socket.emit('error', 'Project ID is required');
        return;
      }

      const userId = socket.userId || 'unknown';
      const userName = socket.email?.split('@')[0] || 'Unknown User';
      const roomName = `project:${projectId}`;

      socket.join(roomName);
      console.log(`User ${socket.userId} joined project room: ${roomName}`);

      // Add member to Redis and get all members
      const members = await addRoomMember('project', projectId, userId, userName, socket.email);

      // Send current members to the joining user
      socket.emit('room:members', {
        roomType: 'project',
        roomId: projectId,
        members,
      });

      // Notify others that a new user joined
      const newMember: RoomMemberData = {
        userId,
        userName,
        email: socket.email,
        joinedAt: new Date().toISOString(),
      };
      socket.to(roomName).emit('room:userJoined', {
        roomType: 'project',
        roomId: projectId,
        user: newMember,
      });

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
  socket.on('leave:project', async (projectId: string) => {
    try {
      if (!projectId) {
        socket.emit('error', 'Project ID is required');
        return;
      }

      const userId = socket.userId || 'unknown';
      const roomName = `project:${projectId}`;

      socket.leave(roomName);
      console.log(`User ${socket.userId} left project room: ${roomName}`);

      // Remove member from Redis
      await removeRoomMember('project', projectId, userId);

      // Notify others that user left
      io.to(roomName).emit('room:userLeft', {
        roomType: 'project',
        roomId: projectId,
        userId,
      });

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
  socket.on('join:task', async (taskId: string) => {
    try {
      if (!taskId) {
        socket.emit('error', 'Task ID is required');
        return;
      }

      const userId = socket.userId || 'unknown';
      const userName = socket.email?.split('@')[0] || 'Unknown User';
      const roomName = `task:${taskId}`;

      socket.join(roomName);
      console.log(`User ${socket.userId} joined task room: ${roomName}`);

      // Add member to Redis and get all members
      const members = await addRoomMember('task', taskId, userId, userName, socket.email);

      // Send current members to the joining user
      socket.emit('room:members', {
        roomType: 'task',
        roomId: taskId,
        members,
      });

      // Notify others that a new user joined
      const newMember: RoomMemberData = {
        userId,
        userName,
        email: socket.email,
        joinedAt: new Date().toISOString(),
      };
      socket.to(roomName).emit('room:userJoined', {
        roomType: 'task',
        roomId: taskId,
        user: newMember,
      });

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
  socket.on('leave:task', async (taskId: string) => {
    try {
      if (!taskId) {
        socket.emit('error', 'Task ID is required');
        return;
      }

      const userId = socket.userId || 'unknown';
      const roomName = `task:${taskId}`;

      socket.leave(roomName);
      console.log(`User ${socket.userId} left task room: ${roomName}`);

      // Remove member from Redis
      await removeRoomMember('task', taskId, userId);

      // Notify others that user left
      io.to(roomName).emit('room:userLeft', {
        roomType: 'task',
        roomId: taskId,
        userId,
      });

      // Notify the user they've left
      socket.emit('room:left', { room: 'task', id: taskId });
    } catch (error) {
      console.error('Error leaving task room:', error);
      socket.emit('error', 'Failed to leave task room');
    }
  });

  // Handle disconnect to clean up room memberships
  socket.on('disconnect', async () => {
    await removeUserFromAllRooms(io, socket);
  });
};
