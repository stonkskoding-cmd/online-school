import { prisma } from './prisma';

/** Проверка доступности таблицы messages (для логов при старте и health) */
export async function checkMessagesTable(): Promise<{ ok: boolean; error?: string }> {
  try {
    await prisma.$queryRaw`SELECT 1 FROM messages LIMIT 1`;
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[chat-db] messages table check failed:', message);
    return { ok: false, error: message };
  }
}
