import { prisma } from '../lib/prisma';
import { checkMessagesTable } from '../lib/chatDb';

export const connectDB = async (): Promise<void> => {
  try {
    await prisma.$connect();
    console.log('PostgreSQL (Supabase) connected successfully');

    const messagesCheck = await checkMessagesTable();
    if (messagesCheck.ok) {
      console.log('[db] messages table: OK');
    } else {
      console.error(
        '[db] messages table: MISSING — run: npx prisma migrate deploy',
        messagesCheck.error,
      );
    }
  } catch (error) {
    console.error('PostgreSQL connection error:', error);
    throw error;
  }
};
