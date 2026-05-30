import http from 'http';
import path from 'path';
import express from 'express';
import { Server } from 'socket.io';
import app from './app';
import { connectDB } from './config/db';
import { env } from './config/env';
import { CORS_BUILD_ID, getAllowedOrigins, handleHttpPreflight, isOriginAllowed } from './lib/cors';
import jwt from 'jsonwebtoken';
import { prisma } from './lib/prisma';

/** Локальные uploads только если файлы не на Cloudinary */
const uploadsPath = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));

/** OPTIONS перехватываем ДО Express — иначе apiRouter может отдать 404 */
const server = http.createServer((req, res) => {
  console.log(
    `[RAW] ${req.method} ${req.url} | Origin: ${req.headers.origin ?? 'none'}`,
  );

  if (handleHttpPreflight(req, res)) {
    return;
  }

  app(req, res);
});

console.log('🚀 INDEX LOADED | CORS_BUILD_ID:', CORS_BUILD_ID);

const socketCorsOrigins = (
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void,
) => {
  if (isOriginAllowed(origin)) {
    callback(null, true);
  } else {
    callback(new Error(`CORS blocked: ${origin}`));
  }
};

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: socketCorsOrigins,
    credentials: true,
  },
});

// Socket.IO authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string };
    (socket as any).userId = decoded.userId;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
});

// Socket.IO connection handling
io.of('/support').on('connection', (socket) => {
  const userId = (socket as any).userId;

  console.log(`User connected: ${userId}`);

  // Join user to their own room
  socket.join(userId);

  // Handle incoming messages
  socket.on('message', async (data: { text: string }, callback: (response: any) => void) => {
    try {
      const message = await prisma.message.create({
        data: {
          userId,
          content: data.text,
          isAdmin: false,
          isRead: false,
        },
      });
      // Emit to admin room (you can implement admin rooms separately)
      io.of('/support').emit('newMessage', { userId, message });

      callback({ success: true, message });
    } catch (error) {
      callback({ success: false, error: 'Failed to send message' });
    }
  });

  // Admin-specific events
  socket.on('admin:message', async (data: { userId: string; text: string }, callback: (response: any) => void) => {
    try {
      const targetUserId = data.userId;

      const message = await prisma.message.create({
        data: {
          userId: targetUserId,
          content: data.text,
          isAdmin: true,
          isRead: true,
        },
      });

      // Send to specific user
      io.of('/support').to(targetUserId).emit('message', message);

      callback({ success: true, message });
    } catch (error) {
      callback({ success: false, error: 'Failed to send message' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${userId}`);
  });
});

// Render передаёт PORT динамически (не хардкодить 10000/5000)
const PORT = parseInt(process.env.PORT || '3000', 10);

connectDB()
  .then(() => {
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });

export default io;
