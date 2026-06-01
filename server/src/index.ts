import http from 'http';
import fs from 'fs';
import express from 'express';
import app from './app';
import { connectDBWithRetry } from './config/dbRetry';
import { CORS_BUILD_ID } from './lib/cors';
import { initSocket, shutdownSocket } from './socket';
import { uploadsDir } from './middleware/upload';

fs.mkdirSync(uploadsDir, { recursive: true });

app.use('/uploads', express.static(uploadsDir));

const server = http.createServer(app);

console.log('🚀 INDEX LOADED | CORS_BUILD_ID:', CORS_BUILD_ID);

initSocket(server);

const PORT = Number(process.env.PORT) || 3000;

/** Сначала порт — Render перестаёт отдавать 503; БД подключаем асинхронно */
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

process.on('uncaughtException', (err) => {
  console.error('[server] uncaughtException:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[server] unhandledRejection:', reason);
});

export { server };
