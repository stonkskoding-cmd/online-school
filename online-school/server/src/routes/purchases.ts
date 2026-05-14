import { Router } from 'express';
import { z } from 'zod';
import { auth, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { prisma } from '../lib/prisma';

const router = Router();

export const createPurchaseSchema = z.object({
  body: z.object({
    packageId: z.string(),
  }),
});

router.post('/', auth, validate(createPurchaseSchema), async (req: AuthRequest, res, next) => {
  try {
    const { packageId } = req.body;
    const userId = req.user!.id;

    const pkg = await prisma.package.findUnique({
      where: { id: packageId },
    });

    if (!pkg) {
      res.status(404).json({ message: 'Package not found' });
      return;
    }

    const existingPurchase = await prisma.purchase.findFirst({
      where: {
        userId,
        packageId,
        status: { in: ['pending', 'paid'] },
      },
    });

    if (existingPurchase) {
      res.json({ 
        message: 'Already created',
        purchase: existingPurchase,
      });
      return;
    }

    const purchase = await prisma.purchase.create({
      data: {
        userId,
        packageId,
        status: 'paid',
      },
    });

    res.json({
      message: 'Purchase created',
      purchase,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/', auth, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const purchases = await prisma.purchase.findMany({
      where: { userId },
      include: { package: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ purchases });
  } catch (error) {
    next(error);
  }
});

export default router;
