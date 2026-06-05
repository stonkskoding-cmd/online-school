import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';

import apiRouter from './routes';
import chatRoutes from './routes/chat';
import { CORS_BUILD_ID } from './lib/cors';
import { corsMiddleware, corsErrorLogger } from './middleware/cors';

console.log('🚀 APP LOADED | CORS_BUILD_ID:', CORS_BUILD_ID);

const app = express();

app.set('trust proxy', 1);

app.use((req, _res, next) => {
  console.log(`[MIDDLEWARE] ${req.method} ${req.path} | originalUrl: ${req.originalUrl}`);
  next();
});

/** CORS — один middleware, без credentials (иначе POST блокируется после OPTIONS) */
app.use(corsMiddleware);

app.use((req, _res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.originalUrl} | origin: ${req.headers.origin ?? 'none'}`);
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

app.get('/health', (_req, res) => {
  res.json({ ok: true, build: CORS_BUILD_ID, ts: Date.now() });
});
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, build: CORS_BUILD_ID, ts: Date.now() });
});

app.use(
  '/api/chat',
  (req, _res, next) => {
    console.log(`[CHAT ROUTER] ${req.method} ${req.path}`);
    next();
  },
  chatRoutes,
);

app.use('/api', apiRouter);

app.use((_req, res) => {
  res.status(404).json({ message: 'Not found' });
});

app.use(corsErrorLogger);

app.use((err: Error & { status?: number }, req: Request, res: Response, _next: NextFunction) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  console.error('Global error:', err);
  if (!res.headersSent) {
    res.status(err.status || 500).json({
      error: err.message || 'Internal Server Error',
      message: err.message || 'Internal Server Error',
    });
  }
});

export default app;
