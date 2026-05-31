import { connectDB } from './db';

const MAX_DB_RETRIES = 8;
const RETRY_MS = 5000;

export async function connectDBWithRetry(attempt = 1): Promise<void> {
  try {
    await connectDB();
  } catch (error) {
    console.error(`PostgreSQL connection failed (attempt ${attempt}/${MAX_DB_RETRIES}):`, error);
    if (attempt >= MAX_DB_RETRIES) {
      console.error('PostgreSQL: max retries reached — API will return errors until DB is up');
      return;
    }
    await new Promise((r) => setTimeout(r, RETRY_MS));
    await connectDBWithRetry(attempt + 1);
  }
}
