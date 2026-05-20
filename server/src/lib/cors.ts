import { IncomingMessage, ServerResponse } from 'http';

const PRODUCTION_FRONTEND = 'https://online-school-1-zj77.onrender.com';

export const CORS_BUILD_ID = `cors-pkg-${Date.now()}`;

export function normalizeOrigin(value: string): string {
  return value.trim().replace(/\r/g, '').replace(/\/$/, '');
}

export function getAllowedOrigins(): string[] {
  const fromEnv = [
    process.env.FRONTEND_URL,
    process.env.CLIENT_URL,
    PRODUCTION_FRONTEND,
    'https://online-school-1-zj77.onrender.com',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
  ]
    .filter((v): v is string => Boolean(v))
    .map(normalizeOrigin);

  return [...new Set(fromEnv)];
}

const allowedSet = () => new Set(getAllowedOrigins());

function pickAllowOrigin(origin: string | undefined): string {
  if (origin && allowedSet().has(normalizeOrigin(origin))) {
    return origin;
  }
  return getAllowedOrigins()[0] || PRODUCTION_FRONTEND;
}

/** OPTIONS на уровне http.Server — до Express */
export function handleHttpPreflight(
  req: IncomingMessage,
  res: ServerResponse,
): boolean {
  if (req.method !== 'OPTIONS') {
    return false;
  }

  const allowOrigin = pickAllowOrigin(req.headers.origin);
  res.setHeader('Access-Control-Allow-Origin', allowOrigin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With',
  );
  res.setHeader('Access-Control-Max-Age', '86400');

  console.log(
    `✅ [HTTP OPTIONS intercepted] ${req.url} | Allow-Origin: ${allowOrigin}`,
  );
  res.writeHead(200);
  res.end();
  return true;
}
