import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { compress } from 'hono/compress';
import { logger } from 'hono/logger';
import { swaggerUI } from '@hono/swagger-ui';
import { standardRateLimiter } from './utils/rateLimiter.js';
import { errorHandler } from './utils/errorHandler.js';
import { getCacheStats } from './utils/cache.js';
import { SOURCE_INFO, API_VERSION } from './config/constants.js';
import mangareaderRoutes from './routes/mangareader.js';
import hentai20Routes from './routes/hentai20.js';
import omegascansRoutes from './routes/omegascans.js';
import rssRoutes from './routes/rss.js';
import graphqlRoutes from './routes/graphql.js';
import axios from 'axios';
import { readFileSync } from 'fs';
import { join } from 'path';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', compress());
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Apply rate limiting to API routes
app.use('/api/*', standardRateLimiter);

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API status endpoint
app.get('/api/status', (c) => {
  const cacheStats = getCacheStats();
  
  return c.json({
    success: true,
    version: API_VERSION,
    sources: Object.values(SOURCE_INFO),
    cache: cacheStats,
    timestamp: new Date().toISOString(),
  });
});

// Sources metadata endpoint
app.get('/api/sources', (c) => {
  return c.json({
    success: true,
    data: SOURCE_INFO,
    timestamp: new Date().toISOString(),
  });
});

// Image proxy endpoint to bypass CORS
app.get('/api/proxy', async (c) => {
  const imageUrl = c.req.query('url');

  if (!imageUrl) {
    return c.json({ success: false, error: 'URL parameter is required' }, 400);
  }

  try {
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': new URL(imageUrl).origin,
      },
      timeout: 15000,
    });

    const contentType = response.headers['content-type'] || 'image/jpeg';
    
    c.header('Content-Type', contentType);
    c.header('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    c.header('Access-Control-Allow-Origin', '*');

    return c.body(response.data);
  } catch (error) {
    console.error('Proxy error:', error);
    return c.json({ success: false, error: 'Failed to fetch image' }, 500);
  }
});

// Mount routes with versioning
app.route('/api/v1/mangareader', mangareaderRoutes);
app.route('/api/v1/hentai20', hentai20Routes);
app.route('/api/v1/omegascans', omegascansRoutes);

// Additional features
app.route('/api/rss', rssRoutes);
app.route('/api/graphql', graphqlRoutes);

// Serve static documentation
app.get('/api/docs', (c) => {
  try {
    const docsPath = join(process.cwd(), 'public', 'docs', 'index.html');
    const html = readFileSync(docsPath, 'utf-8');
    return c.html(html);
  } catch (error) {
    // Fallback to Swagger UI if static docs not found
    return c.redirect('/api/docs/swagger');
  }
});

// Swagger UI documentation (fallback)
app.get('/api/docs/swagger', swaggerUI({
  url: '/api/openapi.json',
}));

// OpenAPI specification
app.get('/api/openapi.json', (c) => {
  return c.json({
    openapi: '3.0.0',
    info: {
      title: 'Manga Scraper API',
      version: '1.0.0',
      description: 'Comprehensive REST API for scraping manga, manhwa, manhua content from multiple sources',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: '/api/v1',
        description: 'API v1',
      },
    ],
    tags: [
      {
        name: 'MangaReader',
        description: 'MangaReader.to endpoints',
      },
      {
        name: 'System',
        description: 'System and utility endpoints',
      },
    ],
    paths: {
      '/health': {
        get: {
          tags: ['System'],
          summary: 'Health check',
          responses: {
            '200': {
              description: 'API is healthy',
            },
          },
        },
      },
      '/mangareader/search': {
        get: {
          tags: ['MangaReader'],
          summary: 'Search manga',
          parameters: [
            {
              name: 'q',
              in: 'query',
              required: true,
              schema: { type: 'string' },
              description: 'Search query',
            },
            {
              name: 'page',
              in: 'query',
              schema: { type: 'integer', default: 1 },
              description: 'Page number',
            },
          ],
          responses: {
            '200': {
              description: 'Search results',
            },
          },
        },
      },
      '/mangareader/search-suggestions': {
        get: {
          tags: ['MangaReader'],
          summary: 'Get search suggestions',
          parameters: [
            {
              name: 'q',
              in: 'query',
              required: true,
              schema: { type: 'string' },
              description: 'Search query',
            },
          ],
          responses: {
            '200': {
              description: 'Search suggestions',
            },
          },
        },
      },
      '/mangareader/popular-today': {
        get: {
          tags: ['MangaReader'],
          summary: 'Get popular manga today',
          parameters: [
            {
              name: 'page',
              in: 'query',
              schema: { type: 'integer', default: 1 },
            },
          ],
          responses: {
            '200': {
              description: 'Popular manga list',
            },
          },
        },
      },
      '/mangareader/latest-updates': {
        get: {
          tags: ['MangaReader'],
          summary: 'Get latest updates',
          parameters: [
            {
              name: 'page',
              in: 'query',
              schema: { type: 'integer', default: 1 },
            },
          ],
          responses: {
            '200': {
              description: 'Latest updates list',
            },
          },
        },
      },
      '/mangareader/popular': {
        get: {
          tags: ['MangaReader'],
          summary: 'Get all-time popular manga',
          parameters: [
            {
              name: 'page',
              in: 'query',
              schema: { type: 'integer', default: 1 },
            },
          ],
          responses: {
            '200': {
              description: 'Popular manga list',
            },
          },
        },
      },
      '/mangareader/recommendations': {
        get: {
          tags: ['MangaReader'],
          summary: 'Get recommended manga',
          parameters: [
            {
              name: 'page',
              in: 'query',
              schema: { type: 'integer', default: 1 },
            },
          ],
          responses: {
            '200': {
              description: 'Recommended manga list',
            },
          },
        },
      },
      '/mangareader/info/{id}': {
        get: {
          tags: ['MangaReader'],
          summary: 'Get manga details',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'Manga ID',
            },
          ],
          responses: {
            '200': {
              description: 'Manga details',
            },
          },
        },
      },
      '/mangareader/chapter/{id}': {
        get: {
          tags: ['MangaReader'],
          summary: 'Get chapter pages',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'Chapter ID',
            },
          ],
          responses: {
            '200': {
              description: 'Chapter pages',
            },
          },
        },
      },
      '/mangareader/genres': {
        get: {
          tags: ['MangaReader'],
          summary: 'Get all genres',
          responses: {
            '200': {
              description: 'Genres list',
            },
          },
        },
      },
      '/mangareader/genre/{genre}': {
        get: {
          tags: ['MangaReader'],
          summary: 'Get manga by genre',
          parameters: [
            {
              name: 'genre',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'Genre name',
            },
            {
              name: 'page',
              in: 'query',
              schema: { type: 'integer', default: 1 },
            },
          ],
          responses: {
            '200': {
              description: 'Manga list',
            },
          },
        },
      },
    },
  });
});

// 404 handler
app.notFound((c) => {
  return c.json({
    success: false,
    error: 'Not Found',
    message: 'The requested endpoint does not exist',
    statusCode: 404,
    timestamp: new Date().toISOString(),
  }, 404);
});

// Error handler
app.onError(errorHandler);

// Start server (for local development)
if (process.env.NODE_ENV !== 'production') {
  const port = parseInt(process.env.PORT || '3000');
  console.log(`🚀 Server starting on http://localhost:${port}`);
  serve({
    fetch: app.fetch,
    port,
  });
}

// Export for Vercel
export default app;
