import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface AdminJwtPayload {
  role?: string;
  userId?: string;
}

function extractBearerToken(req: Request): string | undefined {
  const raw =
    req.headers.authorization ??
    req.headers.Authorization ??
    (typeof req.get === 'function' ? req.get('authorization') : undefined);

  if (!raw || typeof raw !== 'string') return undefined;

  const trimmed = raw.trim();
  if (trimmed.toLowerCase().startsWith('bearer ')) {
    return trimmed.slice(7).trim();
  }
  return trimmed;
}

export const verifyAdmin = (req: Request, res: Response, next: NextFunction): void => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  const authHeader = req.headers.authorization ?? req.headers.Authorization;
  console.log('[verifyAdmin] Token received:', authHeader ? `${String(authHeader).slice(0, 20)}…` : 'none');

  try {
    const token = extractBearerToken(req);

    if (!token) {
      console.warn('[verifyAdmin] No bearer token');
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as AdminJwtPayload;
    if (decoded.role !== 'admin') {
      console.warn('[verifyAdmin] Forbidden — role:', decoded.role);
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    (req as Request & { admin?: AdminJwtPayload }).admin = decoded;
    next();
  } catch (error) {
    console.error('[verifyAdmin] JWT verify failed:', error instanceof Error ? error.message : error);
    res.status(401).json({ message: 'Unauthorized' });
  }
};
