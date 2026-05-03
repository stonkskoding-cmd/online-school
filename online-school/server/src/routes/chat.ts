import { Router } from 'express';
import { Message } from '../models/Message';
import { auth, admin, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/messages', auth, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.query.userId as string | undefined;
    
    if (userId && req.user?.role !== 'admin') {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    const targetUserId = userId || req.user!._id.toString();
    const messages = await Message.find({ userId: targetUserId })
      .sort({ createdAt: 1 })
      .limit(100);

    res.json({ messages });
  } catch (error) {
    next(error);
  }
});

router.get('/conversations', auth, admin, async (req, res, next) => {
  try {
    const conversations = await Message.aggregate([
      {
        $group: {
          _id: '$userId',
          lastMessage: { $last: '$$ROOT' },
          messageCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          userId: '$_id',
          email: '$user.email',
          firstName: '$user.firstName',
          lastName: '$user.lastName',
          lastMessage: 1,
          messageCount: 1,
        },
      },
    ]);

    res.json({ conversations });
  } catch (error) {
    next(error);
  }
});

export default router;
