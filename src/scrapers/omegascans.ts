import { BaseScraper } from './base.js';
import type {
  MangaInfo,
  MangaSearchResult,
  ChapterPages,
  ChapterInfo,
  HomeData,
} from '../types/index.js';
import {
  cleanText,
  parseStatus,
  parseType,
} from '../utils/parser.js';
import { ScraperError } from '../utils/errorHandler.js';

export class OmegaScansScraper extends BaseScraper {
  private apiBaseUrl = 'https://api.omegascans.org';
  
  constructor(baseUrl: string) {
    super(baseUrl, 'omegascans');
  }

  /**
   * Fetch JSON data from the API
   */
  private async fetchApi(endpoint: string): Promise<any> {
    try {
      const response = await this.client.get(`${this.apiBaseUrl}${endpoint}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
        },
      });
      return response.data;
    } catch (error: any) {
      throw new ScraperError(`API request failed: ${error.message}`);
    }
  }

  /**
   * Parse API series data to MangaSearchResult
   */
  private parseApiSeries(item: any): MangaSearchResult {
    const result: any = {
      id: item.series_slug || String(item.id),
      title: cleanText(item.title),
      cover: item.thumbnail || `${this.baseUrl}/icon.png`,
      latestChapter: item.free_chapters?.[0]?.chapter_name || undefined,
      type: item.series_type ? parseType(item.series_type) : undefined,
      rating: item.rating || undefined,
    };
    
    // Add status if available (not in MangaSearchResult type but useful)
    if (item.status) {
      result.status = parseStatus(item.status);
    }
    
    return result;
  }

  async search(query: string, page = 1): Promise<MangaSearchResult[]> {
    try {
      const data = await this.fetchApi(`/query?search=${encodeURIComponent(query)}&page=${page}`);
      
      if (data?.data && Array.isArray(data.data)) {
        return data.data.map((item: any) => this.parseApiSeries(item)).filter((r: MangaSearchResult) => r.id && r.title);
      }
      
      return [];
    } catch (error) {
      throw new ScraperError(`Failed to search: ${(error as Error).message}`);
    }
  }

  async getLatestUpdates(page = 1): Promise<MangaSearchResult[]> {
    try {
      const data = await this.fetchApi(`/query?page=${page}`);
      
      if (data?.data && Array.isArray(data.data)) {
        return data.data.slice(0, 20).map((item: any) => this.parseApiSeries(item)).filter((r: MangaSearchResult) => r.id && r.title);
      }
      
      return [];
    } catch (error) {
      throw new ScraperError(`Failed to get latest updates: ${(error as Error).message}`);
    }
  }

  async getLatestComicUpdates(page = 1): Promise<MangaSearchResult[]> {
    try {
      const data = await this.fetchApi(`/query?type=Comic&page=${page}`);
      
      if (data?.data && Array.isArray(data.data)) {
        return data.data
          .filter((item: any) => item.series_type === 'Comic')
          .slice(0, 20)
          .map((item: any) => this.parseApiSeries(item))
          .filter((r: MangaSearchResult) => r.id && r.title);
      }
      
      return [];
    } catch (error) {
      throw new ScraperError(`Failed to get latest comic updates: ${(error as Error).message}`);
    }
  }

  async getLatestNovelUpdates(page = 1): Promise<MangaSearchResult[]> {
    try {
      const data = await this.fetchApi(`/query?type=Novel&page=${page}`);
      
      if (data?.data && Array.isArray(data.data)) {
        return data.data
          .filter((item: any) => item.series_type === 'Novel')
          .slice(0, 20)
          .map((item: any) => this.parseApiSeries(item))
          .filter((r: MangaSearchResult) => r.id && r.title);
      }
      
      return [];
    } catch (error) {
      throw new ScraperError(`Failed to get latest novel updates: ${(error as Error).message}`);
    }
  }

  async getPopular(page = 1): Promise<MangaSearchResult[]> {
    try {
      const data = await this.fetchApi(`/query?sort=total_views&page=${page}`);
      
      if (data?.data && Array.isArray(data.data)) {
        return data.data.slice(0, 20).map((item: any) => ({
          ...this.parseApiSeries(item),
          views: item.total_views ? String(item.total_views) : undefined,
        })).filter((r: any) => r.id && r.title);
      }
      
      return [];
    } catch (error) {
      throw new ScraperError(`Failed to get popular: ${(error as Error).message}`);
    }
  }

  async getComic(page = 1): Promise<MangaSearchResult[]> {
    return this.getLatestComicUpdates(page);
  }

  async getNovel(page = 1): Promise<MangaSearchResult[]> {
    return this.getLatestNovelUpdates(page);
  }

  async getHome(): Promise<HomeData> {
    try {
      const data = await this.fetchApi('/query?page=1');
      
      if (data?.data && Array.isArray(data.data)) {
        const items = data.data.slice(0, 30).map((item: any) => this.parseApiSeries(item)).filter((r: MangaSearchResult) => r.id && r.title);
        
        return {
          trending: items.slice(0, 10).length > 0 ? items.slice(0, 10) : undefined,
          latestUpdates: items.slice(0, 20).length > 0 ? items.slice(0, 20) : undefined,
        };
      }
      
      return {};
    } catch (error) {
      throw new ScraperError(`Failed to get home data: ${(error as Error).message}`);
    }
  }

  async getInfo(id: string): Promise<MangaInfo> {
    try {
      // Use query endpoint with search to get full data including chapters
      const data = await this.fetchApi(`/query?search=${encodeURIComponent(id)}`);
      
      if (!data?.data || !Array.isArray(data.data) || data.data.length === 0) {
        throw new ScraperError('Series not found');
      }

      // Get the first matching series (should be exact match)
      const seriesData = data.data[0];
      
      const title = cleanText(seriesData.title);
      const cover = seriesData.thumbnail || `${this.baseUrl}/icon.png`;
      const description = seriesData.description ? cleanText(seriesData.description.replace(/<[^>]*>/g, '')) : '';
      const status = seriesData.status ? parseStatus(seriesData.status) : parseStatus('Ongoing');
      const type = seriesData.series_type ? parseType(seriesData.series_type) : parseType('Comic');
      const author = seriesData.author || '';
      const rating = seriesData.rating || undefined;
      const genres = (seriesData.tags || []).map((tag: any) => tag.name);

      // Parse chapters from free_chapters and paid_chapters
      const chapters: ChapterInfo[] = [];
      const seriesSlug = seriesData.series_slug || id;
      
      // Add free chapters
      if (seriesData.free_chapters && Array.isArray(seriesData.free_chapters)) {
        seriesData.free_chapters.forEach((chapter: any) => {
          const chapterNum = chapter.index ? String(chapter.index) : '0';
          chapters.push({
            id: `series/${seriesSlug}/${chapter.chapter_slug}`,
            title: chapter.chapter_name || `Chapter ${chapter.index}`,
            chapter: chapterNum,
            releaseDate: chapter.created_at || undefined,
          });
        });
      }
      
      // Add paid chapters
      if (seriesData.paid_chapters && Array.isArray(seriesData.paid_chapters)) {
        seriesData.paid_chapters.forEach((chapter: any) => {
          const chapterNum = chapter.index ? String(chapter.index) : '0';
          chapters.push({
            id: `series/${seriesSlug}/${chapter.chapter_slug}`,
            title: `${chapter.chapter_name || `Chapter ${chapter.index}`} [PAID]`,
            chapter: chapterNum,
            releaseDate: chapter.created_at || undefined,
          });
        });
      }
      
      // Sort chapters by index (descending - latest first)
      chapters.sort((a, b) => {
        const aNum = parseFloat(a.chapter || '0');
        const bNum = parseFloat(b.chapter || '0');
        return bNum - aNum;
      });

      return {
        id: seriesSlug,
        title,
        cover,
        description,
        status,
        rating,
        genres,
        authors: author ? [author] : undefined,
        type,
        chapters,
      };
    } catch (error) {
      throw new ScraperError(`Failed to get info: ${(error as Error).message}`);
    }
  }

  async getChapter(id: string): Promise<ChapterPages> {
    try {
      const response = await this.client.get(`${this.baseUrl}/${id}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });
      
      const html = response.data;
      
      // Extract image URLs from HTML (they're embedded in Next.js data)
      const imageRegex = /https:\/\/media\.omegascans\.org\/file\/[^"'\s]+\/uploads\/series\/[^"'\s]+\.(jpg|png|webp)/g;
      const imageMatches = html.match(imageRegex) || [];
      
      // Remove duplicates and sort
      const uniqueImages: string[] = [...new Set<string>(imageMatches)];
      
      if (uniqueImages.length === 0) {
        throw new ScraperError('No chapter images found');
      }
      
      const pages: { page: number; imageUrl: string }[] = uniqueImages.map((url, index) => ({
        page: index + 1,
        imageUrl: url,
      }));
      
      // Extract chapter info from HTML
      const chapterNameMatch = html.match(/\\"chapter_name\\":\\"([^"\\]+)\\"/);
      const title = chapterNameMatch ? chapterNameMatch[1].replace(/\\\\/g, '') : 'Chapter';
      
      const indexMatch = html.match(/\\"index\\":\\"([\d.]+)\\"/);
      const chapterNumber = indexMatch ? `Chapter ${indexMatch[1]}` : title;
      
      // Extract next/previous chapter info
      const seriesMatch = id.match(/series\/([^\/]+)\//);
      const seriesSlug = seriesMatch ? seriesMatch[1] : '';
      
      const nextMatch = html.match(/\\"next_chapter\\":\\{[^}]*\\"chapter_slug\\":\\"([^"\\]+)\\"/);
      const prevMatch = html.match(/\\"previous_chapter\\":\\{[^}]*\\"chapter_slug\\":\\"([^"\\]+)\\"/);
      
      return {
        id,
        title,
        chapter: chapterNumber,
        pages,
        nextChapter: nextMatch && seriesSlug ? `series/${seriesSlug}/${nextMatch[1]}` : undefined,
        previousChapter: prevMatch && seriesSlug ? `series/${seriesSlug}/${prevMatch[1]}` : undefined,
      };
    } catch (error) {
      throw new ScraperError(`Failed to get chapter: ${(error as Error).message}`);
    }
  }

  // Not implemented methods
  searchSuggestions = undefined;
  getPopularToday = undefined;
  getRecommendations = undefined;
  getGenres = undefined;
  getGenre = undefined;
}
