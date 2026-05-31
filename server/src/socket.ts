import http from 'http';
import jwt from 'jsonwebtoken';
import { Server, Socket } from 'socket.io';
import { env } from './config/env';
import { isOriginAllowed } from './lib/cors';
import { prisma } from './lib/prisma';

export type SocketUser = {
  userId: string;
  isAdmin: boolean;
};

let ioInstance: Server | null = null;

function userRoom(userId: string) {
  return `chat_${userId}`;
}

function serializeMessage(msg: {
  id: number;
  userId: string;
  content: string;
  isAdmin: boolean;
  isRead: boolean;
  createdAt: Date;
}) {
  return {
    id: msg.id,
    userId: msg.userId,
    content: msg.content,
    isAdmin: msg.isAdmin,
    isRead: msg.isRead,
    createdAt: msg.createdAt,
  };
}

export function emitNewMessage(userId: string, message: ReturnType<typeof serializeMessage>) {
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
      origin: (origin, callback) => {
        if (!origin || isOriginAllowed(origin)) {
          callback(null, origin ?? true);
        } else {
          console.warn('[socket] CORS blocked origin:', origin);
          callback(null, false);
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'OPTIONS'],
    },
    transports: ['websocket', 'polling'],
    allowUpgrades: true,
    pingTimeout: 60000,
    pingInterval: 25000,
    connectTimeout: 45000,
    path: '/socket.io',
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token as string | undefined;
      if (!token) return next(new Error('Authentication error'));

      const decoded = jwt.verify(token, env.JWT_SECRET) as { userId?: string; role?: string };
      if (decoded.role === 'admin') {
        socket.data.user = { userId: 'admin', isAdmin: true } satisfies SocketUser;
        console.log('[socket] admin auth ok');
        return next();
      }
      if (!decoded.userId) return next(new Error('Authentication error'));
      socket.data.user = { userId: decoded.userId, isAdmin: false } satisfies SocketUser;
      next();
    } catch (error) {
      console.error('[socket] auth failed', error);
      next(new Error('Authentication error'));
    }
  });

  const supportNs = io.of('/support');

  supportNs.on('connection', (socket: Socket) => {
    const user = socket.data.user as SocketUser;
    console.log('[socket] connected', user.userId, user.isAdmin ? 'admin' : 'user');

    if (user.isAdmin) {
      socket.join('admin_panel');
      socket.on('join_admin', () => {
        socket.join('admin_panel');
        console.log('[socket] admin joined admin_panel');
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
        const content = String(data.content ?? data.text ?? '').trim();
        if (!content) {
          callback?.({ success: false, error: 'Empty message' });
          return;
        }
        const message = await prisma.message.create({
          data: {
            userId: user.userId,
            content,
            isAdmin: false,
            isRead: false,
          },
        });
        const serialized = serializeMessage(message);
        emitNewMessage(user.userId, serialized);
        callback?.({ success: true, message: serialized });
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
          const content = String(data.content ?? data.text ?? '').trim();
          if (!targetUserId || !content) {
            callback?.({ success: false, error: 'Invalid payload' });
            return;
          }
          const message = await prisma.message.create({
            data: {
              userId: targetUserId,
              content,
              isAdmin: true,
              isRead: true,
            },
          });
          const serialized = serializeMessage(message);
          emitNewMessage(targetUserId, serialized);
          callback?.({ success: true, message: serialized });
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
          where: { userId: targetUserId, isAdmin: false, isRead: false },
          data: { isRead: true },
        });
        callback?.({ success: true });
      } catch (error) {
        console.error('[socket] mark_read failed', error);
        callback?.({ success: false });
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('[socket] disconnected', user.userId, reason);
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
