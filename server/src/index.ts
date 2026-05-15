import http from 'http';
import path from 'path';
import express from 'express';
import { Server } from 'socket.io';
import app from './app';
import { connectDB } from './config/db';
import { corsAllowedOrigins, env } from './config/env';
import jwt from 'jsonwebtoken';
import { prisma } from './lib/prisma';

/** Локальные uploads только если файлы не на Cloudinary */
const uploadsPath = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));

const server = http.createServer(app);

const socketCorsOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? socketCorsOrigin : corsAllowedOrigins,
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

// Start server (Render задаёт PORT через окружение)
const PORT = parseInt(process.env.PORT || String(env.PORT || 5000), 10);

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

export default io;
