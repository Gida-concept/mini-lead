import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { cors } from './middleware/cors.js';
import { logger } from './middleware/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import routes from './routes/index.js';
import { env } from './config/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Global middleware
app.use(cors);
app.use(logger);
app.use(express.json({ limit: '10mb' }));

// Health check (before API routes)
app.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

// Mount all API routes under /api/
app.use('/api', routes);

// ---------------------------------------------------------------------------
// Serve the frontend static export in production
// ---------------------------------------------------------------------------
const clientOutDir = path.resolve(__dirname, '../../client/out');
if (env.NODE_ENV === 'production' && fs.existsSync(clientOutDir)) {
  // Serve all static files (JS, CSS, images, etc.)
  app.use(express.static(clientOutDir, { extensions: ['html'] }));

  // SPA catch-all: for any non-API route, serve the corresponding static HTML file
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Not found' } });
      return;
    }

    // Strip trailing slash and map to flat HTML file
    const cleanPath = req.path.replace(/\/$/, '') || '/';
    const htmlPath = path.join(clientOutDir, cleanPath === '/' ? 'index.html' : `${cleanPath}.html`);

    if (fs.existsSync(htmlPath)) {
      res.sendFile(htmlPath);
    } else {
      // Fallback to index.html (for unknown client-side routes)
      res.sendFile(path.join(clientOutDir, 'index.html'));
    }
  });
} else if (env.NODE_ENV === 'production') {
  console.log(`[app] client/out not found at ${clientOutDir} — frontend not served`);
}

// Global error handler (must be last)
app.use(errorHandler);

export { app };
