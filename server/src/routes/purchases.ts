import { Router } from 'express';
import { z } from 'zod';
import { auth, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { prisma } from '../lib/prisma';
import { createPayment, isYooKassaConfigured } from '../services/yookassa';

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

    const pkg = await prisma.package.findUnique({ where: { id: packageId } });
    if (!pkg) {
      res.status(404).json({ message: 'Package not found' });
      return;
    }

    // Уже оплачен — доступ есть
    const paid = await prisma.purchase.findFirst({
      where: { userId, packageId, status: 'paid' },
    });
    if (paid) {
      res.json({ message: 'Already purchased', purchase: paid, alreadyPaid: true });
      return;
    }

    // Ключи ЮKassa не заданы → мгновенная выдача (как раньше; для разработки/до подключения)
    if (!isYooKassaConfigured()) {
      const existing = await prisma.purchase.findFirst({
        where: { userId, packageId, status: 'pending' },
      });
      const purchase = existing
        ? await prisma.purchase.update({ where: { id: existing.id }, data: { status: 'paid' } })
        : await prisma.purchase.create({ data: { userId, packageId, status: 'paid' } });
      res.json({ message: 'Purchase created', purchase });
      return;
    }

    // ЮKassa настроена → создаём (или переиспользуем) заказ в статусе pending и ссылку на оплату
    let purchase = await prisma.purchase.findFirst({
      where: { userId, packageId, status: 'pending' },
    });
    if (!purchase) {
      purchase = await prisma.purchase.create({ data: { userId, packageId, status: 'pending' } });
    }

    const { confirmationUrl } = await createPayment(pkg.price, purchase.id);

    res.json({
      message: 'Payment created',
      purchaseId: purchase.id,
      confirmationUrl,
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
