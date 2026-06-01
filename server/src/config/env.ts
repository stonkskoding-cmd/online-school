import dotenv from 'dotenv';

dotenv.config();

const jwtSecret = (process.env.JWT_SECRET || '').trim().replace(/\r/g, '');
const databaseUrl = (process.env.DATABASE_URL || '').trim().replace(/\r/g, '');

if (!jwtSecret) {
  console.warn('[env] JWT_SECRET is not set — auth tokens will fail until configured on Render');
}

if (!databaseUrl) {
  console.warn('[env] DATABASE_URL is not set — DB routes will fail; admin env-login may still work');
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),
  DATABASE_URL: databaseUrl,
  DIRECT_URL: process.env.DIRECT_URL || '',
  JWT_SECRET: jwtSecret || 'fallback-dev-only-set-JWT_SECRET-on-render',
  FRONTEND_URL: (process.env.FRONTEND_URL || 'http://localhost:3000').trim().replace(/\r/g, ''),
  BACKEND_URL: (
    process.env.BACKEND_URL ||
    (process.env.NODE_ENV === 'production'
      ? 'https://online-school-backend-mqn9.onrender.com'
      : '')
  )
    .trim()
    .replace(/\r/g, ''),
  CLIENT_URL: (process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:3000')
    .trim()
    .replace(/\r/g, ''),
  YOOKASSA_SHOP_ID: process.env.YOOKASSA_SHOP_ID || '',
  YOOKASSA_SECRET_KEY: process.env.YOOKASSA_SECRET_KEY || '',
  R2_ENDPOINT: process.env.R2_ENDPOINT || '',
  R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID || '',
  R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY || '',
  R2_BUCKET_NAME: process.env.R2_BUCKET_NAME || '',
  R2_PUBLIC_URL: process.env.R2_PUBLIC_URL || '',
  ADMIN_USERNAME: (process.env.ADMIN_USERNAME || 'dinastia_admin').trim().replace(/\r/g, ''),
  ADMIN_PASSWORD: (process.env.ADMIN_PASSWORD || '').trim().replace(/\r/g, ''),
};

export const corsAllowedOrigins = [
  env.FRONTEND_URL,
  env.CLIENT_URL,
  'https://online-school-frontend-ryc0.onrender.com',
  'https://online-school-1-zj77.onrender.com',
  'http://localhost:3000',
  'http://localhost:5173',
].filter(Boolean);
