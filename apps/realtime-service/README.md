# Real-time Service

WebSocket service for real-time collaboration features using Socket.io.

## Features

- **Authentication**: JWT-based socket authentication
- **Room Management**: Join/leave project and task rooms
- **Event Broadcasting**: Real-time task and comment updates
- **User Presence**: Track online/offline users
- **Typing Indicators**: Show when users are typing in task comments

## Architecture

The service subscribes to Redis pub/sub channels to receive events from other services (task-service, project-service) and broadcasts them to connected clients in the appropriate rooms.

```
Task Service → Redis Pub/Sub → Realtime Service → WebSocket → Clients
```

## Socket Events

### Client → Server

#### Room Management
- `join:project` - Join a project room to receive task updates
  ```typescript
  socket.emit('join:project', projectId: string)
  ```

- `leave:project` - Leave a project room
  ```typescript
  socket.emit('leave:project', projectId: string)
  ```

- `join:task` - Join a task room to receive comments and typing indicators
  ```typescript
  socket.emit('join:task', taskId: string)
  ```

- `leave:task` - Leave a task room
  ```typescript
  socket.emit('leave:task', taskId: string)
  ```

#### Typing Indicators
- `typing:start` - User started typing in task comments
  ```typescript
  socket.emit('typing:start', { taskId: string, userName: string })
  ```

- `typing:stop` - User stopped typing
  ```typescript
  socket.emit('typing:stop', { taskId: string })
  ```

#### Presence
- `presence:heartbeat` - Keep user presence alive
  ```typescript
  socket.emit('presence:heartbeat')
  ```

### Server → Client

#### Task Events
- `task:created` - New task created
  ```typescript
  socket.on('task:created', (data: TaskEventData) => {})
  ```

- `task:updated` - Task updated
  ```typescript
  socket.on('task:updated', (data: TaskEventData) => {})
  ```

- `task:deleted` - Task deleted
  ```typescript
  socket.on('task:deleted', (data: { taskId: string, projectId: string }) => {})
  ```

#### Comment Events
- `comment:added` - New comment added to task
  ```typescript
  socket.on('comment:added', (data: CommentEventData) => {})
  ```

#### Presence Events
- `user:online` - User came online
  ```typescript
  socket.on('user:online', (data: UserPresenceData) => {})
  ```

- `user:offline` - User went offline
  ```typescript
  socket.on('user:offline', (data: UserPresenceData) => {})
  ```

#### Typing Events
- `typing:user` - User is typing in task
  ```typescript
  socket.on('typing:user', (data: { taskId: string, userName: string, userId: string }) => {})
  ```

#### General Events
- `room:joined` - Confirmation of room join
  ```typescript
  socket.on('room:joined', (data: { room: 'project' | 'task', id: string }) => {})
  ```

- `room:left` - Confirmation of room leave
  ```typescript
  socket.on('room:left', (data: { room: 'project' | 'task', id: string }) => {})
  ```

- `error` - Error message
  ```typescript
  socket.on('error', (message: string) => {})
  ```

## Connection

### Client Example

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3004', {
  auth: {
    token: 'your-jwt-token'
  }
});

socket.on('connect', () => {
  console.log('Connected to realtime service');

  // Join a project room
  socket.emit('join:project', 'project-id');
});

socket.on('task:updated', (task) => {
  console.log('Task updated:', task);
  // Update UI with new task data
});

socket.on('user:online', (user) => {
  console.log('User came online:', user);
  // Update presence indicator
});
```

## Environment Variables

```env
PORT=3004
NODE_ENV=development

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Configuration (must match auth service)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# CORS
CORS_ORIGIN=http://localhost:5173
```

## Redis Channels

The service subscribes to these Redis channels:

- `task:created` - Published when a task is created
- `task:updated` - Published when a task is updated
- `task:deleted` - Published when a task is deleted
- `comment:added` - Published when a comment is added

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build
npm run build

# Type checking
npm run typecheck

# Run tests
npm test
```

## Implementation Details

### Room Naming
- Project rooms: `project:{projectId}`
- Task rooms: `task:{taskId}`

### Presence Tracking
- Users are automatically marked online on connection
- Users are marked offline on disconnection
- Heartbeat mechanism keeps presence alive (5-minute TTL in Redis)

### Typing Indicators
- Auto-stop after 10 seconds of inactivity
- Cleaned up on disconnect

### Error Handling
- Graceful shutdown on SIGTERM/SIGINT
- Automatic cleanup of Redis subscriptions
- Socket error handling and logging

## Testing

The service can be tested using:
1. Socket.io client library
2. Postman (supports WebSocket)
3. Browser DevTools (WebSocket tab)

## Security

- JWT authentication required for all connections
- Token validation on connect
- User ID attached to socket for authorization checks
