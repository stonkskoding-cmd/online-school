import { Router } from 'express';
import authRoutes from './auth';
import packageRoutes from './packages';
import purchaseRoutes from './purchases';
import paymentRoutes from './payments';
import chatRoutes from './chat';
import adminRoutes from './admin';
import { verifyAdmin } from '../middleware/authMiddleware';
import { adminUploadMulter, adminUploadRespond } from '../utils/cloudinary';

/** Все API-эндпоинты: /api/auth, /api/packages, … */
const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/packages', packageRoutes);
apiRouter.use('/purchases', purchaseRoutes);
apiRouter.use('/payments', paymentRoutes);
apiRouter.use('/chat', chatRoutes);
apiRouter.use('/admin', verifyAdmin, adminRoutes);
apiRouter.post('/upload', verifyAdmin, adminUploadMulter.single('file'), adminUploadRespond);

export default apiRouter;
