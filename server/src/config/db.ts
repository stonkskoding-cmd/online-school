import { env } from './env';
import { prisma } from '../lib/prisma';

export const connectDB = async (): Promise<void> => {
  try {
    await prisma.$connect();
    console.log('PostgreSQL (Supabase) connected successfully');
  } catch (error) {
    console.error('PostgreSQL connection error:', error);
    throw error;
  }
};
