import { PrismaClient } from '@prisma/client';
import { applyPoolerDatabaseUrl } from './databaseUrl';

declare global {
  // eslint-disable-next-line no-var
  var __prismaClient: PrismaClient | undefined;
}

const databaseUrl = applyPoolerDatabaseUrl();

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
