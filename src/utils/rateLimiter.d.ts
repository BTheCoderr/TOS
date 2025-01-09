export declare const rateLimiter: {
  checkLimit(key: string, maxRequests: number, windowMs: number): Promise<boolean>;
}; 