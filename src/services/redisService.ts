import Redis from 'ioredis';
import { logger } from '../utils/logger';

class RedisService {
  private static instance: RedisService;
  private client: Redis;
  private readonly defaultTTL: number;

  private constructor() {
    this.defaultTTL = parseInt(process.env.CACHE_TTL || '86400'); // 24 hours in seconds
    
    this.client = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });

    this.client.on('error', (error) => {
      logger.error('Redis Client Error:', error);
    });

    this.client.on('connect', () => {
      logger.info('Redis Client Connected');
    });
  }

  public static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }

  private generateKey(type: string, id: string): string {
    return `trustos:${type}:${id}`;
  }

  async get<T>(type: string, id: string): Promise<T | null> {
    try {
      const key = this.generateKey(type, id);
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Redis get error:', error);
      return null;
    }
  }

  async set(type: string, id: string, data: any, ttl?: number): Promise<void> {
    try {
      const key = this.generateKey(type, id);
      await this.client.set(
        key,
        JSON.stringify(data),
        'EX',
        ttl || this.defaultTTL
      );
    } catch (error) {
      logger.error('Redis set error:', error);
    }
  }

  async delete(type: string, id: string): Promise<void> {
    try {
      const key = this.generateKey(type, id);
      await this.client.del(key);
    } catch (error) {
      logger.error('Redis delete error:', error);
    }
  }

  async clearCache(): Promise<void> {
    try {
      const keys = await this.client.keys('trustos:*');
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch (error) {
      logger.error('Redis clear cache error:', error);
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.client.quit();
    } catch (error) {
      logger.error('Redis disconnect error:', error);
    }
  }
}

export default RedisService; 