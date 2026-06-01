import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../types/auth.types';
import { DecodedJwtPayload, getUserIdFromJwt } from '../lib/jwtUser';

/** Bearer из Authorization (регистронезависимо) */
export function extractBearerToken(req: {
  headers: { authorization?: string; Authorization?: string };
}): string | undefined {
  const authHeader = req.headers.authorization ?? req.headers.Authorization;
  if (!authHeader || typeof authHeader !== 'string') {
    return undefined;
  }
  const parts = authHeader.trim().split(/\s+/);
  if (parts.length >= 2 && parts[0].toLowerCase() === 'bearer') {
    return parts.slice(1).join(' ').trim() || undefined;
  }
  return authHeader.trim() || undefined;
}

async function loadUserFromToken(token: string): Promise<AuthRequest['user'] | null> {
  const decoded = jwt.verify(token, env.JWT_SECRET) as DecodedJwtPayload;
  const role = decoded.role === 'admin' ? 'admin' : 'user';
  const tokenUserId = getUserIdFromJwt(decoded);

  if (role === 'admin' && !tokenUserId) {
    return {
      id: 'admin',
      email: decoded.email ?? 'admin',
      role: 'admin',
    };
  }

  if (!tokenUserId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: tokenUserId },
    select: { id: true, email: true, role: true },
  });

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role === 'admin' ? 'admin' : 'user',
  };
}

/** Опционально: заполняет req.user, не блокирует запрос */
export const attachUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token = extractBearerToken(req);
    console.log('[AUTH] attachUser path:', req.method, req.originalUrl);
    console.log('[AUTH] Has Authorization:', Boolean(req.headers.authorization ?? req.headers.Authorization));
    console.log('[AUTH] Token:', token ? `${token.slice(0, 12)}…` : 'none');

    if (!token) {
      next();
      return;
    }

    req.user = (await loadUserFromToken(token)) ?? undefined;
    console.log('[AUTH] attachUser req.user:', req.user);
    next();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid token';
    console.warn('[AUTH] attachUser token invalid:', message);
    next();
  }
};

/** Обязательная авторизация */
export const verifyToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    console.log('[AUTH] verifyToken path:', req.method, req.originalUrl);
    console.log('[AUTH] Headers authorization:', req.headers.authorization ? 'present' : 'missing');

    const token = extractBearerToken(req);
    console.log('[AUTH] Token:', token ? `${token.slice(0, 12)}…` : 'none');

    if (!token) {
      console.log('[AUTH] No token in header');
      res.status(401).json({ error: 'No token', message: 'Access denied. No token provided.' });
      return;
    }

    const user = await loadUserFromToken(token);
    if (!user) {
      console.error('[AUTH] User not resolved from token');
      res.status(401).json({ error: 'Invalid token', message: 'Invalid token.' });
      return;
    }

    req.user = user;
    console.log('[AUTH] User:', req.user);
    next();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid token';
    console.error('[AUTH] Invalid token:', message);
    res.status(401).json({ error: 'Invalid token', message: 'Invalid token.' });
  }
};
