import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import apiRouter from './routes';
import { CORS_BUILD_ID, CORS_ORIGINS, getAllowedOrigins, isOriginAllowed } from './lib/cors';

console.log('🚀 APP LOADED | CORS_BUILD_ID:', CORS_BUILD_ID);
console.log('🧪 ALLOWED ORIGINS:', getAllowedOrigins());

const app = express();

app.set('trust proxy', 1);

/** CORS: явный whitelist + любой *.onrender.com */
const corsOptions: cors.CorsOptions = {
  origin(origin, callback) {
    if (!origin || isOriginAllowed(origin)) {
      callback(null, origin ?? true);
      return;
    }
    console.warn(`[CORS] blocked origin: ${origin}`);
    callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 204,
  preflightContinue: false,
};

app.use((req, _res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.originalUrl}`);
  next();
});

app.use(cors(corsOptions));

/** Дублируем whitelist для preflight (Render иногда шлёт OPTIONS до Express router) */
app.options('*', cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/health', (_req, res) => {
  res.json({ ok: true, build: CORS_BUILD_ID, origins: CORS_ORIGINS, ts: Date.now() });
});
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, build: CORS_BUILD_ID, origins: CORS_ORIGINS, ts: Date.now() });
});

app.use('/api', apiRouter);

app.use((_req, res) => {
  res.status(404).json({ message: 'Not found' });
});

app.use((err: Error & { status?: number }, req: Request, res: Response, _next: NextFunction) => {
  const origin = req.headers.origin;
  if (origin && isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  }
  console.error('❌ Error:', err.message);
  if (!res.headersSent) {
    res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
  }
});

export default app;

