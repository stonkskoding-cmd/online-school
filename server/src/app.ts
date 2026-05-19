import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { env } from './config/env';

import apiRouter from './routes';
import { errorHandler } from './middleware/error';

const app = express();

// CORS middleware - должен быть ПЕРВЫМ
app.use((req, res, next) => {
  const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';
  res.header('Access-Control-Allow-Origin', allowedOrigin);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});
console.log('CORS ENABLED FOR:', process.env.FRONTEND_URL);

app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path}`);
  next();
});

// 2) Парсинг тела — до роутов
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(helmet());

if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// 3) API: фронт шлёт на {VITE_API_URL}/auth/... где baseURL уже содержит /api
//    → здесь один префикс /api; внутри apiRouter только /auth, /packages, …
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use('/api', limiter);
app.use('/api', apiRouter);

// Health check (вне /api)
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use(errorHandler);

export default app;
