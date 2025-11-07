import { Hono } from 'hono';
import { Hentai20Scraper } from '../scrapers/hentai20.js';
import { SOURCES } from '../config/constants.js';
import { asyncHandler } from '../utils/errorHandler.js';
import { getFromCache, setInCache, generateCacheKey } from '../utils/cache.js';
import type { ApiResponse } from '../types/index.js';

const app = new Hono();
const scraper = new Hentai20Scraper(SOURCES.hentai20);
const SOURCE_NAME = 'hentai20';

function createResponse<T>(data: T, cached = false): ApiResponse<T> {
  return {
    success: true,
    source: SOURCE_NAME,
    data,
    cached,
    timestamp: new Date().toISOString(),
  };
}

function createPaginatedResponse<T>(
  data: T,
  currentPage: number,
  hasNextPage: boolean,
  totalPages?: number,
  cached = false
): ApiResponse<T> {
  return {
    success: true,
    source: SOURCE_NAME,
    data,
    pagination: {
      currentPage,
      hasNextPage,
      totalPages,
    },
    cached,
    timestamp: new Date().toISOString(),
  };
}

app.get('/search', asyncHandler(async (c) => {
  const query = c.req.query('q') || '';
  const page = parseInt(c.req.query('page') || '1');

  if (!query) {
    return c.json({ success: false, error: 'Query parameter "q" is required' }, 400);
  }

  const cacheKey = generateCacheKey(SOURCE_NAME, 'search', { query, page });
  const cached = await getFromCache<typeof results>(cacheKey);

  if (cached) {
    return c.json(createPaginatedResponse(cached, page, cached.length >= 20, undefined, true));
  }

  const results = await scraper.search(query, page);
  await setInCache(cacheKey, results);

  return c.json(createPaginatedResponse(results, page, results.length >= 20));
}));

app.get('/latest-updates', asyncHandler(async (c) => {
  const page = parseInt(c.req.query('page') || '1');

  const cacheKey = generateCacheKey(SOURCE_NAME, 'latest-updates', { page });
  const cached = await getFromCache<typeof results>(cacheKey);

  if (cached) {
    return c.json(createPaginatedResponse(cached, page, cached.length >= 20, undefined, true));
  }

  const results = await scraper.getLatestUpdates(page);
  await setInCache(cacheKey, results);

  return c.json(createPaginatedResponse(results, page, results.length >= 20));
}));

app.get('/popular', asyncHandler(async (c) => {
  const page = parseInt(c.req.query('page') || '1');

  const cacheKey = generateCacheKey(SOURCE_NAME, 'popular', { page });
  const cached = await getFromCache<typeof results>(cacheKey);

  if (cached) {
    return c.json(createPaginatedResponse(cached, page, cached.length >= 20, undefined, true));
  }

  const results = await scraper.getPopular(page);
  await setInCache(cacheKey, results);

  return c.json(createPaginatedResponse(results, page, results.length >= 20));
}));

app.get('/info/:id', asyncHandler(async (c) => {
  const id = c.req.param('id');

  if (!id) {
    return c.json({ success: false, error: 'ID parameter is required' }, 400);
  }

  const cacheKey = generateCacheKey(SOURCE_NAME, 'info', { id });
  const cached = await getFromCache<typeof result>(cacheKey);

  if (cached) {
    return c.json(createResponse(cached, true));
  }

  const result = await scraper.getInfo(id);
  await setInCache(cacheKey, result, { ttl: 3600 });

  return c.json(createResponse(result));
}));

app.get('/chapter/:id', asyncHandler(async (c) => {
  const id = c.req.param('id');

  if (!id) {
    return c.json({ success: false, error: 'ID parameter is required' }, 400);
  }

  const cacheKey = generateCacheKey(SOURCE_NAME, 'chapter', { id });
  const cached = await getFromCache<typeof result>(cacheKey);

  if (cached) {
    return c.json(createResponse(cached, true));
  }

  const result = await scraper.getChapter(id);
  await setInCache(cacheKey, result, { ttl: 3600 });

  return c.json(createResponse(result));
}));

app.get('/genres', asyncHandler(async (c) => {
  const cacheKey = generateCacheKey(SOURCE_NAME, 'genres', {});
  const cached = await getFromCache<typeof results>(cacheKey);

  if (cached) {
    return c.json(createResponse(cached, true));
  }

  const results = await scraper.getGenres();
  await setInCache(cacheKey, results, { ttl: 86400 });

  return c.json(createResponse(results));
}));

app.get('/genre/:genre', asyncHandler(async (c) => {
  const genre = c.req.param('genre');
  const page = parseInt(c.req.query('page') || '1');

  if (!genre) {
    return c.json({ success: false, error: 'Genre parameter is required' }, 400);
  }

  const cacheKey = generateCacheKey(SOURCE_NAME, 'genre', { genre, page });
  const cached = await getFromCache<typeof results>(cacheKey);

  if (cached) {
    return c.json(createPaginatedResponse(cached, page, cached.length >= 20, undefined, true));
  }

  const results = await scraper.getGenre(genre, page);
  await setInCache(cacheKey, results);

  return c.json(createPaginatedResponse(results, page, results.length >= 20));
}));

app.get('/home', asyncHandler(async (c) => {
  const bustCache = c.req.query('bustCache') === 'true';
  const cacheKey = generateCacheKey(SOURCE_NAME, 'home', {});
  
  if (!bustCache) {
    const cached = await getFromCache<typeof results>(cacheKey);
    if (cached) {
      return c.json(createResponse(cached, true));
    }
  }

  const results = await scraper.getHome();
  await setInCache(cacheKey, results, { ttl: 300 });

  return c.json(createResponse(results));
}));

app.get('/manhwa-update', asyncHandler(async (c) => {
  const page = parseInt(c.req.query('page') || '1');

  const cacheKey = generateCacheKey(SOURCE_NAME, 'manhwa-update', { page });
  const cached = await getFromCache<typeof results>(cacheKey);

  if (cached) {
    return c.json(createPaginatedResponse(cached, page, cached.length >= 20, undefined, true));
  }

  const results = await scraper.getManhwaUpdate(page);
  await setInCache(cacheKey, results);

  return c.json(createPaginatedResponse(results, page, results.length >= 20));
}));

app.get('/manga-list', asyncHandler(async (c) => {
  const page = parseInt(c.req.query('page') || '1');

  const cacheKey = generateCacheKey(SOURCE_NAME, 'manga-list', { page });
  const cached = await getFromCache<typeof results>(cacheKey);

  if (cached) {
    return c.json(createPaginatedResponse(cached, page, cached.length >= 20, undefined, true));
  }

  const results = await scraper.getMangaList(page);
  await setInCache(cacheKey, results);

  return c.json(createPaginatedResponse(results, page, results.length >= 20));
}));

app.get('/webtoon-hot', asyncHandler(async (c) => {
  const page = parseInt(c.req.query('page') || '1');

  const cacheKey = generateCacheKey(SOURCE_NAME, 'webtoon-hot', { page });
  const cached = await getFromCache<typeof results>(cacheKey);

  if (cached) {
    return c.json(createPaginatedResponse(cached, page, cached.length >= 20, undefined, true));
  }

  const results = await scraper.getWebtoonHot(page);
  await setInCache(cacheKey, results);

  return c.json(createPaginatedResponse(results, page, results.length >= 20));
}));

app.get('/tumanhwas-espanol', asyncHandler(async (c) => {
  const page = parseInt(c.req.query('page') || '1');

  const cacheKey = generateCacheKey(SOURCE_NAME, 'tumanhwas-espanol', { page });
  const cached = await getFromCache<typeof results>(cacheKey);

  if (cached) {
    return c.json(createPaginatedResponse(cached, page, cached.length >= 20, undefined, true));
  }

  const results = await scraper.getTumanhwasEspanol(page);
  await setInCache(cacheKey, results);

  return c.json(createPaginatedResponse(results, page, results.length >= 20));
}));

app.get('/china-toptoon', asyncHandler(async (c) => {
  const page = parseInt(c.req.query('page') || '1');

  const cacheKey = generateCacheKey(SOURCE_NAME, 'china-toptoon', { page });
  const cached = await getFromCache<typeof results>(cacheKey);

  if (cached) {
    return c.json(createPaginatedResponse(cached, page, cached.length >= 20, undefined, true));
  }

  const results = await scraper.getChinaToptoon(page);
  await setInCache(cacheKey, results);

  return c.json(createPaginatedResponse(results, page, results.length >= 20));
}));

app.get('/porn-comic', asyncHandler(async (c) => {
  const page = parseInt(c.req.query('page') || '1');

  const cacheKey = generateCacheKey(SOURCE_NAME, 'porn-comic', { page });
  const cached = await getFromCache<typeof results>(cacheKey);

  if (cached) {
    return c.json(createPaginatedResponse(cached, page, cached.length >= 20, undefined, true));
  }

  const results = await scraper.getPornComic(page);
  await setInCache(cacheKey, results);

  return c.json(createPaginatedResponse(results, page, results.length >= 20));
}));

app.get('/manga-for-free', asyncHandler(async (c) => {
  const page = parseInt(c.req.query('page') || '1');

  const cacheKey = generateCacheKey(SOURCE_NAME, 'manga-for-free', { page });
  const cached = await getFromCache<typeof results>(cacheKey);

  if (cached) {
    return c.json(createPaginatedResponse(cached, page, cached.length >= 20, undefined, true));
  }

  const results = await scraper.getMangaForFree(page);
  await setInCache(cacheKey, results);

  return c.json(createPaginatedResponse(results, page, results.length >= 20));
}));

export default app;
