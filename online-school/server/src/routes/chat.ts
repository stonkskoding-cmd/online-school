import { Router } from 'express';
import { auth, admin, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const router = Router();

router.get('/messages', auth, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.query.userId as string | undefined;

    if (userId && req.user?.role !== 'admin') {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    const targetUserId = userId || req.user!.id;
    const messages = await prisma.message.findMany({
      where: { userId: targetUserId },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });

    res.json({ messages });
  } catch (error) {
    next(error);
  }
});

router.get('/conversations', auth, admin, async (req, res, next) => {
  try {
    const grouped = await prisma.message.groupBy({
      by: ['userId'],
      _count: { _all: true },
    });

    const conversations = await Promise.all(
      grouped.map(async (row) => {
        const [user, lastMessage] = await Promise.all([
          prisma.user.findUnique({
            where: { id: row.userId },
            select: { email: true },
          }),
          prisma.message.findFirst({
            where: { userId: row.userId },
            orderBy: { createdAt: 'desc' },
          }),
        ]);

        return {
          userId: row.userId,
          email: user?.email ?? '',
          lastMessage,
          messageCount: row._count._all,
        };
      }),
    );

    res.json({ conversations });
  } catch (error) {
    next(error);
  }
});

router.post('/messages', auth, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const text = String(req.body.text ?? '').trim();

    if (!text) {
      res.status(400).json({ message: 'Message text is required' });
      return;
    }

    const message = await prisma.message.create({
      data: {
        userId,
        content: text,
        isAdmin: false,
        isRead: false,
      },
    });

    res.status(201).json({ message });
  } catch (error) {
    next(error);
  }
});

export default router;
