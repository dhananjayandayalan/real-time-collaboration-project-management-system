import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'auth-service' });
});

// Basic routes placeholder
app.get('/api/auth', (_req, res) => {
  res.json({ message: 'Auth service is running' });
});

app.listen(PORT, () => {
  console.log(`Auth service running on port ${PORT}`);
});