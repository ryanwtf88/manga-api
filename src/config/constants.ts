import type { ScraperConfig, CacheConfig, RateLimitConfig, SourceInfo } from '../types/index.js';

export const SOURCES: Record<string, string> = {
  mangareader: 'https://mangareader.to',
  hentai20: 'https://hentai20.io',
  omegascans: 'https://omegascans.org',
};

export const SOURCE_INFO: Record<string, SourceInfo> = {
  mangareader: {
    name: 'MangaReader',
    baseUrl: SOURCES.mangareader,
    isActive: true,
    features: [
      'search',
      'search-suggestions',
      'popular-today',
      'popular-week',
      'popular-month',
      'latest-updates',
      'popular',
      'new-release',
      'recommendations',
      'trending',
      'completed',
      'genres',
      'home',
      'info',
      'chapter',
    ],
  },
  hentai20: {
    name: 'Hentai20',
    baseUrl: SOURCES.hentai20,
    isActive: true,
    features: [
      'search',
      'popular',
      'latest-updates',
      'genres',
      'info',
      'chapter',
    ],
  },
  omegascans: {
    name: 'OmegaScans',
    baseUrl: SOURCES.omegascans,
    isActive: true,
    features: [
      'search',
      'popular',
      'latest-updates',
      'info',
      'chapter',
    ],
  },
};

export const SCRAPER_CONFIG: ScraperConfig = {
  baseUrl: '',
  timeout: 15000,
  userAgents: [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
  ],
  retryAttempts: 3,
  retryDelay: 1000,
};

export const CACHE_CONFIG: CacheConfig = {
  ttl: 600, // 10 minutes for in-memory cache
  checkperiod: 120, // Check for expired keys every 2 minutes
};

export const REDIS_CACHE_TTL = 3600; // 1 hour for Redis cache

export const RATE_LIMIT_CONFIG: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
};

export const EXPENSIVE_RATE_LIMIT_CONFIG: RateLimitConfig = {
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30, // 30 requests per window
};

export const SUPPORTED_GENRES = [
  'Action',
  'Adult',
  'Adventure',
  'Comedy',
  'Comics',
  'Doujinshi',
  'Drama',
  'Ecchi',
  'Fantasy',
  'Gender Bender',
  'GL',
  'Harem',
  'Hentai',
  'Historical',
  'Horror',
  'Isekai',
  'Josei',
  'Kimono',
  'Manga Hentai',
  'Manhwa',
  'Manhwa Hentai',
  'Martial Arts',
  'Mature',
  'Mystery',
  'Psychological',
  'Raw',
  'Romance',
  'School Life',
  'Sci-Fi',
  'Seinen',
  'Shoujo',
  'Shounen',
  'Slice of Life',
  'Smut',
  'Sports',
  'Supernatural',
  'Thriller',
  'Tragedy',
  'Uncensored',
  'Yuri',
];

export const API_VERSION = 'v1';
