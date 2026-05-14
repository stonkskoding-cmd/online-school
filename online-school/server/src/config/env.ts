import dotenv from 'dotenv';

dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  DATABASE_URL: process.env.DATABASE_URL || '',
  DIRECT_URL: process.env.DIRECT_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || '',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  BACKEND_URL: process.env.BACKEND_URL || '',
  CLIENT_URL: process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:3000',
  YOOKASSA_SHOP_ID: process.env.YOOKASSA_SHOP_ID || '',
  YOOKASSA_SECRET_KEY: process.env.YOOKASSA_SECRET_KEY || '',
  R2_ENDPOINT: process.env.R2_ENDPOINT || '',
  R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID || '',
  R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY || '',
  R2_BUCKET_NAME: process.env.R2_BUCKET_NAME || '',
  R2_PUBLIC_URL: process.env.R2_PUBLIC_URL || '',
  /** trim + strip CR — на Windows в .env часто остаётся \r в конце строки */
  ADMIN_USERNAME: (process.env.ADMIN_USERNAME || '').trim().replace(/\r/g, ''),
  ADMIN_PASSWORD: (process.env.ADMIN_PASSWORD || '').trim().replace(/\r/g, ''),
};

/** Разрешённые Origin для CORS (FRONTEND_URL + локальные порты для dev) */
export const corsAllowedOrigins = [
  env.FRONTEND_URL,
  env.CLIENT_URL,
  process.env.CLIENT_URL,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
].filter((origin, index, self) => Boolean(origin) && self.indexOf(origin) === index);

if (!env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined in environment variables');
}

if (!env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}
