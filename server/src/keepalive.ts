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
