import { Hono } from 'hono';
import { MangaReaderScraper } from '../scrapers/mangareader.js';
import { SOURCES } from '../config/constants.js';
import { asyncHandler } from '../utils/errorHandler.js';
import { getFromCache, setInCache, generateCacheKey } from '../utils/cache.js';
import type { ApiResponse } from '../types/index.js';

const app = new Hono();
const scraper = new MangaReaderScraper(SOURCES.mangareader);
const SOURCE_NAME = 'mangareader';

/**
 * Helper function to create standardized API responses
 */
function createResponse<T>(data: T, cached = false): ApiResponse<T> {
  return {
    success: true,
    source: SOURCE_NAME,
    data,
    cached,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Helper function to create paginated API responses
 */
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

// Search manga
app.get('/search', asyncHandler(async (c) => {
  const query = c.req.query('q') || '';
  const page = parseInt(c.req.query('page') || '1');

  if (!query) {
    return c.json({ success: false, error: 'Query parameter "q" is required' }, 400);
  }

  const cacheKey = generateCacheKey(SOURCE_NAME, 'search', { query, page });
  const cached = await getFromCache<typeof results>(cacheKey);

  if (cached) {
    return c.json(createPaginatedResponse(cached, page, cached.length >= 20));
  }

  const results = await scraper.search(query, page);
  await setInCache(cacheKey, results);

  return c.json(createPaginatedResponse(results, page, results.length >= 20));
}));

// Search suggestions
app.get('/search-suggestions', asyncHandler(async (c) => {
  const query = c.req.query('q') || '';

  if (!query) {
    return c.json({ success: false, error: 'Query parameter "q" is required' }, 400);
  }

  const cacheKey = generateCacheKey(SOURCE_NAME, 'search-suggestions', { query });
  const cached = await getFromCache<typeof results>(cacheKey);

  if (cached) {
    return c.json(createResponse(cached, true));
  }

  const results = await scraper.searchSuggestions(query);
  await setInCache(cacheKey, results);

  return c.json(createResponse(results));
}));

// Popular today
app.get('/popular-today', asyncHandler(async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const bustCache = c.req.query('bustCache') === 'true';

  const cacheKey = generateCacheKey(SOURCE_NAME, 'popular-today', { page });
  
  if (!bustCache) {
    const cached = await getFromCache<typeof results>(cacheKey);
    if (cached && cached.length > 0) {
      return c.json(createPaginatedResponse(cached, page, cached.length >= 20, undefined, true));
    }
  }

  const results = await scraper.getPopularToday(page);
  if (results.length > 0) {
    await setInCache(cacheKey, results);
  }

  return c.json(createPaginatedResponse(results, page, results.length >= 20));
}));

// Popular week
app.get('/popular-week', asyncHandler(async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const bustCache = c.req.query('bustCache') === 'true';

  const cacheKey = generateCacheKey(SOURCE_NAME, 'popular-week', { page });
  
  if (!bustCache) {
    const cached = await getFromCache<typeof results>(cacheKey);
    if (cached && cached.length > 0) {
      return c.json(createPaginatedResponse(cached, page, cached.length >= 20, undefined, true));
    }
  }

  const results = await scraper.getPopularWeek(page);
  if (results.length > 0) {
    await setInCache(cacheKey, results);
  }

  return c.json(createPaginatedResponse(results, page, results.length >= 20));
}));

// Popular month
app.get('/popular-month', asyncHandler(async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const bustCache = c.req.query('bustCache') === 'true';

  const cacheKey = generateCacheKey(SOURCE_NAME, 'popular-month', { page });
  
  if (!bustCache) {
    const cached = await getFromCache<typeof results>(cacheKey);
    if (cached && cached.length > 0) {
      return c.json(createPaginatedResponse(cached, page, cached.length >= 20, undefined, true));
    }
  }

  const results = await scraper.getPopularMonth(page);
  if (results.length > 0) {
    await setInCache(cacheKey, results);
  }

  return c.json(createPaginatedResponse(results, page, results.length >= 20));
}));

// Latest updates
app.get('/latest-updates', asyncHandler(async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const bustCache = c.req.query('bustCache') === 'true';

  const cacheKey = generateCacheKey(SOURCE_NAME, 'latest-updates', { page });
  
  if (!bustCache) {
    const cached = await getFromCache<typeof results>(cacheKey);
    if (cached && cached.length > 0) {
      return c.json(createPaginatedResponse(cached, page, cached.length >= 20, undefined, true));
    }
  }

  const results = await scraper.getLatestUpdates(page);
  if (results.length > 0) {
    await setInCache(cacheKey, results);
  }

  return c.json(createPaginatedResponse(results, page, results.length >= 20));
}));

// Popular (all-time / Most Viewed)
app.get('/popular', asyncHandler(async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const bustCache = c.req.query('bustCache') === 'true';

  const cacheKey = generateCacheKey(SOURCE_NAME, 'popular', { page });
  
  if (!bustCache) {
    const cached = await getFromCache<typeof results>(cacheKey);
    if (cached && cached.length > 0) {
      return c.json(createPaginatedResponse(cached, page, cached.length >= 20, undefined, true));
    }
  }

  const results = await scraper.getPopular(page);
  if (results.length > 0) {
    await setInCache(cacheKey, results);
  }

  return c.json(createPaginatedResponse(results, page, results.length >= 20));
}));

// New releases
app.get('/new-release', asyncHandler(async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const bustCache = c.req.query('bustCache') === 'true';

  const cacheKey = generateCacheKey(SOURCE_NAME, 'new-release', { page });
  
  if (!bustCache) {
    const cached = await getFromCache<typeof results>(cacheKey);
    if (cached && cached.length > 0) {
      return c.json(createPaginatedResponse(cached, page, cached.length >= 20, undefined, true));
    }
  }

  const results = await scraper.getNewRelease(page);
  if (results.length > 0) {
    await setInCache(cacheKey, results);
  }

  return c.json(createPaginatedResponse(results, page, results.length >= 20));
}));

// Recommendations
app.get('/recommendations', asyncHandler(async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const bustCache = c.req.query('bustCache') === 'true';

  const cacheKey = generateCacheKey(SOURCE_NAME, 'recommendations', { page });
  
  if (!bustCache) {
    const cached = await getFromCache<typeof results>(cacheKey);
    if (cached && cached.length > 0) {
      return c.json(createPaginatedResponse(cached, page, cached.length >= 20, undefined, true));
    }
  }

  const results = await scraper.getRecommendations(page);
  if (results.length > 0) {
    await setInCache(cacheKey, results);
  }

  return c.json(createPaginatedResponse(results, page, results.length >= 20));
}));

// Trending
app.get('/trending', asyncHandler(async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const bustCache = c.req.query('bustCache') === 'true';

  const cacheKey = generateCacheKey(SOURCE_NAME, 'trending', { page });
  
  if (!bustCache) {
    const cached = await getFromCache<typeof results>(cacheKey);
    if (cached && cached.length > 0) {
      return c.json(createPaginatedResponse(cached, page, cached.length >= 20, undefined, true));
    }
  }

  const results = await scraper.getTrending(page);
  if (results.length > 0) {
    await setInCache(cacheKey, results);
  }

  return c.json(createPaginatedResponse(results, page, results.length >= 20));
}));

// Completed manga
app.get('/completed', asyncHandler(async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const bustCache = c.req.query('bustCache') === 'true';

  const cacheKey = generateCacheKey(SOURCE_NAME, 'completed', { page });
  
  if (!bustCache) {
    const cached = await getFromCache<typeof results>(cacheKey);
    if (cached && cached.length > 0) {
      return c.json(createPaginatedResponse(cached, page, cached.length >= 20, undefined, true));
    }
  }

  const results = await scraper.getCompleted(page);
  if (results.length > 0) {
    await setInCache(cacheKey, results);
  }

  return c.json(createPaginatedResponse(results, page, results.length >= 20));
}));

// Filter by type (manga, manhwa, manhua, one_shot, doujinshi, light_novel, comic)
app.get('/type/:type', asyncHandler(async (c) => {
  const type = c.req.param('type');
  const page = parseInt(c.req.query('page') || '1');

  if (!type) {
    return c.json({ success: false, error: 'Type parameter is required' }, 400);
  }

  const cacheKey = generateCacheKey(SOURCE_NAME, 'type', { type, page });
  const cached = await getFromCache<typeof results>(cacheKey);

  if (cached) {
    return c.json(createPaginatedResponse(cached, page, cached.length >= 20, undefined, true));
  }

  const results = await scraper.getByType(type, page);
  await setInCache(cacheKey, results);

  return c.json(createPaginatedResponse(results, page, results.length >= 20));
}));

// Get manga info
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
  await setInCache(cacheKey, result, { ttl: 3600 }); // Cache for 1 hour

  return c.json(createResponse(result));
}));

// Get chapter pages (supports full path: read/manga-id/lang/chapter-X)
app.get('/chapter/*', asyncHandler(async (c) => {
  const fullPath = c.req.path.replace('/api/v1/mangareader/chapter/', '');
  
  if (!fullPath) {
    return c.json({ success: false, error: 'Chapter path is required' }, 400);
  }

  const cacheKey = generateCacheKey(SOURCE_NAME, 'chapter', { id: fullPath });
  const cached = await getFromCache<typeof result>(cacheKey);

  if (cached && cached.pages?.length > 0) {
    return c.json(createResponse(cached, true));
  }

  const result = await scraper.getChapter(fullPath);
  
  if (result.pages?.length > 0) {
    await setInCache(cacheKey, result, { ttl: 3600 }); // Cache for 1 hour
  }

  return c.json(createResponse(result));
}));

// Get all genres
app.get('/genres', asyncHandler(async (c) => {
  const cacheKey = generateCacheKey(SOURCE_NAME, 'genres', {});
  const cached = await getFromCache<typeof results>(cacheKey);

  if (cached) {
    return c.json(createResponse(cached, true));
  }

  const results = await scraper.getGenres();
  await setInCache(cacheKey, results, { ttl: 86400 }); // Cache for 24 hours

  return c.json(createResponse(results));
}));

// Get manga by genre
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

// Get home page data
app.get('/home', asyncHandler(async (c) => {
  const bustCache = c.req.query('bustCache') === 'true';
  const cacheKey = generateCacheKey(SOURCE_NAME, 'home', {});
  
  if (!bustCache) {
    const cached = await getFromCache<typeof results>(cacheKey);
    // Only return cached if it has actual data
    if (cached && (cached.trending?.length || cached.popularToday?.length || cached.latestUpdates?.length)) {
      return c.json(createResponse(cached, true));
    }
  }

  const results = await scraper.getHome();
  
  // Only cache if we got valid data
  if (results.trending?.length || results.popularToday?.length || results.latestUpdates?.length) {
    await setInCache(cacheKey, results, { ttl: 300 }); // Cache for 5 minutes
  }

  return c.json(createResponse(results));
}));

// Get related manga for a specific manga
app.get('/related/:id', asyncHandler(async (c) => {
  const id = c.req.param('id');

  if (!id) {
    return c.json({ success: false, error: 'ID parameter is required' }, 400);
  }

  const cacheKey = generateCacheKey(SOURCE_NAME, 'related', { id });
  const cached = await getFromCache<typeof results>(cacheKey);

  if (cached) {
    return c.json(createResponse(cached, true));
  }

  const results = await scraper.getRelatedManga(id);
  await setInCache(cacheKey, results, { ttl: 3600 }); // Cache for 1 hour

  return c.json(createResponse(results));
}));

// Get other manga by the same author
app.get('/authors-manga', asyncHandler(async (c) => {
  const author = c.req.query('author') || '';
  const page = parseInt(c.req.query('page') || '1');

  if (!author) {
    return c.json({ success: false, error: 'Query parameter "author" is required' }, 400);
  }

  const cacheKey = generateCacheKey(SOURCE_NAME, 'authors-manga', { author, page });
  const cached = await getFromCache<typeof results>(cacheKey);

  if (cached) {
    return c.json(createPaginatedResponse(cached, page, cached.length >= 20, undefined, true));
  }

  const results = await scraper.getAuthorsManga(author, page);
  await setInCache(cacheKey, results);

  return c.json(createPaginatedResponse(results, page, results.length >= 20));
}));

// Get characters from a manga
app.get('/characters/:id', asyncHandler(async (c) => {
  const id = c.req.param('id');

  if (!id) {
    return c.json({ success: false, error: 'ID parameter is required' }, 400);
  }

  const cacheKey = generateCacheKey(SOURCE_NAME, 'characters', { id });
  const cached = await getFromCache<typeof results>(cacheKey);

  if (cached) {
    return c.json(createResponse(cached, true));
  }

  const results = await scraper.getCharacters(id);
  await setInCache(cacheKey, results, { ttl: 3600 }); // Cache for 1 hour

  return c.json(createResponse(results));
}));

// Get "You May Also Like" recommendations for a manga
app.get('/you-may-also-like/:id', asyncHandler(async (c) => {
  const id = c.req.param('id');

  if (!id) {
    return c.json({ success: false, error: 'ID parameter is required' }, 400);
  }

  const cacheKey = generateCacheKey(SOURCE_NAME, 'you-may-also-like', { id });
  const cached = await getFromCache<typeof results>(cacheKey);

  if (cached) {
    return c.json(createResponse(cached, true));
  }

  const results = await scraper.getYouMayAlsoLike(id);
  await setInCache(cacheKey, results, { ttl: 3600 }); // Cache for 1 hour

  return c.json(createResponse(results));
}));

export default app;
