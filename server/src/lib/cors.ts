import { IncomingMessage, ServerResponse } from 'http';

/** Явный whitelist — все известные адреса фронта, бэка и локальной разработки */
export const CORS_ORIGINS = [
  'https://online-school-frontend-ryc0.onrender.com',
  'https://online-school-1-zj77.onrender.com',
  'https://online-school-backend-mqn9.onrender.com',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
];

export const CORS_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'] as const;

export const CORS_ALLOWED_HEADERS = [
  'Content-Type',
  'Authorization',
  'X-Requested-With',
  'Accept',
] as const;

/** Любой Render static site / web service на *.onrender.com */
const ONRENDER_ORIGIN = /^https:\/\/[\w-]+\.onrender\.com$/i;

export const CORS_BUILD_ID = `cors-pkg-${Date.now()}`;

export function normalizeOrigin(value: string): string {
  return value.trim().replace(/\r/g, '').replace(/\/$/, '');
}

export function getAllowedOrigins(): string[] {
  const fromEnv = [
    process.env.FRONTEND_URL,
    process.env.CLIENT_URL,
    ...CORS_ORIGINS,
  ]
    .filter((v): v is string => Boolean(v))
    .map(normalizeOrigin);

  return [...new Set(fromEnv)];
}

export function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return true;
  const normalized = normalizeOrigin(origin);
  if (getAllowedOrigins().includes(normalized)) return true;
  return ONRENDER_ORIGIN.test(normalized);
}

export function resolveCorsOrigin(origin: string | undefined): string | boolean {
  if (!origin) return '*';
  if (isOriginAllowed(origin)) return normalizeOrigin(origin);
  return false;
}

/** OPTIONS на уровне http.Server — до Express (если используется) */
export function handleHttpPreflight(
  req: IncomingMessage,
  res: ServerResponse,
): boolean {
  if (req.method !== 'OPTIONS') {
    return false;
  }

  const requestOrigin = req.headers.origin;
  console.log('CORS allowed origin:', requestOrigin ?? 'none');

  const resolved = resolveCorsOrigin(requestOrigin);
  const allowOrigin =
    typeof resolved === 'string'
      ? resolved
      : getAllowedOrigins()[0] || CORS_ORIGINS[0];

  res.setHeader('Access-Control-Allow-Origin', allowOrigin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', CORS_METHODS.join(', '));
  res.setHeader('Access-Control-Allow-Headers', CORS_ALLOWED_HEADERS.join(', '));
  res.setHeader('Access-Control-Max-Age', '86400');

  console.log(`✅ [HTTP OPTIONS] ${req.url} | Allow-Origin: ${allowOrigin}`);
  res.writeHead(200);
  res.end();
  return true;
}
