import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../types/auth.types';

export type { AuthRequest, AuthUser } from '../types/auth.types';

export const auth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authorization = req.headers.authorization;
    const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : undefined;

    if (!token) {
      res.status(401).json({ message: 'Access denied. No token provided.' });
      return;
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      userId?: string;
      role?: string;
    };

    // JWT админа (dinastia_admin) без userId в БД
    if (decoded.role === 'admin' && !decoded.userId) {
      req.user = {
        id: 'admin',
        email: 'admin',
        role: 'admin',
      };
      next();
      return;
    }

    if (!decoded.userId || !decoded.userId.trim()) {
      res.status(401).json({ message: 'Invalid token.' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      res.status(401).json({ message: 'Invalid token.' });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role === 'admin' ? 'admin' : 'user',
    };
    next();
  } catch (error) {
    console.error('[auth] token verification failed', error);
    res.status(401).json({ message: 'Invalid token.' });
  }
};

export const admin = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ message: 'Access denied. Admin only.' });
    return;
  }
  next();
};
