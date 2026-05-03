import { Router } from 'express';
import { Purchase } from '../models/Purchase';

const router = Router();

router.post('/webhook', async (req, res, next) => {
  try {
    const { event, object } = req.body;

    if (event !== 'payment.succeeded') {
      res.json({ status: 'ignored' });
      return;
    }

    const paymentId = object.id;
    const orderId = object.metadata?.order_id;

    if (!orderId) {
      res.status(400).json({ message: 'Order ID not found in metadata' });
      return;
    }

    const purchase = await Purchase.findOne({ paymentId });

    if (!purchase) {
      res.status(404).json({ message: 'Purchase not found' });
      return;
    }

    if (purchase.status === 'paid') {
      res.json({ status: 'already paid' });
      return;
    }

    purchase.status = 'paid';
    await purchase.save();

    console.log(`Payment ${paymentId} succeeded for order ${orderId}`);
    res.json({ status: 'success' });
  } catch (error) {
    next(error);
  }
});

export default router;
