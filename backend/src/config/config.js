import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, '../..');

export const config = {
  port: Number(process.env.PORT || 4000),
  nodeEnv: process.env.NODE_ENV || 'development',
  allowedOrigins: (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean),

  logFile:  path.resolve(backendRoot, process.env.LOG_FILE  || './data/operations.log'),
  sql: {
    server: process.env.SQL_SERVER || process.env.DB_SERVER || 'localhost',
    database: process.env.SQL_DATABASE || process.env.DB_NAME || process.env.Database || 'ConvoBankDB',
    user: process.env.SQL_USER || process.env.DB_USER || '',
    password: process.env.SQL_PASSWORD || process.env.DB_PASSWORD || '',
    port: Number(process.env.SQL_PORT || process.env.DB_PORT || 1433),
    encrypt: String(process.env.SQL_ENCRYPT || process.env.DB_ENCRYPT || 'false').toLowerCase() === 'true',
    trustServerCertificate:
      String(
        process.env.SQL_TRUST_SERVER_CERTIFICATE
        || process.env.DB_TRUST_CERT
        || process.env.TrustServerCertificate
        || 'true'
      ).toLowerCase() === 'true',
    poolMax: Number(process.env.SQL_POOL_MAX || 10)
  },

  sessionTimeoutMs: Number(process.env.SESSION_TIMEOUT_MINUTES || 5) * 60 * 1000,
  sessionSecret:    process.env.SESSION_SECRET || 'dev-only-secret-change-me',
  bcryptRounds:     Number(process.env.BCRYPT_ROUNDS || 8),

  openrouterApiKey: process.env.OPENROUTER_API_KEY || '',
  openrouterModel:  process.env.OPENROUTER_MODEL  || 'google/gemini-2.0-flash-001',
  openrouterBaseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1'
};
