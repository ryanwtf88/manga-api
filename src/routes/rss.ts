import { Hono } from 'hono';
import { MangaReaderScraper } from '../scrapers/mangareader.js';
import { SOURCES } from '../config/constants.js';
import { asyncHandler } from '../utils/errorHandler.js';
import type { MangaSearchResult } from '../types/index.js';

const app = new Hono();

function generateRSS(
  items: MangaSearchResult[],
  title: string,
  description: string,
  link: string
): string {
  const now = new Date().toUTCString();
  
  const itemsXML = items.map(item => {
    const itemLink = `${link}/info/${item.id}`;
    const pubDate = new Date().toUTCString(); // You can use item date if available
    
    return `    <item>
      <title><![CDATA[${item.title}]]></title>
      <link>${itemLink}</link>
      <guid isPermaLink="true">${itemLink}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${item.title}${item.latestChapter ? ` - ${item.latestChapter}` : ''}]]></description>
      ${item.cover ? `<enclosure url="${item.cover}" type="image/jpeg"/>` : ''}
      ${item.genres ? item.genres.map(g => `<category>${g}</category>`).join('\n      ') : ''}
    </item>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${title}</title>
    <link>${link}</link>
    <description>${description}</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${link}/rss" rel="self" type="application/rss+xml"/>
${itemsXML}
  </channel>
</rss>`;
}

// MangaReader RSS feeds
app.get('/mangareader/latest', asyncHandler(async (c) => {
  const scraper = new MangaReaderScraper(SOURCES.mangareader);
  const results = await scraper.getLatestUpdates(1);
  
  const rss = generateRSS(
    results.slice(0, 50), // Limit to 50 items
    'MangaReader - Latest Updates',
    'Latest manga updates from MangaReader',
    SOURCES.mangareader
  );
  
  c.header('Content-Type', 'application/rss+xml; charset=utf-8');
  c.header('Cache-Control', 'public, max-age=600'); // Cache for 10 minutes
  return c.body(rss);
}));

app.get('/mangareader/popular', asyncHandler(async (c) => {
  const scraper = new MangaReaderScraper(SOURCES.mangareader);
  const results = await scraper.getPopular(1);
  
  const rss = generateRSS(
    results.slice(0, 50),
    'MangaReader - Popular Manga',
    'Most popular manga on MangaReader',
    SOURCES.mangareader
  );
  
  c.header('Content-Type', 'application/rss+xml; charset=utf-8');
  c.header('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
  return c.body(rss);
}));

app.get('/mangareader/today', asyncHandler(async (c) => {
  const scraper = new MangaReaderScraper(SOURCES.mangareader);
  const results = await scraper.getPopularToday?.(1) || [];
  
  const rss = generateRSS(
    results.slice(0, 50),
    'MangaReader - Popular Today',
    'Today\'s most popular manga on MangaReader',
    SOURCES.mangareader
  );
  
  c.header('Content-Type', 'application/rss+xml; charset=utf-8');
  c.header('Cache-Control', 'public, max-age=600');
  return c.body(rss);
}));

// Generic RSS endpoint for all sources
app.get('/:source/latest', asyncHandler(async (c) => {
  const source = c.req.param('source');
  const baseUrl = SOURCES[source as keyof typeof SOURCES];
  
  if (!baseUrl) {
    return c.json({ success: false, error: 'Invalid source' }, 400);
  }
  
  // This is a placeholder - you'd need to implement for each source
  const rss = generateRSS(
    [],
    `${source.charAt(0).toUpperCase() + source.slice(1)} - Latest Updates`,
    `Latest updates from ${source}`,
    baseUrl
  );
  
  c.header('Content-Type', 'application/rss+xml; charset=utf-8');
  return c.body(rss);
}));

// RSS index page
app.get('/', (c) => {
  return c.json({
    success: true,
    message: 'RSS Feeds Available',
    feeds: [
      {
        name: 'MangaReader - Latest Updates',
        url: '/rss/mangareader/latest',
        description: 'Latest manga updates',
      },
      {
        name: 'MangaReader - Popular',
        url: '/rss/mangareader/popular',
        description: 'Most popular manga',
      },
      {
        name: 'MangaReader - Popular Today',
        url: '/rss/mangareader/today',
        description: 'Today\'s popular manga',
      },
    ],
    timestamp: new Date().toISOString(),
  });
});

export default app;
