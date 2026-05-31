import http from 'http';
import path from 'path';
import express from 'express';
import app from './app';
import { connectDB } from './config/db';
import { CORS_BUILD_ID } from './lib/cors';
import { initSocket, shutdownSocket } from './socket';

/** Локальные uploads только если файлы не на Cloudinary */
const uploadsPath = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));

/**
 * Важно: передаём Express app напрямую в createServer.
 * Обёртка (req, res) => app(req, res) ломала Socket.io — запросы /socket.io
 * уходили в Express и возвращали 404/503 вместо upgrade.
 */
const server = http.createServer(app);

console.log('🚀 INDEX LOADED | CORS_BUILD_ID:', CORS_BUILD_ID);

initSocket(server);

const PORT = Number(process.env.PORT) || 3000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  void connectDB().catch((err) => {
    console.error('Failed to connect to database:', err);
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
