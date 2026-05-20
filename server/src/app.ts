import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
// import helmet from 'helmet';
// import rateLimit from 'express-rate-limit';

import apiRouter from './routes';
import { CORS_BUILD_ID, getAllowedOrigins } from './lib/cors';

console.log('🚀 APP LOADED | CORS_BUILD_ID:', CORS_BUILD_ID);
console.log('🧪 ALLOWED ORIGINS:', getAllowedOrigins());

const corsOptions: cors.CorsOptions = {
  origin: [
    'https://online-school-1-zj77.onrender.com',
    'http://localhost:3000',
    'http://localhost:5173',
    ...(process.env.FRONTEND_URL
      ? [process.env.FRONTEND_URL.trim().replace(/\r/g, '')]
      : []),
  ],
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
