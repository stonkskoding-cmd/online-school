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

    const decoded = jwt.verify(token, env.JWT_SECRET) as { userId?: string; role?: string };
    if (decoded.role === 'admin') {
      (socket as any).userId = 'admin';
      (socket as any).isAdmin = true;
      console.log('[socket] admin connected');
      return next();
    }
    if (!decoded.userId) {
      return next(new Error('Authentication error'));
    }
    (socket as any).userId = decoded.userId;
    next();
  } catch (error) {
    console.error('[socket] auth failed', error);
    next(new Error('Authentication error'));
  }
});

function emitToUser(userId: string, message: unknown) {
  io.of('/support').to(userId).emit('message', message);
  io.of('/support').to(userId).emit('receive_message', message);
}

async function handleUserMessage(
  socket: import('socket.io').Socket,
  data: { text: string },
  callback: (response: { success: boolean; message?: unknown; error?: string }) => void,
) {
  const userId = (socket as any).userId as string;
  try {
    console.log('[socket] send_message from', userId, 'len:', data.text?.length);
    const message = await prisma.message.create({
      data: {
        userId,
        content: data.text,
        isAdmin: false,
        isRead: false,
      },
    });
    io.of('/support').emit('newMessage', { userId, message });
    emitToUser(userId, message);
    callback({ success: true, message });
  } catch (error) {
    console.error('[socket] send_message failed', error);
    callback({ success: false, error: 'Failed to send message' });
  }
}

// Socket.IO connection handling
io.of('/support').on('connection', (socket) => {
  const userId = (socket as any).userId;

  console.log(`[socket] User connected: ${userId}`);

  if (userId !== 'admin') {
    socket.join(userId);
    socket.on('message', (data, callback) => handleUserMessage(socket, data, callback));
    socket.on('send_message', (data, callback) => handleUserMessage(socket, data, callback));
  }

  socket.on('admin:message', async (data: { userId: string; text: string }, callback: (response: any) => void) => {
    try {
      const targetUserId = data.userId;
      console.log('[socket] admin:message to', targetUserId);

      const message = await prisma.message.create({
        data: {
          userId: targetUserId,
          content: data.text,
          isAdmin: true,
          isRead: true,
        },
      });

      emitToUser(targetUserId, message);
      callback({ success: true, message });
    } catch (error) {
      console.error('[socket] admin:message failed', error);
      callback({ success: false, error: 'Failed to send message' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`[socket] User disconnected: ${userId}`);
  });
});

// Render: слушаем PORT сразу (Socket.IO на http.Server, не app.listen)
const PORT = Number(process.env.PORT) || 3000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  void connectDB().catch((err) => {
    console.error('Failed to connect to database:', err);
  });
});

export default io;
