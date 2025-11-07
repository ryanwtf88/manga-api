import axios, { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';
import type {
  MangaInfo,
  MangaSearchResult,
  ChapterPages,
  SearchSuggestion,
  Genre,
  ScraperConfig,
} from '../types/index.js';
import { SCRAPER_CONFIG } from '../config/constants.js';
import { retryWithBackoff, ScraperError } from '../utils/errorHandler.js';
import { requestQueue } from '../utils/rateLimiter.js';

export abstract class BaseScraper {
  protected baseUrl: string;
  protected config: ScraperConfig;
  protected client: AxiosInstance;
  protected sourceName: string;

  constructor(baseUrl: string, sourceName: string, config?: Partial<ScraperConfig>) {
    this.baseUrl = baseUrl;
    this.sourceName = sourceName;
    this.config = { ...SCRAPER_CONFIG, ...config, baseUrl };
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'User-Agent': this.getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0',
      },
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 404) {
          throw new ScraperError('Content not found');
        }
        if (error.response?.status === 503) {
          throw new ScraperError('Service temporarily unavailable');
        }
        if (error.code === 'ECONNABORTED') {
          throw new ScraperError('Request timeout');
        }
        throw error;
      }
    );
  }

  /**
   * Get random user agent from pool
   */
  protected getRandomUserAgent(): string {
    const agents = this.config.userAgents;
    return agents[Math.floor(Math.random() * agents.length)];
  }

  /**
   * Fetch HTML from URL with retry logic
   */
  protected async fetchHtml(url: string): Promise<cheerio.CheerioAPI> {
    return requestQueue.add(async () => {
      return retryWithBackoff(async () => {
        const response = await this.client.get(url, {
          headers: {
            'User-Agent': this.getRandomUserAgent(),
          },
        });

        if (response.status !== 200) {
          throw new ScraperError(`Failed to fetch ${url}: ${response.status}`);
        }

        return cheerio.load(response.data);
      }, this.config.retryAttempts, this.config.retryDelay);
    });
  }

  /**
   * Fetch JSON data from URL
   */
  protected async fetchJson<T>(url: string): Promise<T> {
    return requestQueue.add(async () => {
      return retryWithBackoff(async () => {
        const response = await this.client.get<T>(url, {
          headers: {
            'User-Agent': this.getRandomUserAgent(),
            'Accept': 'application/json',
          },
        });

        if (response.status !== 200) {
          throw new ScraperError(`Failed to fetch ${url}: ${response.status}`);
        }

        return response.data;
      }, this.config.retryAttempts, this.config.retryDelay);
    });
  }

  // Abstract methods to be implemented by each scraper

  abstract search(query: string, page?: number): Promise<MangaSearchResult[]>;

  abstract searchSuggestions?(query: string): Promise<SearchSuggestion[]>;

  abstract getPopularToday?(page?: number): Promise<MangaSearchResult[]>;

  abstract getLatestUpdates(page?: number): Promise<MangaSearchResult[]>;

  abstract getPopular(page?: number): Promise<MangaSearchResult[]>;

  abstract getRecommendations?(page?: number): Promise<MangaSearchResult[]>;

  abstract getInfo(id: string): Promise<MangaInfo>;

  abstract getChapter(id: string): Promise<ChapterPages>;

  abstract getGenres?(): Promise<Genre[]>;

  abstract getGenre?(genre: string, page?: number): Promise<MangaSearchResult[]>;
}
