import { Prisma, PrismaClient } from '@prisma/client';
import { applyPoolerDatabaseUrl } from './databaseUrl';

function logMessageModelTypes(): void {
  const message = Prisma.dmmf.datamodel.models.find((m) => m.name === 'Message');
  if (!message) {
    console.warn('[prisma] Message model not found in DMMF');
    return;
  }
  const fields = Object.fromEntries(message.fields.map((f) => [f.name, f.type]));
  console.log('[prisma] Message field types:', fields);
  if (fields.senderId !== 'String') {
    console.error('[prisma] FATAL: senderId must be String in generated client, got:', fields.senderId);
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __prismaClient: PrismaClient | undefined;
}

const databaseUrl = applyPoolerDatabaseUrl();

logMessageModelTypes();

export const prisma =
  globalThis.__prismaClient ??
  new PrismaClient({
    datasources: databaseUrl ? { db: { url: databaseUrl } } : undefined,
    log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prismaClient = prisma;
}

if (process.env.NODE_ENV === 'production' && databaseUrl?.includes('pgbouncer=true')) {
  console.log('[prisma] DATABASE_URL configured for Supabase PgBouncer (pgbouncer=true)');
}

/** При старте: Prisma Client знает модель Message → таблица messages */
void prisma.$queryRaw`SELECT 1 FROM messages LIMIT 0`.then(
  () => console.log('[prisma] messages table: reachable'),
  (err) => console.warn('[prisma] messages table check failed:', err instanceof Error ? err.message : err),
);
