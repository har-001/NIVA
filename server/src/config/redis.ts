// ============================================
// NIVA — Redis Client
// ============================================

import Redis from 'ioredis';
import { config } from './index';
import { logger } from '../utils/logger';

let redis: Redis | null = null;
let hasLoggedRedisOffline = false;

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      enableOfflineQueue: false,
      retryStrategy(times) {
        if (times > 3) {
          if (!hasLoggedRedisOffline) {
            logger.warn('⚠️ Redis is offline or not running. Server continues in zero-cache fallback mode.');
            hasLoggedRedisOffline = true;
          }
          return null; // Stop retrying to prevent connection error loops
        }
        return Math.min(times * 200, 1000);
      },
    });

    redis.on('connect', () => {
      logger.info('✅ Redis connected successfully');
      hasLoggedRedisOffline = false;
    });

    redis.on('error', (err) => {
      if (!hasLoggedRedisOffline) {
        logger.warn(`⚠️ Redis notice: ${err.message}. Operating in fallback mode.`);
        hasLoggedRedisOffline = true;
      }
    });
  }
  return redis;
}

export async function disconnectRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
    logger.info('Redis disconnected');
  }
}
