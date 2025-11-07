import { Hono } from 'hono';
import { MangaReaderScraper } from '../scrapers/mangareader.js';
import { Hentai20Scraper } from '../scrapers/hentai20.js';
import { OmegaScansScraper } from '../scrapers/omegascans.js';
import { SOURCES } from '../config/constants.js';
import { asyncHandler } from '../utils/errorHandler.js';

const app = new Hono();

// Simple GraphQL-like query parser
function parseGraphQLQuery(query: string): any {
  // This is a simplified parser for basic queries
  // In production, use a proper GraphQL library like graphql-js
  
  const queryMatch = query.match(/{\s*(\w+)\s*(\([^)]+\))?\s*{([^}]+)}/);
  if (!queryMatch) {
    throw new Error('Invalid query format');
  }
  
  const [, operation, argsStr, fields] = queryMatch;
  const args: any = {};
  
  if (argsStr) {
    const argMatches = argsStr.matchAll(/(\w+):\s*"([^"]+)"|(\w+):\s*(\d+)/g);
    for (const match of argMatches) {
      const key = match[1] || match[3];
      const value = match[2] || parseInt(match[4]);
      args[key] = value;
    }
  }
  
  return { operation, args, fields: fields.trim().split(/\s+/) };
}

const scrapers = {
  mangareader: new MangaReaderScraper(SOURCES.mangareader),
  hentai20: new Hentai20Scraper(SOURCES.hentai20),
  omegascans: new OmegaScansScraper(SOURCES.omegascans),
};

// GraphQL Schema (documentation)
const schema = `
type Query {
  search(source: String!, query: String!, page: Int): [Manga]
  manga(source: String!, id: String!): MangaInfo
  chapter(source: String!, id: String!): Chapter
  popular(source: String!, page: Int): [Manga]
  latest(source: String!, page: Int): [Manga]
  genres(source: String!): [Genre]
}

type Manga {
  id: String!
  title: String!
  cover: String
  latestChapter: String
  genres: [String]
  rating: Float
}

type MangaInfo {
  id: String!
  title: String!
  altTitles: [String]
  cover: String!
  description: String
  status: String
  rating: Float
  genres: [String]
  authors: [String]
  chapters: [ChapterInfo]
}

type ChapterInfo {
  id: String!
  title: String!
  chapter: Float
  releaseDate: String
}

type Chapter {
  id: String!
  title: String!
  chapter: Float
  pages: [Page]!
}

type Page {
  page: Int!
  imageUrl: String!
}

type Genre {
  id: String!
  name: String!
  slug: String!
}
`;

// GraphQL endpoint
app.post('/', asyncHandler(async (c) => {
  const body = await c.req.json();
  const { query, variables } = body;
  
  if (!query) {
    return c.json({
      errors: [{ message: 'Query is required' }],
    }, 400);
  }
  
  try {
    const parsed = parseGraphQLQuery(query);
    const { operation, args } = parsed;
    
    const source = args.source || variables?.source || 'mangareader';
    const scraper = scrapers[source as keyof typeof scrapers];
    
    if (!scraper) {
      return c.json({
        errors: [{ message: `Invalid source: ${source}` }],
      }, 400);
    }
    
    let data;
    
    switch (operation) {
      case 'search':
        data = await scraper.search(args.query || variables?.query, args.page || 1);
        break;
        
      case 'manga':
        data = await scraper.getInfo(args.id || variables?.id);
        break;
        
      case 'chapter':
        data = await scraper.getChapter(args.id || variables?.id);
        break;
        
      case 'popular':
        data = await scraper.getPopular(args.page || 1);
        break;
        
      case 'latest':
        data = await scraper.getLatestUpdates(args.page || 1);
        break;
        
      case 'genres':
        if (scraper.getGenres) {
          data = await scraper.getGenres();
        } else {
          return c.json({
            errors: [{ message: 'Genres not supported for this source' }],
          }, 400);
        }
        break;
        
      default:
        return c.json({
          errors: [{ message: `Unknown operation: ${operation}` }],
        }, 400);
    }
    
    return c.json({
      data: { [operation]: data },
    });
  } catch (error: any) {
    return c.json({
      errors: [{ message: error.message }],
    }, 500);
  }
}));

// GraphQL GET endpoint (for simple queries)
app.get('/', asyncHandler(async (c) => {
  const query = c.req.query('query');
  
  if (query) {
    // Handle GET request with query parameter
    return app.request('/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
  }
  
  // Return schema documentation
  return c.json({
    success: true,
    message: 'GraphQL API',
    endpoint: '/api/graphql',
    methods: ['POST', 'GET'],
    schema,
    examples: {
      search: `{
  search(source: "mangareader", query: "one piece", page: 1) {
    id
    title
    cover
  }
}`,
      manga: `{
  manga(source: "mangareader", id: "one-piece-3") {
    id
    title
    description
    genres
    chapters {
      id
      title
    }
  }
}`,
    },
  });
}));

export default app;
