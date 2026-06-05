import { Router, Request, Response, NextFunction } from 'express';
import authRoutes from './auth';
import packageRoutes from './packages';
import purchaseRoutes from './purchases';
import paymentRoutes from './payments';
import adminRoutes from './admin';
import { verifyAdmin } from '../middleware/authMiddleware';
import upload from '../middleware/upload';
import { uploadRespond, handleMulterError } from '../middleware/uploadRespond';

/** Все API-эндпоинты: /api/auth, /api/packages, … */
const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/packages', packageRoutes);
apiRouter.use('/purchases', purchaseRoutes);
apiRouter.use('/payments', paymentRoutes);
// chat → app.use('/api/chat', chatRoutes) в app.ts
apiRouter.use('/admin', verifyAdmin, adminRoutes);

apiRouter.post(
  '/upload',
  verifyAdmin,
  (req: Request, res: Response, next: NextFunction) => {
    upload.single('file')(req, res, (err) => {
      if (err) {
        handleMulterError(err, req, res, next);
        return;
      }
      next();
    });
  },
  uploadRespond,
);

export default apiRouter;
