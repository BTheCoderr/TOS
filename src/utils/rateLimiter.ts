import Redis from 'ioredis';
import { logger } from './logger';

export interface RateLimiter {
  checkLimit(key: string, maxRequests: number, windowMs: number): Promise<boolean>;
}

class RateLimiterImpl implements RateLimiter {
  private redis: Redis;

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
    this.redis = new Redis(redisUrl);

    this.redis.on('error', (error) => {
      logger.error('Rate limiter Redis error:', error);
    });
  }

  async checkLimit(key: string, maxRequests: number, windowMs: number): Promise<boolean> {
    try {
      const current = await this.redis.incr(key);
      if (current === 1) {
        await this.redis.pexpire(key, windowMs);
      }
      return current <= maxRequests;
    } catch (error) {
      logger.error('Rate limit check failed:', error);
      return true; // Allow the request on error
    }
  }
}

export const rateLimiter: RateLimiter = new RateLimiterImpl(); 