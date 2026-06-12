import express from 'express';
import { cors } from './middleware/cors.js';
import { logger } from './middleware/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import routes from './routes/index.js';

const app = express();

// Global middleware
app.use(cors);
app.use(logger);
app.use(express.json({ limit: '10mb' }));

// Mount all routes under /api/
app.use('/api', routes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

// Global error handler (must be last)
app.use(errorHandler);

export { app };
