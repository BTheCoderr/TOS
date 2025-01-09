import { VerificationCache } from '../types/verification';

export class InMemoryVerificationCache implements VerificationCache {
  private cache: Map<string, any>;
  private timeouts: Map<string, NodeJS.Timeout>;

  constructor() {
    this.cache = new Map();
    this.timeouts = new Map();
  }

  async get(key: string): Promise<any | null> {
    return this.cache.get(key) || null;
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
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
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
    const timeout = this.timeouts.get(key);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(key);
    }
  }

  // Helper method to clear all cache entries
  async clear(): Promise<void> {
    this.cache.clear();
    for (const timeout of this.timeouts.values()) {
      clearTimeout(timeout);
    }
    this.timeouts.clear();
  }

  // Helper method to get cache size
  size(): number {
    return this.cache.size;
  }
} 