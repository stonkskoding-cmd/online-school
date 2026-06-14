import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { verifyToken } from '../middleware/auth';
import { AuthRequest } from '../types/auth.types';

const router = Router();

router.post('/messages', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { content } = req.body as { content?: string };

    if (!content || content.trim().length === 0) {
      res.status(400).json({ error: 'Content required' });
      return;
    }

    if (user.role === 'admin') {
      res.status(403).json({ error: 'Admin must use /api/admin/message' });
      return;
    }

    const message = await prisma.message.create({
      data: {
        senderId: user.id,
        content: content.trim(),
        isAdmin: false,
        isRead: false,
      },
    });

    console.log('[CHAT] Message created:', message.id);
    res.json(message);
  } catch (error) {
    console.error('[CHAT] Create error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

router.get('/messages', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { userId } = req.query;

    let where: { senderId: string } | Record<string, never> = {};

    if (user.role === 'admin') {
      if (typeof userId === 'string' && userId.trim()) {
        where = { senderId: userId.trim() };
      }
    } else {
      where = { senderId: user.id };
    }

    const messages = await prisma.message.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      take: 100,
    });

    res.json(messages);
  } catch (error) {
    console.error('[CHAT] Get error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

router.get('/chats', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'admin') {
      res.status(403).json({ error: 'Admin only' });
      return;
    }

    const chats = await prisma.$queryRaw<
      Array<{ userId: string; messageCount: bigint; lastMessageAt: Date }>
    >`
      SELECT "senderId" as "userId",
             COUNT(*)::bigint as "messageCount",
             MAX("createdAt") as "lastMessageAt"
      FROM "messages"
      WHERE "isAdmin" = false
      GROUP BY "senderId"
      ORDER BY "lastMessageAt" DESC
    `;

    res.json(
      chats.map((c) => ({
        userId: c.userId,
        messageCount: Number(c.messageCount),
        lastMessageAt: c.lastMessageAt,
      })),
    );
  } catch (error) {
    console.error('[CHAT] Chats list error:', error);
    res.status(500).json({ error: 'Failed to get chats' });
  }
});

router.delete('/chats/:userId', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'admin') {
      res.status(403).json({ error: 'Admin only' });
      return;
    }

    const { userId } = req.params;

    await prisma.message.deleteMany({
      where: { senderId: userId },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('[CHAT] Delete error:', error);
    res.status(500).json({ error: 'Failed to delete chat' });
  }
});

export const chatRouter = router;
export default router;
