import { Router } from 'express';

const router = Router();

router.post('/webhook', async (_req, res) => {
  // Payment integration will be added in Stage 2.
  res.status(501).json({ message: 'Payment webhook is not implemented yet' });
});

export default router;
