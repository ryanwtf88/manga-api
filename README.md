# manga-api

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)
![Status](https://img.shields.io/badge/status-active-success.svg)

A high-performance REST API for scraping manga, manhwa, and manhua content from multiple sources. Built with TypeScript, Hono framework, and designed for serverless deployment.

## Table of Contents

- [Features](#features)
- [Supported Sources](#supported-sources)
- [Quick Start](#quick-start)
- [API Documentation](#api-documentation)
- [Response Formats](#response-formats)
- [Deployment](#deployment)
- [Configuration](#configuration)
- [Architecture](#architecture)
- [Legal Notice](#legal-notice)

## Features

- **Multi-Source Support** - Aggregate content from multiple manga sources
- **Smart Caching** - Multi-layer caching with Redis and in-memory storage
- **Rate Limiting** - Built-in protection against abuse
- **GraphQL API** - Query manga data with GraphQL
- **REST API** - Comprehensive RESTful endpoints
- **RSS Feeds** - Subscribe to latest updates
- **Image Proxy** - Bypass CORS restrictions
- **Type Safe** - Full TypeScript support
- **Auto-Retry** - Exponential backoff for failed requests
- **Swagger Docs** - Interactive API documentation

## Supported Sources

| Source | Base URL | Status | Features |
|--------|----------|--------|----------|
| **MangaReader** | mangareader.to | ![Active](https://img.shields.io/badge/status-active-success) | Search, Popular, Trending, Genres, Filters |
| **Hentai20** | hentai20.io | ![Active](https://img.shields.io/badge/status-active-success) | Search, Popular, Categories |
| **OmegaScans** | omegascans.org | ![Active](https://img.shields.io/badge/status-active-success) | Search, Latest Updates, Comics/Novels |

## Quick Start

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- (Optional) Upstash Redis account for distributed caching

### Installation

```bash
# Clone the repository
git clone https://github.com/ryanwtf88/manga-api.git
cd manga-api

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

The API will be available at `http://localhost:3000`

### Docker Support

```bash
# Build image
docker build -t manga-api .

# Run container
docker run -p 3000:3000 manga-api
```

## API Documentation

### Base URL

```
Local:      http://localhost:3000/api/v1
Production: https://your-domain.vercel.app/api/v1
```

### Authentication

API key authentication is available. Contact the administrator for access.

### System Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check status |
| `GET` | `/api/status` | API statistics and cache info |
| `GET` | `/api/sources` | List all available sources |
| `GET` | `/api/proxy?url={url}` | Proxy images to bypass CORS |
| `GET` | `/api/docs` | Interactive Swagger documentation |
| `POST` | `/api/graphql` | GraphQL endpoint |
| `GET` | `/api/rss/{source}/latest` | RSS feed for latest updates |

### MangaReader Endpoints

All endpoints are prefixed with `/api/v1/mangareader`

#### Search & Discovery

| Method | Endpoint | Query Parameters | Description |
|--------|----------|------------------|-------------|
| `GET` | `/search` | `q` (required), `page` | Search manga by title |
| `GET` | `/search-suggestions` | `q` (required) | Get autocomplete suggestions |
| `GET` | `/home` | - | Get homepage sections |
| `GET` | `/popular` | `page` | All-time popular manga |
| `GET` | `/popular-today` | `page` | Today's popular manga |
| `GET` | `/popular-week` | `page` | This week's popular manga |
| `GET` | `/popular-month` | `page` | This month's popular manga |
| `GET` | `/latest-updates` | `page` | Recently updated manga |
| `GET` | `/new-release` | `page` | Newly released manga |
| `GET` | `/trending` | `page` | Trending manga |
| `GET` | `/completed` | `page` | Completed manga series |
| `GET` | `/recommendations` | `page` | Recommended manga |

#### Content Details

| Method | Endpoint | Path Parameters | Description |
|--------|----------|-----------------|-------------|
| `GET` | `/info/:id` | `id` - Manga ID | Get manga details and chapters |
| `GET` | `/chapter/*` | Full chapter path | Get chapter pages |

Example:
```bash
# Get manga info
GET /api/v1/mangareader/info/one-piece-3

# Get chapter pages
GET /api/v1/mangareader/chapter/read/one-piece-3/en/chapter-1
```

#### Genres & Filters

| Method | Endpoint | Query Parameters | Description |
|--------|----------|------------------|-------------|
| `GET` | `/genres` | - | List all available genres |
| `GET` | `/genre/:genre` | `page` | Filter manga by genre |
| `GET` | `/type/:type` | `page` | Filter by type (manga, manhwa, etc.) |
| `GET` | `/status/:status` | `page` | Filter by status |

Supported types: `manga`, `manhwa`, `manhua`, `one_shot`, `doujinshi`, `light_novel`, `comic`

Supported statuses: `ongoing`, `completed`, `hiatus`, `cancelled`

#### Related Content

| Method | Endpoint | Path/Query Parameters | Description |
|--------|----------|----------------------|-------------|
| `GET` | `/related/:id` | `id` - Manga ID | Get related manga |
| `GET` | `/authors-manga` | `author` (required), `page` | Manga by specific author |
| `GET` | `/characters/:id` | `id` - Manga ID | Get manga characters |
| `GET` | `/you-may-also-like/:id` | `id` - Manga ID | Get recommendations |

### Hentai20 Endpoints

All endpoints are prefixed with `/api/v1/hentai20`

| Method | Endpoint | Query Parameters | Description |
|--------|----------|------------------|-------------|
| `GET` | `/search` | `q` (required), `page` | Search manga |
| `GET` | `/home` | - | Homepage sections |
| `GET` | `/latest-updates` | `page` | Latest updates |
| `GET` | `/popular` | `page` | Popular manga |
| `GET` | `/manhwa-update` | `page` | Latest manhwa updates |
| `GET` | `/manga-list` | `page` | Complete manga list |
| `GET` | `/webtoon-hot` | `page` | Hot webtoons |
| `GET` | `/genres` | - | List genres |
| `GET` | `/genre/:genre` | `page` | Filter by genre |
| `GET` | `/info/:id` | `id` - Manga ID | Get manga details |
| `GET` | `/chapter/:id` | `id` - Chapter ID | Get chapter pages |

### OmegaScans Endpoints

All endpoints are prefixed with `/api/v1/omegascans`

| Method | Endpoint | Query Parameters | Description |
|--------|----------|------------------|-------------|
| `GET` | `/search` | `q` (required), `page` | Search content |
| `GET` | `/home` | - | Homepage sections |
| `GET` | `/latest-updates` | `page` | Latest updates |
| `GET` | `/latest-comic-updates` | `page` | Latest comic updates |
| `GET` | `/latest-novel-updates` | `page` | Latest novel updates |
| `GET` | `/comic` | `page` | Comic listings |
| `GET` | `/novel` | `page` | Novel listings |
| `GET` | `/popular` | `page` | Popular content |
| `GET` | `/info/:id` | `id` - Content ID | Get details |
| `GET` | `/chapter/:id` | `id` - Chapter ID | Get chapter pages |

### Cache Busting

Add `?bustCache=true` to any endpoint to bypass cache and fetch fresh data:

```bash
GET /api/v1/mangareader/trending?bustCache=true
```

## Response Formats

### Success Response (List)

```json
{
  "success": true,
  "source": "mangareader",
  "data": [
    {
      "id": "one-piece-3",
      "title": "One Piece",
      "cover": "https://example.com/cover.jpg",
      "latestChapter": "Chapter 1100",
      "genres": ["Action", "Adventure", "Comedy"],
      "rating": 9.5,
      "views": "1.2M",
      "status": "Ongoing"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "hasNextPage": true,
    "totalPages": 100
  },
  "cached": false,
  "timestamp": "2025-11-06T12:00:00.000Z"
}
```

### Success Response (Single Item)

```json
{
  "success": true,
  "source": "mangareader",
  "data": {
    "id": "one-piece-3",
    "title": "One Piece",
    "alternativeTitles": ["ワンピース"],
    "description": "Manga description here...",
    "cover": "https://example.com/cover.jpg",
    "banner": "https://example.com/banner.jpg",
    "genres": ["Action", "Adventure"],
    "authors": ["Oda Eiichiro"],
    "artists": ["Oda Eiichiro"],
    "status": "Ongoing",
    "type": "Manga",
    "releaseYear": 1997,
    "rating": 9.5,
    "views": "1.2M",
    "chapters": [
      {
        "id": "one-piece-3-chapter-1100",
        "title": "Chapter 1100",
        "number": 1100,
        "date": "2024-11-06",
        "views": "100K"
      }
    ],
    "relatedManga": [],
    "recommendations": []
  },
  "cached": true,
  "timestamp": "2025-11-06T12:00:00.000Z"
}
```

### Success Response (Chapter)

```json
{
  "success": true,
  "source": "mangareader",
  "data": {
    "id": "read/one-piece-3/en/chapter-1",
    "title": "One Piece",
    "chapter": "Chapter 1",
    "pages": [
      {
        "page": 1,
        "imageUrl": "https://cdn.example.com/page1.jpg"
      },
      {
        "page": 2,
        "imageUrl": "https://cdn.example.com/page2.jpg"
      }
    ],
    "nextChapter": "read/one-piece-3/en/chapter-2",
    "previousChapter": null
  },
  "cached": false,
  "timestamp": "2025-11-06T12:00:00.000Z"
}
```

### Error Response

```json
{
  "success": false,
  "error": "NotFoundError",
  "message": "The requested manga could not be found",
  "statusCode": 404,
  "timestamp": "2025-11-06T12:00:00.000Z"
}
```

### Status Codes

| Code | Description |
|------|-------------|
| `200` | Success |
| `400` | Bad Request - Invalid parameters |
| `401` | Unauthorized - Invalid API key |
| `404` | Not Found - Resource doesn't exist |
| `429` | Too Many Requests - Rate limit exceeded |
| `500` | Internal Server Error |
| `503` | Service Unavailable - Source is down |

## Deployment

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ryanwtf88/manga-api)

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### Environment Variables

Set these in your Vercel dashboard or `.env` file:

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Environment (production/development) | No |
| `PORT` | Server port | No |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL | Recommended |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST Token | Recommended |
| `API_KEY` | Optional API authentication key | No |

### Production Build

```bash
# Build TypeScript
npm run build

# Start production server
npm start
```


## Configuration

### Caching Strategy

The API uses a multi-layer caching approach:

1. **In-Memory Cache** (Node-Cache)
   - TTL: 5-10 minutes
   - Fast access for frequently requested data
   - No external dependencies

2. **Distributed Cache** (Upstash Redis)
   - TTL: 1 hour
   - Shared across serverless instances
   - Survives deployments

### Rate Limiting

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Standard | 100 requests | 15 minutes |
| Expensive | 30 requests | 5 minutes |

Rate limits are applied per IP address.

### Request Timeout

- Default: 15 seconds
- Configurable via `SCRAPER_CONFIG.timeout`

## Architecture

### Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Hono (Ultra-fast web framework)
- **Language**: TypeScript 5.0+
- **HTML Parser**: Cheerio
- **HTTP Client**: Axios
- **Caching**: Node-Cache + Upstash Redis
- **Deployment**: Vercel Serverless



### Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## API Examples

### Using cURL

```bash
# Search for manga
curl "https://api.example.com/api/v1/mangareader/search?q=naruto&page=1"

# Get manga details
curl "https://api.example.com/api/v1/mangareader/info/naruto-1"

# Get trending manga
curl "https://api.example.com/api/v1/mangareader/trending?page=1"

# Get chapter with cache busting
curl "https://api.example.com/api/v1/mangareader/chapter/read/naruto-1/en/chapter-1?bustCache=true"
```

### Using Fetch API

```javascript
const response = await fetch('https://api.example.com/api/v1/mangareader/search?q=one+piece');
const data = await response.json();

console.log(data.data); // Array of manga results
```

### Using Axios

```javascript
import axios from 'axios';

const { data } = await axios.get('https://api.example.com/api/v1/mangareader/popular');
console.log(data.data); // Array of popular manga
```

### GraphQL Query

```graphql
query {
  search(source: "mangareader", query: "one piece", page: 1) {
    id
    title
    cover
    latestChapter
    genres
    rating
  }
  
  info(source: "mangareader", id: "one-piece-3") {
    title
    description
    authors
    status
    chapters {
      id
      title
      number
    }
  }
}
```

## Monitoring

### Health Check

```bash
curl https://api.example.com/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2025-11-06T12:00:00.000Z",
  "uptime": 3600
}
```

### API Status

```bash
curl https://api.example.com/api/status
```

Response:
```json
{
  "success": true,
  "version": "1.0.0",
  "uptime": 3600,
  "sources": {
    "mangareader": "operational",
    "hentai20": "operational",
    "omegascans": "operational"
  },
  "cache": {
    "inMemory": {
      "keys": 150,
      "hits": 1200,
      "misses": 300
    },
    "redis": {
      "connected": true
    }
  }
}
```

## Troubleshooting

### Common Issues

**Problem**: API returns 503 errors
- **Solution**: Source website may be down or blocking requests. Try again later or use a different source.

**Problem**: Rate limit errors (429)
- **Solution**: Reduce request frequency or implement request queuing in your application.

**Problem**: Empty data arrays
- **Solution**: Add `?bustCache=true` to bypass stale cache, or the source may have changed their HTML structure.

**Problem**: CORS errors in browser
- **Solution**: Use the `/api/proxy` endpoint to proxy images.

## Legal Notice

**IMPORTANT DISCLAIMER**

This API is provided for **educational and personal use only**. Web scraping may violate the Terms of Service of target websites.

### User Responsibilities

- You are responsible for complying with all applicable laws and terms of service
- Web scraping may be illegal in some jurisdictions
- This software should NOT be used for commercial purposes
- Respect rate limits and do not overload source servers
- Content belongs to the respective copyright holders

### Recommendations

- Use responsibly and ethically
- Implement proper rate limiting in your applications
- Consider legal implications in your jurisdiction
- Do not redistribute copyrighted content commercially
- Respect robots.txt and website policies
- Consider supporting official manga platforms

### Liability

The authors and contributors of this project are not responsible for any misuse of this software or any legal consequences resulting from its use.

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/ryanwtf88/manga-api/issues)
- **Documentation**: [API Docs](https://multi-manga-api.vercel.app/api/docs)
- **Discussions**: [GitHub Discussions](https://github.com/ryanwtf88/manga-api/discussions)

## Acknowledgments

- [Hono](https://hono.dev/) - Web framework
- [Cheerio](https://cheerio.js.org/) - HTML parsing
- [Upstash](https://upstash.com/) - Redis hosting
- [Vercel](https://vercel.com/) - Serverless deployment

---

**Note**: This project is not affiliated with or endorsed by any of the manga sources it supports.
