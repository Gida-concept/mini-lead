import corsMiddleware from 'cors';
import { env } from '../config/env.js';

const corsOptions: corsMiddleware.CorsOptions = {
  // In production (Fly.io), frontend and backend are on the same origin,
  // but still allow the configured origin for flexibility.
  origin: env.CORS_ORIGIN || ['http://localhost:3000'],
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

export const cors = corsMiddleware(corsOptions);
