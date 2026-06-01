import http from 'http';
import fs from 'fs';
import express from 'express';
import app from './app';
import { connectDBWithRetry } from './config/dbRetry';
import { CORS_BUILD_ID } from './lib/cors';
import { initSocket, shutdownSocket } from './socket';
import { uploadsDir } from './middleware/upload';

const PORT = Number(process.env.PORT) || 10000;

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason, promise);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

console.log('🚀 INDEX LOADED | CORS_BUILD_ID:', CORS_BUILD_ID);

const server = http.createServer(app);
initSocket(server);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);

  setImmediate(() => {
    try {
      fs.mkdirSync(uploadsDir, { recursive: true });
      app.use('/uploads', express.static(uploadsDir));
    } catch (err) {
      console.error('[server] uploads setup failed:', err);
    }
    void connectDBWithRetry();
  });
});

function gracefulShutdown(signal: string) {
  console.log(`[server] ${signal} received, shutting down…`);
  void shutdownSocket().finally(() => {
    server.close(() => process.exit(0));
  });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export { server };
