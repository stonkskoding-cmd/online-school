import http from 'http';
import { Server } from 'socket.io';
import app from './app';
import { connectDB } from './config/db';
import { env } from './config/env';
import { Message } from './models/Message';
import jwt from 'jsonwebtoken';

const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: env.CLIENT_URL,
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
      const message = new Message({
        userId,
        text: data.text,
        isFromAdmin: false,
      });
      await message.save();

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
      
      const message = new Message({
        userId: targetUserId,
        text: data.text,
        isFromAdmin: true,
      });
      await message.save();

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

// Start server
const PORT = env.PORT || 5000;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

export default io;
