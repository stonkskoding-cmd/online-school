import { Router, Response } from 'express';
import { attachUser, verifyToken, auth, admin, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { emitNewMessage } from '../socket';
import {
  buildMessageCreateData,
  chatIdFromUserId,
  parseMessageContent,
  serializeMessage,
} from '../lib/chatHelpers';
import { isUuid, respondChatError } from '../lib/chatRouteUtils';
import { checkMessagesTable } from '../lib/chatDb';

const router = Router();

router.use((req, _res, next) => {
  console.log('Chat route hit:', req.method, req.originalUrl);
  next();
});

async function fetchMessagesForUser(targetUserId: string, take = 100) {
  console.log('[CHAT] fetchMessagesForUser userId:', targetUserId, 'take:', take);

  if (!isUuid(targetUserId)) {
    console.warn('[CHAT] invalid userId for fetch:', targetUserId);
    return [];
  }

  const rows = await prisma.message.findMany({
    where: { userId: targetUserId },
    orderBy: { createdAt: 'asc' },
    take,
  });

  console.log('[CHAT] Messages count:', rows.length);
  return rows.map(serializeMessage);
}

async function createUserMessage(userId: string, content: string) {
  if (!isUuid(userId)) {
    throw new Error('Invalid user id');
  }
  const message = await prisma.message.create({
    data: buildMessageCreateData(userId, content, false),
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

/** Проверка req.user после verifyToken */
function assertChatUser(req: AuthRequest, res: Response): boolean {
  console.log('[CHAT] req.user:', req.user);
  if (!req.user?.id) {
    console.error('[CHAT] No user id in token!');
    res.status(401).json({ error: 'User not authenticated', message: 'User not authenticated' });
    return false;
  }
  return true;
}

// ——— Статические маршруты (до /:chatId/...) ———

router.get('/health', async (_req, res) => {
  const table = await checkMessagesTable();
  res.status(table.ok ? 200 : 503).json({
    ok: table.ok,
    table: 'messages',
    error: table.error,
  });
});

router.get('/my', attachUser, async (req: AuthRequest, res) => {
  try {
    if (!assertChatUser(req, res)) return;
    const userId = req.user!.id;
    console.log('[CHAT] Getting chat for user:', userId);
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

/** UUID клиента для чата поддержки (не системный admin) */
function resolveClientChatUserId(req: AuthRequest, res: Response): string | null {
  console.log('[CHAT] Request user:', req.user);
  console.log('[CHAT] Authorization header:', req.headers.authorization ? 'present' : 'missing');

  if (!req.user?.id) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Войдите в аккаунт, чтобы использовать чат поддержки',
    });
    return null;
  }

  if (req.user.id === 'admin') {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Войдите как пользователь (email), не как администратор',
    });
    return null;
  }

  if (!isUuid(req.user.id)) {
    res.status(401).json({ error: 'Unauthorized', message: 'Invalid user session' });
    return null;
  }

  return req.user.id;
}

router.get('/messages', attachUser, async (req: AuthRequest, res) => {
  try {
    console.log('[CHAT] GET /messages — User:', req.user);

    const userId = req.user?.id;
    if (!userId) {
      console.error('[CHAT] No user ID');
      res.status(401).json({ error: 'No user ID', message: 'Войдите в аккаунт' });
      return;
    }

    const queryUserId = req.query.userId as string | undefined;
    console.log('[CHAT] queryUserId:', queryUserId ?? 'none');

    if (queryUserId && req.user?.role !== 'admin') {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    let targetUserId = queryUserId;
    if (!targetUserId) {
      const clientId = resolveClientChatUserId(req, res);
      if (!clientId) return;
      targetUserId = clientId;
    }

    const table = await checkMessagesTable();
    if (!table.ok) {
      res.status(503).json({
        message: 'Таблица messages не создана. Выполните prisma migrate deploy.',
        error: table.error,
      });
      return;
    }

    const messages = await fetchMessagesForUser(targetUserId, 50);
    console.log('[CHAT] Returning', messages.length, 'messages for', targetUserId);
    res.json({ chatId: chatIdFromUserId(targetUserId), messages });
  } catch (error) {
    respondChatError(res, 'GET /messages failed', error);
  }
});

router.post('/messages', verifyToken, async (req: AuthRequest, res) => {
  try {
    console.log('[CHAT POST] Received request');
    console.log('[CHAT POST] User:', req.user);
    console.log('[CHAT POST] Body:', req.body);
    console.log('[CHAT POST] Authorization:', req.headers.authorization ? 'present' : 'missing');

    const userId = resolveClientChatUserId(req, res);
    if (!userId) return;

    const content = parseMessageContent(req.body);
    if (!content) {
      console.error('[CHAT POST] No content');
      res.status(400).json({ error: 'Content required', message: 'Message text is required' });
      return;
    }

    const table = await checkMessagesTable();
    if (!table.ok) {
      res.status(503).json({
        message: 'Таблица messages не создана. Выполните prisma migrate deploy.',
        error: table.error,
      });
      return;
    }

    const message = await prisma.message.create({
      data: buildMessageCreateData(userId, content, false),
    });

    const serialized = serializeMessage(message);
    console.log('[CHAT POST] Message created:', message.id);
    safeEmit(userId, serialized);
    res.status(201).json({ message: serialized });
  } catch (error) {
    const err = error as Error;
    console.error('[CHAT POST] Error:', err.message, err.stack);
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
    const content = parseMessageContent(req.body);
    if (!content) {
      res.status(400).json({ message: 'Message text is required' });
      return;
    }

    const isAdminUser = req.user!.role === 'admin';
    if (!isAdminUser && req.user!.id !== chatId) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    const message = await prisma.message.create({
      data: buildMessageCreateData(chatId, content, isAdminUser),
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
