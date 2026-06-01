import { Router, Response } from 'express';
import { auth, admin, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { emitNewMessage } from '../socket';
import { chatIdFromUserId, serializeMessage } from '../lib/chatHelpers';
import { isUuid, respondChatError } from '../lib/chatRouteUtils';

const router = Router();

router.use((req, _res, next) => {
  console.log('Chat route hit:', req.method, req.originalUrl);
  next();
});

async function fetchMessagesForUser(targetUserId: string, take = 100) {
  if (!isUuid(targetUserId)) {
    console.warn('[chat] invalid userId for fetch:', targetUserId);
    return [];
  }
  const rows = await prisma.message.findMany({
    where: { userId: targetUserId },
    orderBy: { createdAt: 'desc' },
    take,
  });
  return rows.reverse().map(serializeMessage);
}

async function createUserMessage(userId: string, text: string) {
  if (!isUuid(userId)) {
    throw new Error('Invalid user id');
  }
  const message = await prisma.message.create({
    data: {
      userId,
      content: text,
      isAdmin: false,
      isRead: false,
    },
  });
  return serializeMessage(message);
}

function safeEmit(userId: string, message: ReturnType<typeof serializeMessage>) {
  try {
    emitNewMessage(userId, message);
  } catch (emitErr) {
    console.warn('[chat] socket emit skipped', emitErr);
  }
}

// ——— Статические маршруты (до /:chatId/...) ———

router.get('/my', auth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    console.log('Getting chat for user:', userId);
    const count = await prisma.message.count({ where: { userId } });
    res.json({
      chatId: chatIdFromUserId(userId),
      userId,
      hasMessages: count > 0,
    });
  } catch (error) {
    respondChatError(res, 'GET /my failed', error);
  }
});

router.get('/unread-count', auth, admin, async (_req, res) => {
  try {
    const count = await prisma.message.count({
      where: { isAdmin: false, isRead: false },
    });
    res.json({ count });
  } catch (error) {
    respondChatError(res, 'GET /unread-count failed', error);
  }
});

function requireClientUser(req: AuthRequest, res: Response): string | null {
  if (req.user!.role === 'admin' && req.user!.id === 'admin') {
    res.status(403).json({
      message: 'Войдите как пользователь (не админ), чтобы открыть чат поддержки',
    });
    return null;
  }
  if (!isUuid(req.user!.id)) {
    res.status(403).json({ message: 'Invalid user session' });
    return null;
  }
  return req.user!.id;
}

router.get('/messages', auth, async (req: AuthRequest, res) => {
  try {
    const queryUserId = req.query.userId as string | undefined;
    console.log('Getting messages for user:', req.user!.id, 'queryUserId:', queryUserId ?? 'none');

    if (queryUserId && req.user?.role !== 'admin') {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    let targetUserId = queryUserId;
    if (!targetUserId) {
      const clientId = requireClientUser(req, res);
      if (!clientId) return;
      targetUserId = clientId;
    }
    const messages = await fetchMessagesForUser(targetUserId, 100);
    res.json({ chatId: chatIdFromUserId(targetUserId), messages });
  } catch (error) {
    respondChatError(res, 'GET /messages failed', error);
  }
});

router.post('/messages', auth, async (req: AuthRequest, res) => {
  try {
    const userId = requireClientUser(req, res);
    if (!userId) return;
    const text = String(req.body.text ?? req.body.content ?? '').trim();
    console.log('POST /messages from user:', userId, 'len:', text.length);

    if (!text) {
      res.status(400).json({ message: 'Message text is required' });
      return;
    }

    const message = await createUserMessage(userId, text);
    safeEmit(userId, message);
    res.status(201).json({ message });
  } catch (error) {
    respondChatError(res, 'POST /messages failed', error);
  }
});

router.get('/history/:userId', auth, async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;
    if (req.user!.role !== 'admin' && req.user!.id !== userId) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }
    const messages = await fetchMessagesForUser(userId, 50);
    res.json({ chatId: chatIdFromUserId(userId), messages });
  } catch (error) {
    respondChatError(res, 'GET /history/:userId failed', error);
  }
});

router.post('/mark-read/:userId', auth, admin, async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await prisma.message.updateMany({
      where: { userId, isAdmin: false, isRead: false },
      data: { isRead: true },
    });
    res.json({ ok: true, updated: result.count });
  } catch (error) {
    respondChatError(res, 'POST /mark-read failed', error);
  }
});

// ——— Параметрические маршруты (chatId = UUID пользователя) ———

router.get('/:chatId/messages', auth, async (req: AuthRequest, res) => {
  try {
    const { chatId } = req.params;
    if (chatId === 'messages') {
      res.status(400).json({ message: 'Use GET /api/chat/messages' });
      return;
    }
    if (!isUuid(chatId)) {
      res.status(400).json({ message: 'Invalid chat id' });
      return;
    }
    if (req.user!.role !== 'admin' && req.user!.id !== chatId) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }
    const messages = await fetchMessagesForUser(chatId, 100);
    if (req.user!.role === 'admin') {
      await prisma.message.updateMany({
        where: { userId: chatId, isAdmin: false, isRead: false },
        data: { isRead: true },
      });
    }
    res.json({ chatId, messages });
  } catch (error) {
    respondChatError(res, 'GET /:chatId/messages failed', error);
  }
});

router.post('/:chatId/message', auth, async (req: AuthRequest, res) => {
  try {
    const { chatId } = req.params;
    if (!isUuid(chatId)) {
      res.status(400).json({ message: 'Invalid chat id' });
      return;
    }
    const text = String(req.body.content ?? req.body.text ?? '').trim();
    if (!text) {
      res.status(400).json({ message: 'Message text is required' });
      return;
    }

    const isAdminUser = req.user!.role === 'admin';
    if (!isAdminUser && req.user!.id !== chatId) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    const message = await prisma.message.create({
      data: {
        userId: chatId,
        content: text,
        isAdmin: isAdminUser,
        isRead: isAdminUser,
      },
    });
    const serialized = serializeMessage(message);
    safeEmit(chatId, serialized);
    res.status(201).json({ message: serialized });
  } catch (error) {
    respondChatError(res, 'POST /:chatId/message failed', error);
  }
});

router.patch('/:chatId/read', auth, async (req: AuthRequest, res) => {
  try {
    const { chatId } = req.params;
    if (!isUuid(chatId)) {
      res.status(400).json({ message: 'Invalid chat id' });
      return;
    }
    if (req.user!.role !== 'admin' && req.user!.id !== chatId) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }
    const result = await prisma.message.updateMany({
      where: {
        userId: chatId,
        isAdmin: req.user!.role === 'admin' ? false : true,
        isRead: false,
      },
      data: { isRead: true },
    });
    res.json({ ok: true, updated: result.count });
  } catch (error) {
    respondChatError(res, 'PATCH /:chatId/read failed', error);
  }
});

router.delete('/:chatId/clear', auth, admin, async (req, res) => {
  try {
    const { chatId } = req.params;
    if (!isUuid(chatId)) {
      res.status(400).json({ message: 'Invalid chat id' });
      return;
    }
    const result = await prisma.message.deleteMany({ where: { userId: chatId } });
    console.log('[chat] cleared history', chatId, result.count);
    res.json({ ok: true, deletedCount: result.count });
  } catch (error) {
    respondChatError(res, 'DELETE /:chatId/clear failed', error);
  }
});

router.delete('/:chatId', auth, admin, async (req, res) => {
  try {
    const { chatId } = req.params;
    if (!isUuid(chatId)) {
      res.status(400).json({ message: 'Invalid chat id' });
      return;
    }
    const result = await prisma.message.deleteMany({ where: { userId: chatId } });
    res.json({ ok: true, message: 'Chat deleted', deletedCount: result.count });
  } catch (error) {
    respondChatError(res, 'DELETE /:chatId failed', error);
  }
});

export default router;
