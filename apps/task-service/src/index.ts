import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'task-service' });
});

// Basic routes placeholder
app.get('/api/tasks', (_req, res) => {
  res.json({ message: 'Task service is running' });
});

app.listen(PORT, () => {
  console.log(`Task service running on port ${PORT}`);
});