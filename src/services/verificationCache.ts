import Redis from 'ioredis';
import { VerificationCache } from '../types/verification';
import { logger } from '../utils/logger';

abstract class BaseCache {
  protected async handleError(error: any, operation: string): Promise<null> {
    logger.error(`Cache ${operation} error:`, error);
    return null;
  }
}

export class RedisVerificationCache extends BaseCache implements VerificationCache {
  private redis: Redis;

  constructor() {
    super();
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });
  }

  async get(key: string): Promise<any | null> {
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      return this.handleError(error, 'get');
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await this.redis.setex(key, ttl, serialized);
      } else {
        await this.redis.set(key, serialized);
      }
    } catch (error) {
      await this.handleError(error, 'set');
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      await this.handleError(error, 'delete');
    }
  }

  async cleanup(): Promise<void> {
    try {
      await this.redis.quit();
    } catch (error) {
      logger.error('Redis cleanup error:', error);
    }
  }
}

export class InMemoryVerificationCache implements VerificationCache {
  private cache: Map<string, { value: any; expiry?: number }>;

  constructor() {
    this.cache = new Map();
  }

  async get(key: string): Promise<any | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (entry.expiry && entry.expiry < Date.now()) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    const entry = {
      value,
      expiry: ttl ? Date.now() + ttl * 1000 : undefined
    };
    this.cache.set(key, entry);
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiry && entry.expiry < now) {
        this.cache.delete(key);
      }
    }
  }
} 