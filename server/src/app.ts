import express, { Request, Response, NextFunction } from 'express';
// import helmet from 'helmet';
// import rateLimit from 'express-rate-limit';

import apiRouter from './routes';

const app = express();

// 1. CORS - ПЕРВЫМ!
app.use((req, res, next) => {
  // Получаем адрес фронтенда из переменных
  const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';

  res.header('Access-Control-Allow-Origin', allowedOrigin);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    console.log('✅ OPTIONS handled for', req.path); // Этот лог поможет нам убедиться, что код работает
    return res.sendStatus(200);
  }

  console.log(`📥 ${req.method} ${req.path}`);
  next();
});

// 2. Парсинг
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Роуты
app.use('/api', apiRouter);

// 4. Error handler с CORS
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';
  res.header('Access-Control-Allow-Origin', allowedOrigin);
  res.header('Access-Control-Allow-Credentials', 'true');
  console.error('❌ Error:', err.message);
  res.status(err.status || 500).json({ message: err.message });
});

export default app;
