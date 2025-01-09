import { StatsCache } from '../../types/statistics';
import { logger } from '../../utils/logger';

export class InMemoryStatsCache implements StatsCache {
  private cache: Map<string, string>;
  private timeouts: Map<string, NodeJS.Timeout>;

  constructor() {
    this.cache = new Map();
    this.timeouts = new Map();
  }

  async get(key: string): Promise<string | null> {
    try {
      return this.cache.get(key) || null;
    } catch (error) {
      logger.error('Error getting stats from cache:', error);
      return null;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    try {
      this.cache.set(key, value);

      // Clear any existing timeout for this key
      const existingTimeout = this.timeouts.get(key);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      // Set new timeout if TTL is provided
      if (ttl) {
        const timeout = setTimeout(() => {
          this.cache.delete(key);
          this.timeouts.delete(key);
        }, ttl * 1000);
        this.timeouts.set(key, timeout);
      }
    } catch (error) {
      logger.error('Error setting stats in cache:', error);
    }
  }

  // Helper method to clear all cache entries
  async clear(): Promise<void> {
    try {
      this.cache.clear();
      for (const timeout of this.timeouts.values()) {
        clearTimeout(timeout);
      }
      this.timeouts.clear();
    } catch (error) {
      logger.error('Error clearing stats cache:', error);
    }
  }

  // Helper method to get cache size
  size(): number {
    return this.cache.size;
  }
} 