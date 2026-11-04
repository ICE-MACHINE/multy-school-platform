import Redis from 'ioredis';
import { env } from './env';
import { logger } from '../shared/utils/logger';

let redisClient: Redis | null = null;

export const connectRedis = async (): Promise<Redis | null> => {
  try {
    redisClient = new Redis({
      host: env.redis.host,
      port: env.redis.port,
      password: env.redis.password || undefined,
      retryStrategy: () => {
        return null;
      },
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    });

    redisClient.on('error', (err: Error) => {
      logger.error('Redis connection error:', err);
    });

    await Promise.race([
      redisClient.connect(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Redis connection timeout')), 3000)
      ),
    ]);

    await redisClient.ping();
    logger.info('Redis connected successfully');
    return redisClient;
  } catch (error) {
    logger.warn('Redis connection failed, running without cache:', error);
    if (redisClient) {
      redisClient.disconnect();
      redisClient = null;
    }
    return null;
  }
};

export const getRedisClient = (): Redis | null => {
  return redisClient;
};

export const disconnectRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
};