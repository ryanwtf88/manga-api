import { Hono } from 'hono';
import { OmegaScansScraper } from '../scrapers/omegascans.js';
import { SOURCES } from '../config/constants.js';
import { asyncHandler } from '../utils/errorHandler.js';
import { getFromCache, setInCache, generateCacheKey } from '../utils/cache.js';
import type { ApiResponse } from '../types/index.js';

const app = new Hono();
const scraper = new OmegaScansScraper(SOURCES.omegascans);
const SOURCE_NAME = 'omegascans';

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

app.get('/latest-comic-updates', asyncHandler(async (c) => {
  const page = parseInt(c.req.query('page') || '1');

  const cacheKey = generateCacheKey(SOURCE_NAME, 'latest-comic-updates', { page });
  const cached = await getFromCache<typeof results>(cacheKey);

  if (cached) {
    return c.json(createPaginatedResponse(cached, page, cached.length >= 20, undefined, true));
  }

  const results = await scraper.getLatestComicUpdates(page);
  await setInCache(cacheKey, results);

  return c.json(createPaginatedResponse(results, page, results.length >= 20));
}));

app.get('/latest-novel-updates', asyncHandler(async (c) => {
  const page = parseInt(c.req.query('page') || '1');

  const cacheKey = generateCacheKey(SOURCE_NAME, 'latest-novel-updates', { page });
  const cached = await getFromCache<typeof results>(cacheKey);

  if (cached) {
    return c.json(createPaginatedResponse(cached, page, cached.length >= 20, undefined, true));
  }

  const results = await scraper.getLatestNovelUpdates(page);
  await setInCache(cacheKey, results);

  return c.json(createPaginatedResponse(results, page, results.length >= 20));
}));

app.get('/comic', asyncHandler(async (c) => {
  const page = parseInt(c.req.query('page') || '1');

  const cacheKey = generateCacheKey(SOURCE_NAME, 'comic', { page });
  const cached = await getFromCache<typeof results>(cacheKey);

  if (cached) {
    return c.json(createPaginatedResponse(cached, page, cached.length >= 20, undefined, true));
  }

  const results = await scraper.getComic(page);
  await setInCache(cacheKey, results);

  return c.json(createPaginatedResponse(results, page, results.length >= 20));
}));

app.get('/novel', asyncHandler(async (c) => {
  const page = parseInt(c.req.query('page') || '1');

  const cacheKey = generateCacheKey(SOURCE_NAME, 'novel', { page });
  const cached = await getFromCache<typeof results>(cacheKey);

  if (cached) {
    return c.json(createPaginatedResponse(cached, page, cached.length >= 20, undefined, true));
  }

  const results = await scraper.getNovel(page);
  await setInCache(cacheKey, results);

  return c.json(createPaginatedResponse(results, page, results.length >= 20));
}));

app.get('/home', asyncHandler(async (c) => {
  const bustCache = c.req.query('bustCache') === 'true';
  const cacheKey = generateCacheKey(SOURCE_NAME, 'home', {});
  
  if (!bustCache) {
    const cached = await getFromCache<typeof results>(cacheKey);
    if (cached && (cached.trending?.length || cached.latestUpdates?.length)) {
      return c.json(createResponse(cached, true));
    }
  }

  const results = await scraper.getHome();
  
  // Only cache if we have actual data
  if (results.trending?.length || results.latestUpdates?.length) {
    await setInCache(cacheKey, results, { ttl: 300 });
  }

  return c.json(createResponse(results));
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

// Use wildcard route to capture full chapter paths like "series/moby-dick/chapter-25"
app.get('/chapter/*', asyncHandler(async (c) => {
  const fullPath = c.req.path.replace('/api/v1/omegascans/chapter/', '');

  if (!fullPath) {
    return c.json({ success: false, error: 'Chapter ID parameter is required' }, 400);
  }

  const cacheKey = generateCacheKey(SOURCE_NAME, 'chapter', { id: fullPath });
  const cached = await getFromCache<typeof result>(cacheKey);

  if (cached) {
    return c.json(createResponse(cached, true));
  }

  const result = await scraper.getChapter(fullPath);
  await setInCache(cacheKey, result, { ttl: 3600 });

  return c.json(createResponse(result));
}));

export default app;
