import mongoose from 'mongoose';

export const connectToDatabase = async () => {
  try {
    const mongoUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017/crm';
    await mongoose.connect(mongoUrl);
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
    console.log('⚠️  Continuing without database connection...');
    // Don't throw error to prevent app crash
  }
};

export const disconnectFromDatabase = async () => {
  try {
    await mongoose.disconnect();
    console.log('Database disconnected successfully');
  } catch (error) {
    console.error('Error disconnecting from the database:', error);
    throw error;
  }
};

export default { connectToDatabase, disconnectFromDatabase };