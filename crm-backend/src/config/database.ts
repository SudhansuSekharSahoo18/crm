import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const connectToDatabase = async () => {
  try {
    await prisma.$connect();
    console.log('Database connected successfully (SQLite)');
  } catch (error) {
    console.error('Database connection failed:', error);
    console.log('⚠️  Continuing without database connection...');
    // Don't throw error to prevent app crash
  }
};

const disconnectFromDatabase = async () => {
  await prisma.$disconnect();
};

export { connectToDatabase, disconnectFromDatabase, prisma };