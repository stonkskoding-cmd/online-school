import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
// import helmet from 'helmet';
// import rateLimit from 'express-rate-limit';

import apiRouter from './routes';
import { CORS_BUILD_ID, getAllowedOrigins, isOriginAllowed, resolveCorsOrigin } from './lib/cors';

console.log('🚀 APP LOADED | CORS_BUILD_ID:', CORS_BUILD_ID);
console.log('🧪 ALLOWED ORIGINS:', getAllowedOrigins());

const corsOptions: cors.CorsOptions = {
  origin(origin, callback) {
    const resolved = resolveCorsOrigin(origin);
    if (resolved === false) {
      console.warn(`[CORS] blocked origin: ${origin}`);
      callback(new Error(`CORS blocked: ${origin}`));
      return;
    }
    callback(null, resolved);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200,
  preflightContinue: false,
};

const app = express();

// Лог каждого запроса (видно OPTIONS в Render)
app.use((req, _res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.originalUrl}`);
  next();
});

// Официальный cors — ПЕРВЫМ
app.use(cors(corsOptions));

// Явная обработка OPTIONS (.* — все пути, включая /api/auth/login)
app.options(/.*/, cors(corsOptions), (req, res) => {
  console.log('✅ OPTIONS handled for', req.path);
  res.sendStatus(200);
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/health', (_req, res) => {
  res.json({ ok: true, build: CORS_BUILD_ID, ts: Date.now() });
});
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, build: CORS_BUILD_ID, ts: Date.now() });
});

app.use('/api', apiRouter);

app.use((_req, res) => {
  res.status(404).json({ message: 'Not found' });
});

app.use((err: Error & { status?: number }, req: Request, res: Response, _next: NextFunction) => {
  cors(corsOptions)(req, res, () => {
    console.error('❌ Error:', err.message);
    res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
  });
});

export default app;
