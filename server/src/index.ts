import http from 'http';
import fs from 'fs';
import path from 'path';
import express from 'express';
import app from './app';
import { connectDBWithRetry } from './config/dbRetry';
import { CORS_BUILD_ID } from './lib/cors';
import { initSocket, shutdownSocket } from './socket';
import { uploadsDir } from './middleware/upload';

fs.mkdirSync(uploadsDir, { recursive: true });

/** Статика uploads — обложки и материалы */
app.use('/uploads', express.static(uploadsDir));

const server = http.createServer(app);

console.log('🚀 INDEX LOADED | CORS_BUILD_ID:', CORS_BUILD_ID);

initSocket(server);

const PORT = Number(process.env.PORT) || 3000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server and Socket.io running on port ${PORT}`);
  void connectDBWithRetry();
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
