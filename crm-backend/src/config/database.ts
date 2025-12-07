import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

export const sqlConfig = {
  user: process.env.DB_USER || 'sqladmin',
  password: process.env.DB_PASSWORD || '',
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME || 'crm_db',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true', // Use true for Azure
    trustServerCertificate: process.env.DB_TRUST_CERT === 'true', // Use true for local dev
    enableArithAbort: true,
    port: parseInt(process.env.DB_PORT || '1433'),
    connectTimeout: 30000,
    requestTimeout: 30000
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};