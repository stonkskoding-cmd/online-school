import { Express, Request, Response } from 'express';

function healthPayload() {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };
}

function pingHandler(_req: Request, res: Response) {
  res.json(healthPayload());
}

/** Лёгкие эндпоинты для keep-alive (Render free tier, UptimeRobot, GitHub Actions). */
export function registerKeepaliveRoutes(app: Express) {
  app.get('/health', pingHandler);
  app.get('/api/health', pingHandler);
  app.get('/api/ping', pingHandler);
}

// Render free tier усыпляет сервис после ~15 мин без входящих запросов.
// Пингуем чуть чаще, с запасом.
const SELF_PING_INTERVAL_MS = 10 * 60 * 1000;
let selfPingTimer: ReturnType<typeof setInterval> | null = null;

/**
 * Самопинг: бэкенд сам периодически дёргает свой публичный /api/health, чтобы
 * не заснуть. Работает, пока процесс жив; если сервис всё же уснёт (деплой,
 * рестарт), его разбудит внешний пинг (GitHub Action), и самопинг возобновится.
 */
export function startSelfPing() {
  const base = (process.env.BACKEND_URL || '').trim().replace(/\/$/, '');
  if (process.env.NODE_ENV !== 'production' || !base) {
    console.log('[keepalive] self-ping выключен (не production или нет BACKEND_URL)');
    return;
  }

  const url = `${base}/api/health`;
  selfPingTimer = setInterval(() => {
    fetch(url)
      .then((r) => console.log(`[keepalive] self-ping ${r.status}`))
      .catch((e) =>
        console.warn('[keepalive] self-ping failed:', e instanceof Error ? e.message : e),
      );
  }, SELF_PING_INTERVAL_MS);

  // Таймер не должен мешать корректному завершению процесса
  if (typeof selfPingTimer.unref === 'function') selfPingTimer.unref();
  console.log(`[keepalive] self-ping каждые ${SELF_PING_INTERVAL_MS / 60000} мин → ${url}`);
}

export function stopSelfPing() {
  if (selfPingTimer) clearInterval(selfPingTimer);
  selfPingTimer = null;
}
