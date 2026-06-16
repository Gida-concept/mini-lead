import './config/env.js';
import './config/database.js';

import { app } from './app.js';
import { env } from './config/env.js';

const HOST = '0.0.0.0';

const server = app.listen(env.PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${env.PORT}`);
});

// Graceful shutdown
function gracefulShutdown(signal: string) {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });

  // Force close after 10s
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
