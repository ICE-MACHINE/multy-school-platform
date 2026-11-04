import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const isProduction = (process.env.NODE_ENV || 'development') === 'production';
if (isProduction && (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET)) {
  throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be set in production');
}
if (isProduction && !process.env.ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY must be set in production');
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_DATABASE || 'multyschool',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'fallbacksecret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'fallbackrefresh',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },
  security: {
    encryptionKey: process.env.ENCRYPTION_KEY || '',
    encryptionKeyId: process.env.ENCRYPTION_KEY_ID || 'k1',
    encryptionKeys: process.env.ENCRYPTION_KEYS || '',
    trustProxy: process.env.TRUST_PROXY === 'true',
    hstsPreload: process.env.HSTS_PRELOAD === 'true',
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  cron: {
    notificationCleanup: process.env.NOTIFICATION_CLEANUP_CRON || '0 2 * * *',
    timezone: process.env.NOTIFICATION_CLEANUP_TZ || 'Africa/Algiers',
  },
  ai: {
    apiKey: process.env.META_AI_API_KEY || process.env.LLAMA_API_KEY || '',
    // Meta Model API (official docs): https://api.meta.ai/v1, Bearer MODEL_API_KEY.
    baseUrl: (process.env.META_AI_BASE_URL || 'https://api.meta.ai/v1').replace(/\/$/, ''),
    model: process.env.META_AI_MODEL || '',
    visionModel: process.env.META_AI_VISION_MODEL || process.env.META_AI_MODEL || '',
    timeoutMs: parseInt(process.env.AI_REQUEST_TIMEOUT_MS || '30000'),
    autoApproveSchedule: process.env.AI_AUTO_APPROVE_SCHEDULE === 'true',
    // SAM 3.1 is served by the same Meta Model API (Responses API), same key.
    samApiUrl: (process.env.SAM_API_URL || process.env.META_AI_BASE_URL || 'https://api.meta.ai/v1').replace(/\/$/, ''),
    samApiKey: process.env.SAM_API_KEY || process.env.META_AI_API_KEY || process.env.LLAMA_API_KEY || '',
    samModel: process.env.SAM_MODEL || 'sam-3.1',
    documentKey: process.env.DOCUMENT_ENCRYPTION_KEY || '',
  },
};