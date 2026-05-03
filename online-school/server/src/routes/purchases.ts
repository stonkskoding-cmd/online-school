import { Router } from 'express';
import { z } from 'zod';
import { Purchase } from '../models/Purchase';
import { auth, AuthRequest } from '../middleware/auth';
import { createPayment } from '../services/yookassa';

const router = Router();

const createPurchaseSchema = z.object({
  body: z.object({
    packageId: z.string(),
  }),
});

router.post('/', auth, async (req: AuthRequest, res, next) => {
  try {
    const { packageId } = req.body;
    const userId = req.user!._id;

    const Package = (await import('../models/Package')).Package;
    const pkg = await Package.findById(packageId);

    if (!pkg) {
      res.status(404).json({ message: 'Package not found' });
      return;
    }

    const existingPurchase = await Purchase.findOne({
      userId,
      packageId,
      status: { $in: ['pending', 'paid'] },
    });

    if (existingPurchase && existingPurchase.status === 'paid') {
      res.json({ 
        message: 'Already purchased',
        purchase: existingPurchase,
      });
      return;
    }

    if (existingPurchase && existingPurchase.status === 'pending') {
      res.json({
        message: 'Pending payment exists',
        purchase: existingPurchase,
      });
      return;
    }

    const purchase = new Purchase({
      userId,
      packageId,
      amount: pkg.price,
      status: 'pending',
    });

    const { paymentId, confirmationUrl } = await createPayment(pkg.price, purchase._id.toString());
    
    purchase.paymentId = paymentId;
    await purchase.save();

    res.json({
      message: 'Purchase created',
      purchase,
      confirmationUrl,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/', auth, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!._id;
    const purchases = await Purchase.find({ userId })
      .populate('packageId')
      .sort({ createdAt: -1 });

    res.json({ purchases });
  } catch (error) {
    next(error);
  }
});

export default router;
