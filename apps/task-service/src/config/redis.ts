import { createClient } from 'redis';

const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
  password: process.env.REDIS_PASSWORD || undefined,
});

// Publisher client for pub/sub
export const redisPublisher = createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
  password: process.env.REDIS_PASSWORD || undefined,
});

redisClient.on('error', (err) => {
  console.error('Redis error:', err);
});

redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

redisPublisher.on('error', (err) => {
  console.error('Redis Publisher error:', err);
});

redisPublisher.on('connect', () => {
  console.log('Redis Publisher connected');
});

// Connect to Redis
(async () => {
  try {
    await redisClient.connect();
    await redisPublisher.connect();
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
  }
})();

export default redisClient;