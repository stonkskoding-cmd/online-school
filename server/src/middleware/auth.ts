import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../lib/prisma';
import { AuthRequest, AuthUser } from '../types/auth.types';
import { DecodedJwtPayload, getUserIdFromJwt } from '../lib/jwtUser';

export type { AuthRequest, AuthUser } from '../types/auth.types';

function extractBearerToken(authorization: string | undefined): string | undefined {
  if (!authorization) return undefined;
  const trimmed = authorization.trim();
  if (trimmed.toLowerCase().startsWith('bearer ')) {
    return trimmed.slice(7).trim();
  }
  return trimmed || undefined;
}

/**
 * Проверяет JWT и заполняет req.user.
 * Поддерживает поля id, userId, sub в payload.
 */
export const verifyToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token = extractBearerToken(req.headers.authorization);

    if (!token) {
      console.log('[AUTH] No token provided');
      res.status(401).json({ error: 'No token', message: 'Access denied. No token provided.' });
      return;
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as DecodedJwtPayload;
    console.log('[AUTH] Decoded token:', {
      userId: decoded.userId,
      id: decoded.id,
      sub: decoded.sub,
      role: decoded.role,
      email: decoded.email,
    });

    const role = decoded.role === 'admin' ? 'admin' : 'user';
    const tokenUserId = getUserIdFromJwt(decoded);

    // Админ dinastia_admin: JWT только с role, без id в БД
    if (role === 'admin' && !tokenUserId) {
      req.user = {
        id: 'admin',
        email: decoded.email ?? 'admin',
        role: 'admin',
      };
      console.log('[AUTH] User:', req.user);
      next();
      return;
    }

    if (!tokenUserId) {
      console.error('[AUTH] No user id in token payload');
      res.status(401).json({ error: 'Invalid token', message: 'Invalid token: missing user id' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: tokenUserId },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      console.error('[AUTH] User not found in DB:', tokenUserId);
      res.status(401).json({ error: 'Invalid token', message: 'Invalid token.' });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role === 'admin' ? 'admin' : 'user',
    };
    console.log('[AUTH] User:', req.user);
    next();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid token';
    console.error('[AUTH] Invalid token:', message);
    res.status(401).json({ error: 'Invalid token', message: 'Invalid token.' });
  }
};

/** Алиас для существующих роутов */
export const auth = verifyToken;

export const admin = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ message: 'Access denied. Admin only.' });
    return;
  }
  next();
};
