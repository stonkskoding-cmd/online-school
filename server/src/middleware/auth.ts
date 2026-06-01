import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/auth.types';
import { verifyToken, attachUser } from './verifyToken';

export type { AuthRequest, AuthUser } from '../types/auth.types';
export { verifyToken, attachUser, extractBearerToken } from './verifyToken';

/** Алиас для существующих роутов */
export const auth = verifyToken;

export const admin = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ message: 'Access denied. Admin only.' });
    return;
  }
  next();
};
