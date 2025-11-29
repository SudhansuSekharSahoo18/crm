// Server Configuration
export const SERVER_CONFIG = {
  PORT: process.env.PORT || 5000,
  HOST: process.env.HOST || 'localhost',
};

// Base URLs
export const BASE_URL = `http://${SERVER_CONFIG.HOST}:${SERVER_CONFIG.PORT}`;

// Upload Configuration
export const UPLOAD_CONFIG = {
  BASE_PATH: '/uploads',
  BILLS_PATH: '/uploads/bills',
  TRANSPORT_BILLS_PATH: '/uploads/transport-bills',
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: /jpeg|jpg|png|gif|pdf|doc|docx/,
};

// Helper function to get full upload URL
export const getUploadUrl = (filename: string, subPath: string = 'bills') => {
  return `${BASE_URL}/uploads/${subPath}/${filename}`;
};
