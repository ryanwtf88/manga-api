import { rateLimiter } from 'hono-rate-limiter';
import { RATE_LIMIT_CONFIG, EXPENSIVE_RATE_LIMIT_CONFIG } from '../config/constants.js';

/**
 * Standard rate limiter for general API endpoints
 * 100 requests per 15 minutes per IP
 */
export const standardRateLimiter = rateLimiter({
  windowMs: RATE_LIMIT_CONFIG.windowMs,
  limit: RATE_LIMIT_CONFIG.max,
  standardHeaders: 'draft-6',
  keyGenerator: (c) => {
    // Try to get real IP from headers (for proxy/load balancer scenarios)
    const forwarded = c.req.header('x-forwarded-for');
    const realIp = c.req.header('x-real-ip');
    return forwarded?.split(',')[0] || realIp || 'unknown';
  },
});

/**
 * Expensive rate limiter for resource-intensive endpoints
 * 30 requests per 5 minutes per IP
 */
export const expensiveRateLimiter = rateLimiter({
  windowMs: EXPENSIVE_RATE_LIMIT_CONFIG.windowMs,
  limit: EXPENSIVE_RATE_LIMIT_CONFIG.max,
  standardHeaders: 'draft-6',
  keyGenerator: (c) => {
    const forwarded = c.req.header('x-forwarded-for');
    const realIp = c.req.header('x-real-ip');
    return forwarded?.split(',')[0] || realIp || 'unknown';
  },
});

/**
 * Request queue for scraping operations
 */
class RequestQueue {
  private queue: Array<() => Promise<unknown>> = [];
  private processing = false;
  private delayMs: number;

  constructor(delayMs = 500) {
    this.delayMs = delayMs;
  }

  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      if (!this.processing) {
        this.process();
      }
    });
  }

  private async process() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const fn = this.queue.shift();
      if (fn) {
        await fn();
        // Add delay between requests to avoid overwhelming the server
        if (this.queue.length > 0) {
          await new Promise((resolve) => setTimeout(resolve, this.delayMs));
        }
      }
    }

    this.processing = false;
  }

  getQueueSize(): number {
    return this.queue.length;
  }
}

// Global request queue instance
export const requestQueue = new RequestQueue(500);
