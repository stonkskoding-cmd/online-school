import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface AdminJwtPayload {
  role: string;
}

export const verifyAdmin = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authorization = req.headers.authorization;
    const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : undefined;

    if (!token) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as AdminJwtPayload;
    if (decoded.role !== 'admin') {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    next();
  } catch {
    res.status(401).json({ message: 'Unauthorized' });
  }
};
