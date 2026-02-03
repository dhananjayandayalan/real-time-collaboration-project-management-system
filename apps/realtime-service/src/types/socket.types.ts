import { Socket } from 'socket.io';

// Extend Socket with user info
export interface AuthenticatedSocket extends Socket {
  userId?: string;
  email?: string;
}

// Client to Server events
export interface ClientToServerEvents {
  'join:project': (projectId: string) => void;
  'leave:project': (projectId: string) => void;
  'join:task': (taskId: string) => void;
  'leave:task': (taskId: string) => void;
  'typing:start': (data: { taskId: string; userName: string }) => void;
  'typing:stop': (data: { taskId: string }) => void;
}

// Room member data
export interface RoomMemberData {
  userId: string;
  userName: string;
  email?: string;
  joinedAt: string;
}

// Server to Client events
export interface ServerToClientEvents {
  'task:created': (data: TaskEventData) => void;
  'task:updated': (data: TaskEventData) => void;
  'task:deleted': (data: { taskId: string; projectId: string }) => void;
  'comment:added': (data: CommentEventData) => void;
  'user:online': (data: UserPresenceData) => void;
  'user:offline': (data: UserPresenceData) => void;
  'typing:user': (data: { taskId: string; userName: string; userId: string }) => void;
  'typing:stopped': (data: { taskId: string; userId: string }) => void;
  'room:joined': (data: { room: string; id: string }) => void;
  'room:left': (data: { room: string; id: string }) => void;
  'room:members': (data: { roomType: 'project' | 'task'; roomId: string; members: RoomMemberData[] }) => void;
  'room:userJoined': (data: { roomType: 'project' | 'task'; roomId: string; user: RoomMemberData }) => void;
  'room:userLeft': (data: { roomType: 'project' | 'task'; roomId: string; userId: string }) => void;
  error: (message: string) => void;
}

// Event data types
export interface TaskEventData {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  type: string;
  assigneeId?: string;
  reporterId: string;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CommentEventData {
  id: string;
  taskId: string;
  projectId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
}

export interface UserPresenceData {
  userId: string;
  userName: string;
  email: string;
  projectId?: string;
  timestamp: string;
}

// Redis event types
export interface RedisTaskEvent {
  eventType: 'task:created' | 'task:updated' | 'task:deleted';
  data: TaskEventData | { taskId: string; projectId: string };
}

export interface RedisCommentEvent {
  eventType: 'comment:added';
  data: CommentEventData;
}

export type RedisEvent = RedisTaskEvent | RedisCommentEvent;
