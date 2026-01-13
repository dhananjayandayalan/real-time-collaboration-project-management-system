import { createClient } from 'redis';

// Create Redis clients for pub/sub
// We need separate clients for publishing and subscribing
const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
const redisPassword = process.env.REDIS_PASSWORD || undefined;

// Subscriber client - listens to events from other services
export const subscriberClient = createClient({
  socket: {
    host: redisHost,
    port: redisPort,
  },
  password: redisPassword,
});

// Publisher client - publishes events (if needed)
export const publisherClient = createClient({
  socket: {
    host: redisHost,
    port: redisPort,
  },
  password: redisPassword,
});

// Handle connection errors
subscriberClient.on('error', (err) => {
  console.error('Redis Subscriber Client Error:', err);
});

publisherClient.on('error', (err) => {
  console.error('Redis Publisher Client Error:', err);
});

// Connect to Redis
export const connectRedis = async () => {
  try {
    await subscriberClient.connect();
    console.log('Redis subscriber connected');

    await publisherClient.connect();
    console.log('Redis publisher connected');
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    throw error;
  }
};

// Disconnect from Redis
export const disconnectRedis = async () => {
  await subscriberClient.quit();
  await publisherClient.quit();
  console.log('Redis clients disconnected');
};

// Redis channels for events
export const REDIS_CHANNELS = {
  TASK_CREATED: 'task:created',
  TASK_UPDATED: 'task:updated',
  TASK_DELETED: 'task:deleted',
  COMMENT_ADDED: 'comment:added',
} as const;
