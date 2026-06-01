import { Response } from 'express';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

/** Лог + ответ при ошибке Prisma/чата */
export function respondChatError(res: Response, label: string, error: unknown): void {
  const err = error as { code?: string; message?: string };
  console.error(`[chat] ${label}`, error);

  if (err.code === 'P2021') {
    res.status(503).json({
      message: 'Таблица сообщений не найдена. Выполните prisma migrate deploy на сервере.',
      error: err.message,
    });
    return;
  }

  if (err.code === 'P1001' || err.code === 'P1002') {
    res.status(503).json({
      message: 'База данных недоступна. Повторите позже.',
      error: err.message,
    });
    return;
  }

  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'production' ? undefined : err.message,
  });
}
