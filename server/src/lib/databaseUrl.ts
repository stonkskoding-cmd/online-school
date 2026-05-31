/**
 * Supabase pooler (PgBouncer, порт 6543) + Prisma.
 * - pgbouncer=true — без prepared statements ("prepared statement already exists")
 * - connection_limit=1 — обязательно для migrate deploy через pooler
 */
export function ensurePoolerDatabaseUrl(databaseUrl: string): string {
  const trimmed = databaseUrl.trim().replace(/\r/g, '');
  if (!trimmed) return trimmed;

  try {
    const url = new URL(trimmed);
    if (!url.searchParams.has('pgbouncer')) {
      url.searchParams.set('pgbouncer', 'true');
    }
    if (!url.searchParams.has('connection_limit')) {
      url.searchParams.set('connection_limit', '1');
    }
    return url.toString();
  } catch {
    let result = trimmed;
    if (!/[?&]pgbouncer=/i.test(result)) {
      result = result.includes('?') ? `${result}&pgbouncer=true` : `${result}?pgbouncer=true`;
    }
    if (!/[?&]connection_limit=/i.test(result)) {
      result = `${result}&connection_limit=1`;
    }
    return result;
  }
}

/** Патчит DATABASE_URL в process.env перед migrate deploy и PrismaClient. */
export function applyPoolerDatabaseUrl(): string | undefined {
  const raw = process.env.DATABASE_URL;
  if (!raw) return undefined;
  const patched = ensurePoolerDatabaseUrl(raw);
  process.env.DATABASE_URL = patched;
  return patched;
}

/** @deprecated используй applyPoolerDatabaseUrl */
export const applyPgBouncerToDatabaseUrl = applyPoolerDatabaseUrl;

/** @deprecated используй ensurePoolerDatabaseUrl */
export const ensurePgBouncerParam = ensurePoolerDatabaseUrl;
