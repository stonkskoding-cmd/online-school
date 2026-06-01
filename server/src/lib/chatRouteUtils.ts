import { Response } from 'express';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

function prismaErrorMessage(error: unknown): string {
  const err = error as { code?: string; message?: string; meta?: unknown };
  const parts = [err.code, err.message].filter(Boolean);
  if (err.meta) {
    parts.push(JSON.stringify(err.meta));
  }
  return parts.join(' | ') || 'Unknown error';
}

/** Лог + ответ при ошибке Prisma/чата */
export function respondChatError(res: Response, label: string, error: unknown): void {
  const err = error as { code?: string; message?: string; stack?: string };
  const detail = prismaErrorMessage(error);

  console.error(`[CHAT] ${label}`, detail);
  if (err.stack) {
    console.error(`[CHAT] ${label} stack:`, err.stack);
  }

  if (err.code === 'P2021' || detail.includes('does not exist') || detail.includes('messages')) {
    res.status(503).json({
      message: 'Таблица messages не найдена. На Render выполните: npx prisma migrate deploy',
      error: detail,
    });
    return;
  }

  if (err.code === 'P1001' || err.code === 'P1002' || err.code === 'P1017') {
    res.status(503).json({
      message: 'База данных недоступна. Повторите позже.',
      error: detail,
    });
    return;
  }

  res.status(500).json({
    message: 'Internal server error',
    error: detail,
  });
}
