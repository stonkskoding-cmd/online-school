import { Request, Response, NextFunction } from 'express';
import { resolveCorsOrigin } from '../lib/cors';

const ALLOW_METHODS = 'GET, POST, PUT, PATCH, DELETE, OPTIONS';
const DEFAULT_ALLOW_HEADERS = 'Content-Type, Authorization, X-Requested-With, Accept';

/** Единый CORS: без credentials (клиент withCredentials: false) → POST после preflight проходит */
export function corsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const origin = req.headers.origin;
  const resolved = resolveCorsOrigin(origin);

  if (resolved === false) {
    console.warn('[CORS] blocked origin:', origin);
    res.status(403).json({ message: 'CORS origin not allowed' });
    return;
  }

  const allowOrigin = typeof resolved === 'string' ? resolved : origin || '*';
  res.setHeader('Access-Control-Allow-Origin', allowOrigin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', ALLOW_METHODS);

  const requestedHeaders = req.headers['access-control-request-headers'];
  res.setHeader(
    'Access-Control-Allow-Headers',
    requestedHeaders ? String(requestedHeaders) : DEFAULT_ALLOW_HEADERS,
  );
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    console.log('[CORS preflight OK]', req.method, req.originalUrl, {
      origin: origin ?? 'none',
      requestMethod: req.headers['access-control-request-method'],
      requestHeaders: requestedHeaders ?? 'none',
      allowOrigin,
    });
    res.status(204).end();
    return;
  }

  if (req.method === 'POST') {
    console.log('[RAW POST] URL:', req.originalUrl, 'Method:', req.method, 'Origin:', origin ?? 'none');
  }

  next();
}

/** Лог ошибок, связанных с CORS (сообщение в err) */
export function corsErrorLogger(
  err: Error,
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (/cors/i.test(err.message)) {
    console.error('[CORS ERROR]', err.message, { method: req.method, url: req.originalUrl });
  }
  next(err);
}
