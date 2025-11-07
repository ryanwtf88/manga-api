import { BaseScraper } from './base.js';
import type { CheerioAPI } from 'cheerio';
import type {
  MangaInfo,
  MangaSearchResult,
  ChapterPages,
  Genre,
  ChapterInfo,
  HomeData,
} from '../types/index.js';
import {
  cleanText,
  extractIdFromUrl,
  parseStatus,
  parseType,
  parseChapterNumber,
  resolveUrl,
  parseDate,
  generateSlug,
} from '../utils/parser.js';
import { ScraperError } from '../utils/errorHandler.js';

export class Hentai20Scraper extends BaseScraper {
  constructor(baseUrl: string) {
    super(baseUrl, 'hentai20');
  }

  async search(query: string, page = 1): Promise<MangaSearchResult[]> {
    try {
      const $ = await this.fetchHtml(`/?s=${encodeURIComponent(query)}&page=${page}`);
      return this.parseSearchResults($);
    } catch (error) {
      throw new ScraperError(`Failed to search: ${(error as Error).message}`);
    }
  }

  async getLatestUpdates(page = 1): Promise<MangaSearchResult[]> {
    try {
      const $ = await this.fetchHtml(`/manga/page/${page}/?order=update`);
      return this.parseSearchResults($);
    } catch (error) {
      throw new ScraperError(`Failed to get latest updates: ${(error as Error).message}`);
    }
  }

  async getPopular(page = 1): Promise<MangaSearchResult[]> {
    try {
      const $ = await this.fetchHtml(`/manga/page/${page}/?order=popular`);
      return this.parseSearchResults($);
    } catch (error) {
      throw new ScraperError(`Failed to get popular: ${(error as Error).message}`);
    }
  }

  async getManhwaUpdate(page = 1): Promise<MangaSearchResult[]> {
    try {
      const $ = await this.fetchHtml(`/genres/manhwa-hentai-26/page/${page}/`);
      return this.parseSearchResults($);
    } catch (error) {
      throw new ScraperError(`Failed to get manhwa updates: ${(error as Error).message}`);
    }
  }

  async getMangaList(page = 1): Promise<MangaSearchResult[]> {
    try {
      const $ = await this.fetchHtml(`/manga/page/${page}/`);
      return this.parseSearchResults($);
    } catch (error) {
      throw new ScraperError(`Failed to get manga list: ${(error as Error).message}`);
    }
  }

  async getWebtoonHot(page = 1): Promise<MangaSearchResult[]> {
    try {
      const $ = await this.fetchHtml(`/manga/page/${page}/?order=rating`);
      return this.parseSearchResults($);
    } catch (error) {
      throw new ScraperError(`Failed to get webtoon hot: ${(error as Error).message}`);
    }
  }

  async getTumanhwasEspanol(page = 1): Promise<MangaSearchResult[]> {
    try {
      const $ = await this.fetchHtml(`/manga/page/${page}/?order=latest`);
      return this.parseSearchResults($);
    } catch (error) {
      throw new ScraperError(`Failed to get tumanhwas espanol: ${(error as Error).message}`);
    }
  }

  async getChinaToptoon(page = 1): Promise<MangaSearchResult[]> {
    try {
      const $ = await this.fetchHtml(`/genres/manga-hentai-902/page/${page}/`);
      return this.parseSearchResults($);
    } catch (error) {
      throw new ScraperError(`Failed to get china toptoon: ${(error as Error).message}`);
    }
  }

  async getPornComic(page = 1): Promise<MangaSearchResult[]> {
    try {
      const $ = await this.fetchHtml(`/manga/page/${page}/`);
      return this.parseSearchResults($);
    } catch (error) {
      throw new ScraperError(`Failed to get porn comic: ${(error as Error).message}`);
    }
  }

  async getMangaForFree(page = 1): Promise<MangaSearchResult[]> {
    try {
      const $ = await this.fetchHtml(`/manga/page/${page}/`);
      return this.parseSearchResults($);
    } catch (error) {
      throw new ScraperError(`Failed to get manga for free: ${(error as Error).message}`);
    }
  }

  async getHome(): Promise<HomeData> {
    try {
      const $ = await this.fetchHtml('/');
      
      const trending: MangaSearchResult[] = [];
      const popularToday: MangaSearchResult[] = [];
      const latestUpdates: MangaSearchResult[] = [];
      
      // Parse manga items from homepage
      $('.bs').each((_: number, element: any) => {
        const $item = $(element);
        const $link = $item.find('a[href*="/manga/"]').first();
        const href = $link.attr('href') || '';
        const id = extractIdFromUrl(href);
        const title = cleanText($link.attr('title') || $item.find('.tt').text());
        const cover = $item.find('img').attr('src') || $item.find('img').attr('data-src') || '';
        const latestChapter = cleanText($item.find('.epxs').text());
        const ratingText = $item.find('.numscore').text();
        
        if (id && title) {
          const result: MangaSearchResult = {
            id,
            title,
            cover: resolveUrl(this.baseUrl, cover),
            latestChapter: latestChapter || undefined,
            rating: ratingText ? parseFloat(ratingText) : undefined,
          };
          
          // Distribute items across sections
          if (popularToday.length < 10) {
            popularToday.push(result);
          } else if (latestUpdates.length < 20) {
            latestUpdates.push(result);
          }
        }
      });
      
      return {
        trending: trending.length > 0 ? trending : undefined,
        popularToday: popularToday.length > 0 ? popularToday : undefined,
        latestUpdates: latestUpdates.length > 0 ? latestUpdates : undefined,
        newReleases: undefined,
        recommendations: undefined,
      };
    } catch (error) {
      throw new ScraperError(`Failed to get home data: ${(error as Error).message}`);
    }
  }

  async getInfo(id: string): Promise<MangaInfo> {
    try {
      const $ = await this.fetchHtml(`/manga/${id}/`);
      
      const title = cleanText($('h1.entry-title').text());
      const cover = $('.thumb img').attr('src') || $('.seriestucontl img').first().attr('src') || '';
      
      // Get description
      const description = cleanText($('.entry-content[itemprop="description"]').text() || 
                                    $('.seriestucon .entry-content').text() ||
                                    $('.wd-full').text());
      
      // Get status
      const statusText = $('.tsinfo .imptdt:contains("Status")').next().text() || 
                        $('.infotable tr:contains("Status") td').last().text();
      const status = parseStatus(statusText);
      
      // Get rating
      const ratingText = $('.rating-prc .numscore').text() || $('.rating .numscore').text();
      const rating = ratingText ? parseFloat(ratingText) : undefined;
      
      // Get genres
      const genres = $('.seriestugenre a, .mgen a, .wd-full .mgen a').map((_, el) => cleanText($(el).text())).get();
      
      // Get authors
      const authors = $('.tsinfo .imptdt:contains("Author") i, .tsinfo .imptdt:contains("Author")').next().find('a').map((_, el) => cleanText($(el).text())).get();
      
      const type = parseType('manga');
      
      // Get chapters
      const chapters: ChapterInfo[] = [];
      $('#chapterlist ul li').each((_, element) => {
        const $chapter = $(element);
        const $link = $chapter.find('a').first();
        const href = $link.attr('href') || '';
        const chapterId = extractIdFromUrl(href);
        const chapterTitle = cleanText($link.find('.chapternum').text());
        const chapterNumber = parseChapterNumber(chapterTitle);
        const releaseDate = cleanText($link.find('.chapterdate').text());
        
        if (chapterId && chapterTitle) {
          chapters.push({
            id: chapterId,
            title: chapterTitle,
            chapter: chapterNumber,
            releaseDate: releaseDate ? parseDate(releaseDate) : undefined,
          });
        }
      });

      if (!title) {
        throw new ScraperError('Manga not found');
      }

      return {
        id,
        title,
        cover: resolveUrl(this.baseUrl, cover),
        description,
        status,
        rating,
        genres,
        authors: authors.length > 0 ? authors : undefined,
        type,
        chapters,
      };
    } catch (error) {
      throw new ScraperError(`Failed to get info: ${(error as Error).message}`);
    }
  }

  async getChapter(id: string): Promise<ChapterPages> {
    try {
      // Handle full URLs or chapter IDs
      let chapterPath = id;
      if (!id.startsWith('http') && !id.startsWith('/')) {
        chapterPath = `/${id}/`;
      }
      
      const $ = await this.fetchHtml(chapterPath);
      
      const title = cleanText($('h1.entry-title').text() || $('.allc a').attr('title') || '');
      const chapterNumber = parseChapterNumber(title);
      
      const pages: { page: number; imageUrl: string }[] = [];
      
      // Extract images from JavaScript ts_reader.run() call
      const scriptContent = $('script:contains("ts_reader.run")').html() || '';
      const imagesMatch = scriptContent.match(/"images":\s*(\[.*?\])/);
      
      if (imagesMatch && imagesMatch[1]) {
        try {
          const imageUrls = JSON.parse(imagesMatch[1]);
          imageUrls.forEach((url: any, index: number) => {
            if (url && typeof url === 'string') {
              pages.push({
                page: index + 1,
                imageUrl: url, // Already full URL
              });
            }
          });
        } catch (parseError) {
          // Fallback to noscript method
          $('#readerarea noscript img, #readerarea img').each((index, element) => {
            const $img = $(element);
            const imageUrl = $img.attr('src') || $img.attr('data-src') || '';
            
            if (imageUrl && !imageUrl.includes('icon') && !imageUrl.includes('logo') && !imageUrl.includes('readerarea.svg')) {
              pages.push({
                page: index + 1,
                imageUrl: resolveUrl(this.baseUrl, imageUrl),
              });
            }
          });
        }
      }

      // Get next/prev chapter links
      const nextHref = $('.readingnav a:contains("Next"), .nextprev a:contains("Next"), .ch-next-btn').attr('href');
      const prevHref = $('.readingnav a:contains("Prev"), .nextprev a:contains("Prev"), .ch-prev-btn').attr('href');

      if (pages.length === 0) {
        throw new ScraperError('No pages found');
      }

      return {
        id,
        title,
        chapter: chapterNumber,
        pages,
        nextChapter: nextHref ? extractIdFromUrl(nextHref) : undefined,
        previousChapter: prevHref ? extractIdFromUrl(prevHref) : undefined,
      };
    } catch (error) {
      throw new ScraperError(`Failed to get chapter: ${(error as Error).message}`);
    }
  }

  async getGenres(): Promise<Genre[]> {
    try {
      const $ = await this.fetchHtml('/genres/');
      const genres: Genre[] = [];

      $('.genre-list a, .genrez li a, ul.genre li a').each((_, element) => {
        const $genre = $(element);
        const name = cleanText($genre.text());
        const href = $genre.attr('href') || '';
        const slug = extractIdFromUrl(href) || generateSlug(name);
        
        if (name && slug) {
          genres.push({
            id: slug,
            name,
            slug,
          });
        }
      });

      return genres;
    } catch (error) {
      throw new ScraperError(`Failed to get genres: ${(error as Error).message}`);
    }
  }

  async getGenre(genre: string, page = 1): Promise<MangaSearchResult[]> {
    try {
      const $ = await this.fetchHtml(`/genres/${genre}/page/${page}/`);
      return this.parseSearchResults($);
    } catch (error) {
      throw new ScraperError(`Failed to get genre: ${(error as Error).message}`);
    }
  }

  private parseSearchResults($: CheerioAPI): MangaSearchResult[] {
    const results: MangaSearchResult[] = [];

    $('.bs').each((_: number, element: any) => {
      const $item = $(element);
      const $link = $item.find('a[href*="/manga/"]').first();
      const href = $link.attr('href') || '';
      const id = extractIdFromUrl(href);
      
      const title = cleanText($link.attr('title') || $item.find('.tt').text());
      const cover = $item.find('img').attr('src') || $item.find('img').attr('data-src') || '';
      const latestChapter = cleanText($item.find('.epxs').text());
      const genres = $item.find('.genre a, .mgen a').map((_: number, el: any) => cleanText($(el).text())).get();
      
      const ratingText = $item.find('.numscore').text();
      const rating = ratingText ? parseFloat(ratingText) : undefined;

      if (id && title) {
        results.push({
          id,
          title,
          cover: resolveUrl(this.baseUrl, cover),
          latestChapter: latestChapter || undefined,
          genres: genres.length > 0 ? genres : undefined,
          rating,
        });
      }
    });

    return results;
  }

  // Not implemented methods
  searchSuggestions = undefined;
  getPopularToday = undefined;
  getRecommendations = undefined;
}
