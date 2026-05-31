/**
 * Выполняется до `prisma migrate deploy`, чтобы CLI использовал pooler URL (6543).
 */
import dotenv from 'dotenv';
import { applyPoolerDatabaseUrl } from './lib/databaseUrl';

dotenv.config();

const url = applyPoolerDatabaseUrl();
if (url) {
  console.log('[prepareEnv] DATABASE_URL → pooler (pgbouncer + connection_limit=1)');
} else {
  console.warn('[prepareEnv] DATABASE_URL is not set');
}
