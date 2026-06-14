import http from 'http';
import jwt from 'jsonwebtoken';
import { Server, Socket } from 'socket.io';
import { Message } from '@prisma/client';
import { env } from './config/env';
import { prisma } from './lib/prisma';

export type SocketUser = {
  userId: string;
  isAdmin: boolean;
};

let ioInstance: Server | null = null;

function userRoom(userId: string) {
  return `chat_${userId}`;
}

function parseContent(data: { content?: string; text?: string }): string {
  return String(data.content ?? data.text ?? '').trim();
}

export function emitNewMessage(userId: string, message: Message) {
  if (!ioInstance) return;
  const ns = ioInstance.of('/support');
  const payload = { userId, message };
  ns.to(userRoom(userId)).emit('new_message', payload);
  ns.to(userId).emit('new_message', payload);
  ns.to(userId).emit('message', message);
  ns.to(userId).emit('receive_message', message);
  ns.to('admin_panel').emit('new_message', payload);
  ns.to('admin_panel').emit('newMessage', payload);
}

export function getIo(): Server | null {
  return ioInstance;
}

export function initSocket(httpServer: http.Server): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    },
    transports: ['websocket', 'polling'],
    allowUpgrades: true,
    pingTimeout: 60000,
    pingInterval: 25000,
    connectTimeout: 10000,
    path: '/socket.io',
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token as string | undefined;
      if (!token) return next(new Error('Authentication error'));

      const decoded = jwt.verify(token, env.JWT_SECRET) as {
        userId?: string;
        id?: string;
        sub?: string;
        role?: string;
      };
      if (decoded.role === 'admin') {
        socket.data.user = { userId: 'admin', isAdmin: true } satisfies SocketUser;
        return next();
      }
      const socketUserId = decoded.userId ?? decoded.id ?? decoded.sub;
      if (!socketUserId || !String(socketUserId).trim()) {
        return next(new Error('Authentication error'));
      }
      socket.data.user = { userId: String(socketUserId).trim(), isAdmin: false } satisfies SocketUser;
      next();
    } catch (error) {
      console.error('[socket] auth failed', error);
      next(new Error('Authentication error'));
    }
  });

  const supportNs = io.of('/support');

  supportNs.on('connection', (socket: Socket) => {
    const user = socket.data.user as SocketUser;

    if (user.isAdmin) {
      socket.join('admin_panel');
      socket.on('join_admin', () => {
        socket.join('admin_panel');
      });
    } else {
      socket.join(userRoom(user.userId));
      socket.join(user.userId);
    }

    const handleUserSend = async (
      data: { content?: string; text?: string },
      callback?: (response: { success: boolean; message?: unknown; error?: string }) => void,
    ) => {
      try {
        const content = parseContent(data);
        if (!content) {
          callback?.({ success: false, error: 'Empty message' });
          return;
        }
        const message = await prisma.message.create({
          data: {
            senderId: user.userId,
            content,
            isAdmin: false,
            isRead: false,
          },
        });
        emitNewMessage(user.userId, message);
        callback?.({ success: true, message });
      } catch (error) {
        console.error('[socket] send_message failed', error);
        callback?.({ success: false, error: 'Failed to send message' });
      }
    };

    if (!user.isAdmin) {
      socket.on('send_message', handleUserSend);
      socket.on('message', handleUserSend);
    }

    socket.on(
      'admin:message',
      async (
        data: { userId: string; content?: string; text?: string },
        callback?: (response: { success: boolean; message?: unknown; error?: string }) => void,
      ) => {
        if (!user.isAdmin) {
          callback?.({ success: false, error: 'Forbidden' });
          return;
        }
        try {
          const targetUserId = data.userId;
          const content = parseContent(data);
          if (!targetUserId || !content) {
            callback?.({ success: false, error: 'Invalid payload' });
            return;
          }
          const message = await prisma.message.create({
            data: {
              senderId: targetUserId,
              content,
              isAdmin: true,
              isRead: false,
            },
          });
          emitNewMessage(targetUserId, message);
          callback?.({ success: true, message });
        } catch (error) {
          console.error('[socket] admin:message failed', error);
          callback?.({ success: false, error: 'Failed to send message' });
        }
      },
    );

    socket.on('mark_read', async (data: { userId?: string }, callback?: (r: { success: boolean }) => void) => {
      try {
        const targetUserId = user.isAdmin ? data.userId : user.userId;
        if (!targetUserId) {
          callback?.({ success: false });
          return;
        }
        if (!user.isAdmin && targetUserId !== user.userId) {
          callback?.({ success: false });
          return;
        }
        await prisma.message.updateMany({
          where: { senderId: targetUserId, isAdmin: false, isRead: false },
          data: { isRead: true },
        });
        callback?.({ success: true });
      } catch (error) {
        console.error('[socket] mark_read failed', error);
        callback?.({ success: false });
      }
    });

    socket.on('disconnect', () => {
      /* noop */
    });
  });

  ioInstance = io;
  return io;
}

export function shutdownSocket(): Promise<void> {
  return new Promise((resolve) => {
    if (!ioInstance) {
      resolve();
      return;
    }
    ioInstance.close(() => {
      ioInstance = null;
      resolve();
    });
  });
}
