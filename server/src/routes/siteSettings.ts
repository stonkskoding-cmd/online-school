import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { verifyAdmin } from '../middleware/authMiddleware';
import {
  DEFAULT_FOOTER_SETTINGS,
  FOOTER_SETTING_KEYS,
  mergeSiteSettings,
} from '../lib/siteSettingsDefaults';

const router = Router();

function parseBulkBody(body: unknown): Record<string, string> {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid settings payload');
  }
  const record = body as Record<string, unknown>;
  const source =
    record.settings && typeof record.settings === 'object' && !Array.isArray(record.settings)
      ? (record.settings as Record<string, unknown>)
      : record;

  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(source)) {
    if (key === 'settings') continue;
    result[key] = String(value ?? '');
  }
  return result;
}

/** Публично: все настройки сайта (для футера) */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const rows = await prisma.siteSetting.findMany();
    res.json({ settings: mergeSiteSettings(rows) });
  } catch (error) {
    console.error('[site-settings] GET failed', error);
    res.status(500).json({ message: 'Failed to load site settings' });
  }
});

/** Админ: массовое обновление настроек */
router.put('/bulk', verifyAdmin, async (req: Request, res: Response) => {
  try {
    let settings: Record<string, string>;
    try {
      settings = parseBulkBody(req.body);
    } catch {
      res.status(400).json({ message: 'Invalid settings payload' });
      return;
    }

    const entries = Object.entries(settings).filter(([key]) => key.trim().length > 0);
    if (entries.length === 0) {
      res.status(400).json({ message: 'No settings provided' });
      return;
    }

    await prisma.$transaction(
      entries.map(([key, value]) =>
        prisma.siteSetting.upsert({
          where: { key },
          create: { key, value: value.trim() },
          update: { value: value.trim() },
        }),
      ),
    );

    const rows = await prisma.siteSetting.findMany();
    console.log('[site-settings] bulk updated', entries.length, 'keys');
    res.json({ ok: true, settings: mergeSiteSettings(rows) });
  } catch (error) {
    console.error('[site-settings] PUT /bulk failed', error);
    res.status(500).json({ message: 'Failed to update site settings' });
  }
});

/** Админ: сброс футера к значениям по умолчанию */
router.post('/footer/reset', verifyAdmin, async (_req: Request, res: Response) => {
  try {
    await prisma.$transaction(
      FOOTER_SETTING_KEYS.map((key) =>
        prisma.siteSetting.upsert({
          where: { key },
          create: { key, value: DEFAULT_FOOTER_SETTINGS[key] },
          update: { value: DEFAULT_FOOTER_SETTINGS[key] },
        }),
      ),
    );
    res.json({ ok: true, settings: { ...DEFAULT_FOOTER_SETTINGS } });
  } catch (error) {
    console.error('[site-settings] reset failed', error);
    res.status(500).json({ message: 'Failed to reset footer settings' });
  }
});

export default router;
