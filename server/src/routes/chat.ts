import { Router } from 'express';
import { auth, admin, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { emitNewMessage } from '../socket';
import { chatIdFromUserId, serializeMessage } from '../lib/chatHelpers';

const router = Router();

async function fetchMessagesForUser(targetUserId: string, take = 100) {
  const rows = await prisma.message.findMany({
    where: { userId: targetUserId },
    orderBy: { createdAt: 'desc' },
    take,
  });
  return rows.reverse().map(serializeMessage);
}

async function createUserMessage(userId: string, text: string) {
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

/** Текущий пользователь: chatId (= userId), создаётся при первом сообщении */
router.get('/my', auth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const count = await prisma.message.count({ where: { userId } });
    res.json({
      chatId: chatIdFromUserId(userId),
      userId,
      hasMessages: count > 0,
    });
  } catch (error) {
    console.error('[chat] GET /my failed', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/unread-count', auth, admin, async (_req, res) => {
  try {
    const count = await prisma.message.count({
      where: { isAdmin: false, isRead: false },
    });
    res.json({ count });
  } catch (error) {
    console.error('[chat] GET /unread-count failed', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/messages', auth, async (req: AuthRequest, res) => {
  try {
    const queryUserId = req.query.userId as string | undefined;
    if (queryUserId && req.user?.role !== 'admin') {
      res.status(403).json({ message: 'Access denied' });
      return;
    }
    const targetUserId = queryUserId || req.user!.id;
    const messages = await fetchMessagesForUser(targetUserId, 100);
    res.json({ chatId: chatIdFromUserId(targetUserId), messages });
  } catch (error) {
    console.error('[chat] GET /messages failed', error);
    res.status(500).json({ message: 'Internal server error' });
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
    console.error('[chat] GET /history/:userId failed', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/** Сообщения чата (chatId = userId) */
router.get('/:chatId/messages', auth, async (req: AuthRequest, res) => {
  try {
    const { chatId } = req.params;
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
    console.error('[chat] GET /:chatId/messages failed', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/:chatId/message', auth, async (req: AuthRequest, res) => {
  try {
    const { chatId } = req.params;
    const text = String(req.body.content ?? req.body.text ?? '').trim();
    if (!text) {
      res.status(400).json({ message: 'Message text is required' });
      return;
    }

    const isAdmin = req.user!.role === 'admin';
    if (!isAdmin && req.user!.id !== chatId) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    const message = await prisma.message.create({
      data: {
        userId: chatId,
        content: text,
        isAdmin,
        isRead: isAdmin,
      },
    });
    const serialized = serializeMessage(message);
    emitNewMessage(chatId, serialized);
    res.status(201).json({ message: serialized });
  } catch (error) {
    console.error('[chat] POST /:chatId/message failed', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.patch('/:chatId/read', auth, async (req: AuthRequest, res) => {
  try {
    const { chatId } = req.params;
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
    console.error('[chat] PATCH /:chatId/read failed', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.delete('/:chatId/clear', auth, admin, async (req, res) => {
  try {
    const { chatId } = req.params;
    const result = await prisma.message.deleteMany({ where: { userId: chatId } });
    console.log('[chat] cleared history', chatId, result.count);
    res.json({ ok: true, deletedCount: result.count });
  } catch (error) {
    console.error('[chat] DELETE /:chatId/clear failed', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.delete('/:chatId', auth, admin, async (req, res) => {
  try {
    const { chatId } = req.params;
    const result = await prisma.message.deleteMany({ where: { userId: chatId } });
    res.json({ ok: true, message: 'Chat deleted', deletedCount: result.count });
  } catch (error) {
    console.error('[chat] DELETE /:chatId failed', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/messages', auth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const text = String(req.body.text ?? req.body.content ?? '').trim();
    if (!text) {
      res.status(400).json({ message: 'Message text is required' });
      return;
    }
    const message = await createUserMessage(userId, text);
    emitNewMessage(userId, message);
    res.status(201).json({ message });
  } catch (error) {
    console.error('[chat] POST /messages failed', error);
    res.status(500).json({ message: 'Internal server error' });
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
    console.error('[chat] POST /mark-read failed', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
