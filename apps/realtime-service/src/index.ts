import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { authenticateSocket } from './middleware/auth.middleware';
import { connectRedis, disconnectRedis } from './config/redis';
import { setupEventSubscriptions, cleanupEventSubscriptions } from './handlers/events.handler';
import { setupRoomHandlers } from './handlers/room.handler';
import { setupPresenceHandlers } from './handlers/presence.handler';
import { setupTypingHandlers } from './handlers/typing.handler';
import { AuthenticatedSocket, ClientToServerEvents, ServerToClientEvents } from './types/socket.types';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3004;

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

// Socket.io setup with TypeScript types
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'realtime-service' });
});

// Apply authentication middleware to all socket connections
io.use(authenticateSocket);

// Socket.io connection handler
io.on('connection', (socket: AuthenticatedSocket) => {
  console.log(`✅ Client connected: ${socket.id} (User: ${socket.userId})`);

  // Set up handlers for this socket connection
  setupRoomHandlers(io, socket);
  setupPresenceHandlers(io, socket);
  setupTypingHandlers(io, socket);

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log(`❌ Client disconnected: ${socket.id} (User: ${socket.userId}, Reason: ${reason})`);
  });

  // Handle errors
  socket.on('error', (error) => {
    console.error(`Socket error for ${socket.id}:`, error);
    socket.emit('error', 'An error occurred');
  });
});

// Initialize the server
const startServer = async () => {
  try {
    // Connect to Redis
    await connectRedis();

    // Set up Redis event subscriptions
    await setupEventSubscriptions(io);

    // Start HTTP server
    httpServer.listen(PORT, () => {
      console.log(`🚀 Realtime service running on port ${PORT}`);
      console.log(`📡 WebSocket server ready for connections`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = async () => {
  console.log('\n🛑 Shutting down gracefully...');

  try {
    // Close socket connections
    io.close(() => {
      console.log('Socket.io server closed');
    });

    // Cleanup Redis subscriptions
    await cleanupEventSubscriptions();

    // Disconnect from Redis
    await disconnectRedis();

    // Close HTTP server
    httpServer.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });

    // Force exit after 10 seconds
    setTimeout(() => {
      console.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  shutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  shutdown();
});

// Start the server
startServer();