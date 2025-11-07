import NodeCache from 'node-cache';
import { Redis } from '@upstash/redis';
import { CACHE_CONFIG, REDIS_CACHE_TTL } from '../config/constants.js';

// In-memory cache instance
export const memoryCache = new NodeCache({
  stdTTL: CACHE_CONFIG.ttl,
  checkperiod: CACHE_CONFIG.checkperiod,
  useClones: false,
});

// Redis cache instance (optional, will be null if not configured)
let redisCache: Redis | null = null;

try {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL || 'https://easy-dassie-30340.upstash.io';
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || 'AXaEAAIncDJlNTY5YWM4NWQ5ZGE0Mzg1YTljY2ZiOThiZTA3YzE0MHAyMzAzNDA';

  if (redisUrl && redisToken) {
    redisCache = new Redis({
      url: redisUrl,
      token: redisToken,
    });
    console.log('✓ Redis cache initialized');
  } else {
    console.log('⚠ Redis not configured, using in-memory cache only');
  }
} catch (error) {
  console.error('✗ Failed to initialize Redis cache:', error);
}

export interface CacheOptions {
  ttl?: number;
  useRedis?: boolean;
}

/**
 * Generate a cache key from parameters
 */
export function generateCacheKey(source: string, endpoint: string, params: Record<string, unknown>): string {
  const paramsString = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${value}`)
    .join('|');
  return `${source}:${endpoint}:${paramsString}`;
}

/**
 * Get data from cache (checks memory first, then Redis)
 */
export async function getFromCache<T>(key: string): Promise<T | null> {
  // Check memory cache first
  const memoryData = memoryCache.get<T>(key);
  if (memoryData !== undefined) {
    return memoryData;
  }

  // Check Redis if available
  if (redisCache) {
    try {
      const redisData = await redisCache.get<T>(key);
      if (redisData !== null) {
        // Store in memory cache for faster subsequent access
        memoryCache.set(key, redisData);
        return redisData;
      }
    } catch (error) {
      console.error('Redis get error:', error);
    }
  }

  return null;
}

/**
 * Set data in cache (stores in both memory and Redis)
 */
export async function setInCache<T>(
  key: string,
  value: T,
  options: CacheOptions = {}
): Promise<void> {
  const { ttl = CACHE_CONFIG.ttl, useRedis = true } = options;

  // Store in memory cache
  memoryCache.set(key, value, ttl);

  // Store in Redis if available and enabled
  if (redisCache && useRedis) {
    try {
      await redisCache.set(key, value, {
        ex: REDIS_CACHE_TTL,
      });
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }
}

/**
 * Delete data from cache
 */
export async function deleteFromCache(key: string): Promise<void> {
  memoryCache.del(key);

  if (redisCache) {
    try {
      await redisCache.del(key);
    } catch (error) {
      console.error('Redis delete error:', error);
    }
  }
}

/**
 * Clear all cache
 */
export async function clearCache(): Promise<void> {
  memoryCache.flushAll();

  if (redisCache) {
    try {
      await redisCache.flushall();
    } catch (error) {
      console.error('Redis flush error:', error);
    }
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    memory: {
      keys: memoryCache.keys().length,
      stats: memoryCache.getStats(),
    },
    redis: {
      enabled: redisCache !== null,
    },
  };
}
