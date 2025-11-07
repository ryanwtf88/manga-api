import { BaseScraper } from './base.js';
import type { CheerioAPI } from 'cheerio';
import type {
  MangaInfo,
  MangaSearchResult,
  ChapterPages,
  SearchSuggestion,
  Genre,
  ChapterInfo,
  Character,
  HomeData,
} from '../types/index.js';
import {
  cleanText,
  extractIdFromUrl,
  parseStatus,
  parseType,
  parseRating,
  parseChapterNumber,
  resolveUrl,
  parseViews,
  parseDate,
} from '../utils/parser.js';
import { ScraperError } from '../utils/errorHandler.js';

export class MangaReaderScraper extends BaseScraper {
  constructor(baseUrl: string) {
    super(baseUrl, 'mangareader');
  }

  async search(query: string, page = 1): Promise<MangaSearchResult[]> {
    try {
      const $ = await this.fetchHtml(`/search?keyword=${encodeURIComponent(query)}&page=${page}`);
      return this.parseSearchResults($);
    } catch (error) {
      throw new ScraperError(`Failed to search manga: ${(error as Error).message}`);
    }
  }

  async searchSuggestions(query: string): Promise<SearchSuggestion[]> {
    try {
      const $ = await this.fetchHtml(`/search?keyword=${encodeURIComponent(query)}`);
      const suggestions: SearchSuggestion[] = [];

      $('.manga_list-sbs .item, .manga-list .item, .flw-item').slice(0, 10).each((_: number, element: any) => {
        const $item = $(element);
        const $link = $item.find('.manga-poster a, .film-poster a').first();
        const href = $link.attr('href') || '';
        const id = extractIdFromUrl(href);
        const title = cleanText($link.attr('title') || $item.find('.film-name, .manga-name').text());
        const cover = $link.find('img').attr('data-src') || $link.find('img').attr('src');

        if (id && title) {
          suggestions.push({
            id,
            title,
            cover: cover ? resolveUrl(this.baseUrl, cover) : undefined,
          });
        }
      });

      return suggestions;
    } catch (error) {
      throw new ScraperError(`Failed to get search suggestions: ${(error as Error).message}`);
    }
  }

  // Most Viewed Today
  async getPopularToday(page = 1): Promise<MangaSearchResult[]> {
    try {
      const $ = await this.fetchHtml(`/filter?sort=most_viewed&time=day&page=${page}`);
      return this.parseSearchResults($);
    } catch (error) {
      throw new ScraperError(`Failed to get popular today: ${(error as Error).message}`);
    }
  }

  // Most Viewed Week
  async getPopularWeek(page = 1): Promise<MangaSearchResult[]> {
    try {
      const $ = await this.fetchHtml(`/filter?sort=most_viewed&time=week&page=${page}`);
      return this.parseSearchResults($);
    } catch (error) {
      throw new ScraperError(`Failed to get popular week: ${(error as Error).message}`);
    }
  }

  // Most Viewed Month
  async getPopularMonth(page = 1): Promise<MangaSearchResult[]> {
    try {
      const $ = await this.fetchHtml(`/filter?sort=most_viewed&time=month&page=${page}`);
      return this.parseSearchResults($);
    } catch (error) {
      throw new ScraperError(`Failed to get popular month: ${(error as Error).message}`);
    }
  }

  // Latest Updated
  async getLatestUpdates(page = 1): Promise<MangaSearchResult[]> {
    try {
      const $ = await this.fetchHtml(`/filter?sort=latest-updated&page=${page}`);
      return this.parseSearchResults($);
    } catch (error) {
      throw new ScraperError(`Failed to get latest updates: ${(error as Error).message}`);
    }
  }

  // Most Viewed (all time)
  async getPopular(page = 1): Promise<MangaSearchResult[]> {
    try {
      const $ = await this.fetchHtml(`/filter?sort=most_viewed&page=${page}`);
      return this.parseSearchResults($);
    } catch (error) {
      throw new ScraperError(`Failed to get popular manga: ${(error as Error).message}`);
    }
  }

  // New Release
  async getNewRelease(page = 1): Promise<MangaSearchResult[]> {
    try {
      const $ = await this.fetchHtml(`/filter?sort=recently_added&page=${page}`);
      return this.parseSearchResults($);
    } catch (error) {
      throw new ScraperError(`Failed to get new releases: ${(error as Error).message}`);
    }
  }

  // Recommended
  async getRecommendations(page = 1): Promise<MangaSearchResult[]> {
    try {
      const $ = await this.fetchHtml(`/filter?sort=score&page=${page}`);
      return this.parseSearchResults($);
    } catch (error) {
      throw new ScraperError(`Failed to get recommendations: ${(error as Error).message}`);
    }
  }

  // Trending
  async getTrending(page = 1): Promise<MangaSearchResult[]> {
    try {
      const $ = await this.fetchHtml(`/filter?sort=trending&page=${page}`);
      return this.parseSearchResults($);
    } catch (error) {
      throw new ScraperError(`Failed to get trending: ${(error as Error).message}`);
    }
  }

  // Completed manga
  async getCompleted(page = 1): Promise<MangaSearchResult[]> {
    try {
      const $ = await this.fetchHtml(`/completed?page=${page}`);
      return this.parseSearchResults($);
    } catch (error) {
      throw new ScraperError(`Failed to get completed manga: ${(error as Error).message}`);
    }
  }

  // Filter by type
  async getByType(type: string, page = 1): Promise<MangaSearchResult[]> {
    try {
      // Types: manga, one_shot, doujinshi, light_novel, manhwa, manhua, comic
      const $ = await this.fetchHtml(`/filter?type=${type}&page=${page}`);
      return this.parseSearchResults($);
    } catch (error) {
      throw new ScraperError(`Failed to get ${type}: ${(error as Error).message}`);
    }
  }

  async getInfo(id: string): Promise<MangaInfo> {
    try {
      const $ = await this.fetchHtml(`/${id}`);
      
      const title = cleanText($('.manga-name, .anisc-detail .film-name, h2.film-name').first().text());
      const altTitles = $('.anisc-info .item-title:contains("Synonyms"), .alias')
        .next()
        .text()
        .split(/[;,]/)
        .map(t => cleanText(t))
        .filter(Boolean);
      
      const cover = $('.manga-poster img, .film-poster img').attr('data-src') || 
                    $('.manga-poster img, .film-poster img').attr('src') || '';
      
      const description = cleanText($('.description, .film-description, .text').text());
      
      const statusText = $('.item-title:contains("Status")').next().text() ||
                         $('.status .value').text();
      const status = parseStatus(statusText);
      
      const ratingText = $('.score, .item-title:contains("Score")').next().text().trim();
      const rating = ratingText ? parseRating(ratingText) : undefined;
      
      const genres = $('.genres a, .item-list a').map((_: number, el: any) => cleanText($(el).text())).get();
      
      const authors = $('.item-title:contains("Author")').next().text().split(',').map((a: string) => cleanText(a)).filter(Boolean);
      
      const typeText = $('.item-title:contains("Type")').next().text();
      const type = typeText ? parseType(typeText) : undefined;
      
      const releaseDateText = $('.item-title:contains("Released")').next().text();
      const releaseDate = releaseDateText ? parseDate(releaseDateText) : undefined;
      
      const viewsText = $('.item-title:contains("Views")').next().text();
      const views = viewsText ? parseViews(viewsText) : undefined;
      
      // Parse chapters
      const chapters: ChapterInfo[] = [];
      $('#en-chapters li, .chapter-list li, .chapters-list-ul li, .ss-list a').each((_: number, element: any) => {
        const $chapter = $(element);
        const $link = $chapter.is('a') ? $chapter : $chapter.find('a').first();
        const chapterHref = $link.attr('href') || '';
        const chapterId = extractIdFromUrl(chapterHref);
        const chapterTitle = cleanText($link.text() || $link.attr('title') || '');
        const chapterNumber = parseChapterNumber(chapterTitle);
        const chapterDate = $chapter.find('.chapter-time, .fd-infor span').first().text();
        
        if (chapterId && chapterTitle) {
          chapters.push({
            id: chapterId,
            title: chapterTitle,
            chapter: chapterNumber,
            releaseDate: chapterDate ? parseDate(chapterDate) : undefined,
          });
        }
      });

      if (!title) {
        throw new ScraperError('Manga not found or invalid page structure');
      }

      // Parse related manga
      const relatedManga: MangaSearchResult[] = [];
      $('.film_list-wrap .flw-item, .related-manga .item').slice(0, 10).each((_: number, element: any) => {
        const $item = $(element);
        const $link = $item.find('.film-poster a, .manga-poster a').first();
        const href = $link.attr('href') || '';
        const mangaId = extractIdFromUrl(href);
        const mangaTitle = cleanText($link.attr('title') || $item.find('.film-name, .manga-name').text());
        const mangaCover = $link.find('img').attr('data-src') || $link.find('img').attr('src') || '';
        
        if (mangaId && mangaTitle) {
          relatedManga.push({
            id: mangaId,
            title: mangaTitle,
            cover: resolveUrl(this.baseUrl, mangaCover),
          });
        }
      });

      // Parse characters
      const characters: Character[] = [];
      $('.character-item, .char-list .item').each((_: number, element: any) => {
        const $char = $(element);
        const name = cleanText($char.find('.char-name, .name').text());
        const role = cleanText($char.find('.char-role, .role').text());
        const image = $char.find('img').attr('data-src') || $char.find('img').attr('src');
        
        if (name) {
          characters.push({
            name,
            role: role || undefined,
            image: image ? resolveUrl(this.baseUrl, image) : undefined,
          });
        }
      });

      // Parse recommendations / you may also like
      const recommendations: MangaSearchResult[] = [];
      $('.recommendations .flw-item, .you-may-like .item, #similar-items .item').slice(0, 10).each((_: number, element: any) => {
        const $item = $(element);
        const $link = $item.find('.film-poster a, .manga-poster a').first();
        const href = $link.attr('href') || '';
        const mangaId = extractIdFromUrl(href);
        const mangaTitle = cleanText($link.attr('title') || $item.find('.film-name, .manga-name').text());
        const mangaCover = $link.find('img').attr('data-src') || $link.find('img').attr('src') || '';
        
        if (mangaId && mangaTitle) {
          recommendations.push({
            id: mangaId,
            title: mangaTitle,
            cover: resolveUrl(this.baseUrl, mangaCover),
          });
        }
      });

      return {
        id,
        title,
        altTitles: altTitles.length > 0 ? altTitles : undefined,
        cover: resolveUrl(this.baseUrl, cover),
        description,
        status,
        rating,
        genres,
        authors: authors.length > 0 ? authors : undefined,
        type,
        releaseDate,
        views,
        chapters,
        relatedManga: relatedManga.length > 0 ? relatedManga : undefined,
        authorsManga: undefined, // Can be fetched separately
        characters: characters.length > 0 ? characters : undefined,
        recommendations: recommendations.length > 0 ? recommendations : undefined,
      };
    } catch (error) {
      throw new ScraperError(`Failed to get manga info: ${(error as Error).message}`);
    }
  }

  // Get related manga for a specific manga
  async getRelatedManga(id: string): Promise<MangaSearchResult[]> {
    try {
      const $ = await this.fetchHtml(`/${id}`);
      const relatedManga: MangaSearchResult[] = [];
      
      $('.film_list-wrap .flw-item, .related-manga .item, #similar-items .item').each((_: number, element: any) => {
        const $item = $(element);
        const $link = $item.find('.film-poster a, .manga-poster a').first();
        const href = $link.attr('href') || '';
        const mangaId = extractIdFromUrl(href);
        const mangaTitle = cleanText($link.attr('title') || $item.find('.film-name, .manga-name').text());
        const mangaCover = $link.find('img').attr('data-src') || $link.find('img').attr('src') || '';
        
        if (mangaId && mangaTitle) {
          relatedManga.push({
            id: mangaId,
            title: mangaTitle,
            cover: resolveUrl(this.baseUrl, mangaCover),
          });
        }
      });
      
      return relatedManga;
    } catch (error) {
      throw new ScraperError(`Failed to get related manga: ${(error as Error).message}`);
    }
  }

  // Get other manga by the same author
  async getAuthorsManga(author: string, page = 1): Promise<MangaSearchResult[]> {
    try {
      const $ = await this.fetchHtml(`/search?keyword=${encodeURIComponent(author)}&page=${page}`);
      return this.parseSearchResults($);
    } catch (error) {
      throw new ScraperError(`Failed to get author's manga: ${(error as Error).message}`);
    }
  }

  // Get characters from a manga
  async getCharacters(id: string): Promise<Character[]> {
    try {
      const $ = await this.fetchHtml(`/${id}`);
      const characters: Character[] = [];
      
      $('.character-item, .char-list .item, .characters-list .item').each((_: number, element: any) => {
        const $char = $(element);
        const name = cleanText($char.find('.char-name, .name, h4').text());
        const role = cleanText($char.find('.char-role, .role, .type').text());
        const image = $char.find('img').attr('data-src') || $char.find('img').attr('src');
        
        if (name) {
          characters.push({
            name,
            role: role || undefined,
            image: image ? resolveUrl(this.baseUrl, image) : undefined,
          });
        }
      });
      
      return characters;
    } catch (error) {
      throw new ScraperError(`Failed to get characters: ${(error as Error).message}`);
    }
  }

  // Get "You May Also Like" recommendations for a manga
  async getYouMayAlsoLike(id: string): Promise<MangaSearchResult[]> {
    try {
      const $ = await this.fetchHtml(`/${id}`);
      const recommendations: MangaSearchResult[] = [];
      
      $('.recommendations .flw-item, .you-may-like .item, #similar-items .item').each((_: number, element: any) => {
        const $item = $(element);
        const $link = $item.find('.film-poster a, .manga-poster a').first();
        const href = $link.attr('href') || '';
        const mangaId = extractIdFromUrl(href);
        const mangaTitle = cleanText($link.attr('title') || $item.find('.film-name, .manga-name').text());
        const mangaCover = $link.find('img').attr('data-src') || $link.find('img').attr('src') || '';
        const rating = $item.find('.tick-rate, .rating').text();
        
        if (mangaId && mangaTitle) {
          recommendations.push({
            id: mangaId,
            title: mangaTitle,
            cover: resolveUrl(this.baseUrl, mangaCover),
            rating: rating ? parseRating(rating) : undefined,
          });
        }
      });
      
      return recommendations;
    } catch (error) {
      throw new ScraperError(`Failed to get recommendations: ${(error as Error).message}`);
    }
  }

  // Get home page data with multiple sections
  async getHome(): Promise<HomeData> {
    try {
      const $ = await this.fetchHtml('/home');
      
      const latestUpdates: MangaSearchResult[] = [];
      const recommendations: MangaSearchResult[] = [];
      
      // Note: MangaReader.to loads trending/featured sections dynamically with JavaScript
      // We can only scrape the visible "Latest Updates" section from the initial HTML
      
      // Parse latest updates section (.manga_list-sbs .item-spc)
      $('.manga_list-sbs .item-spc, .block_area_home .item-spc').each((_: number, element: any) => {
        const $item = $(element);
        const $link = $item.find('a.manga-poster').first();
        const href = $link.attr('href') || '';
        const id = extractIdFromUrl(href);
        const title = cleanText($item.find('.manga-name a').text() || $link.find('img').attr('alt') || '');
        const cover = $item.find('.manga-poster-img').attr('src') || 
                     $item.find('.manga-poster-img').attr('data-src') || '';
        const latestChapter = cleanText($item.find('.fdl-item .chapter a').first().text());
        const genres = $item.find('.fdi-cate a').map((_: number, el: any) => cleanText($(el).text())).get();
        
        if (id && title) {
          latestUpdates.push({ 
            id, 
            title, 
            cover: resolveUrl(this.baseUrl, cover),
            latestChapter: latestChapter || undefined,
            genres: genres.length > 0 ? genres : undefined
          });
        }
      });
      
      // For full home page features, use dedicated endpoints:
      // - /filter?sort=trending for trending
      // - /filter?sort=most_viewed&time=day for popular today
      // - /filter?sort=score for recommendations
      // - /filter?sort=recently_added for new releases
      
      // Get trending from dedicated endpoint
      const trending = await this.getTrending(1).catch(() => []).then(r => r.slice(0, 12));
      
      // Get popular today
      const popularToday = await this.getPopularToday(1).catch(() => []).then(r => r.slice(0, 10));
      
      // Get recommendations  
      recommendations.push(...await this.getRecommendations(1).catch(() => []).then(r => r.slice(0, 12)));
      
      // Get new releases
      const newReleases = await this.getNewRelease(1).catch(() => []).then(r => r.slice(0, 12));
      
      return {
        trending: trending.length > 0 ? trending : undefined,
        popularToday: popularToday.length > 0 ? popularToday : undefined,
        latestUpdates: latestUpdates.length > 0 ? latestUpdates : undefined,
        newReleases: newReleases.length > 0 ? newReleases : undefined,
        recommendations: recommendations.length > 0 ? recommendations : undefined,
      };
    } catch (error) {
      throw new ScraperError(`Failed to get home data: ${(error as Error).message}`);
    }
  }

  async getChapter(id: string): Promise<ChapterPages> {
    try {
      // First, load the chapter page to get metadata and reading-id
      const $ = await this.fetchHtml(`/${id}`);
      
      const title = cleanText($('.chapter-name, .heading-name, .manga-name, h1, h2').first().text());
      const chapterNumber = parseChapterNumber(title);
      
      // Extract reading ID from data attributes
      const readingId = $('[data-reading-id]').attr('data-reading-id') || '';
      
      const pages: { page: number; imageUrl: string }[] = [];
      
      // Method 1: Use AJAX endpoint to get chapter images
      if (readingId) {
        try {
          const response = await this.client.get(
            `/ajax/image/list/chap/${readingId}?mode=vertical&quality=high&hozPageSize=1`,
            {
              headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Referer': `${this.baseUrl}/${id}`,
              },
            }
          );
          
          const ajaxData = response.data;
          
          if (ajaxData.status && ajaxData.html) {
            const cheerio = await import('cheerio');
            const $ajax = cheerio.load(ajaxData.html);
            
            // Extract data-url from iv-card elements
            $ajax('.iv-card[data-url], .page-break[data-url]').each((index: number, element: any) => {
              const imageUrl = $ajax(element).attr('data-url') || '';
              if (imageUrl) {
                pages.push({
                  page: index + 1,
                  imageUrl: imageUrl.startsWith('http') ? imageUrl : resolveUrl(this.baseUrl, imageUrl),
                });
              }
            });
          }
        } catch (ajaxError) {
          console.error('AJAX method failed, trying fallback:', (ajaxError as Error).message);
        }
      }
      
      // Method 2: Fallback - try to find images in the initial HTML
      if (pages.length === 0) {
        $('#images-content img, .reading-content img, .iv-card[data-url], .page-break[data-url]').each((index: number, element: any) => {
          const $elem = $(element);
          const imageUrl = $elem.attr('data-url') || $elem.attr('data-src') || $elem.attr('src') || '';
          
          if (imageUrl && !imageUrl.includes('loading') && !imageUrl.includes('placeholder') && !imageUrl.includes('logo')) {
            pages.push({
              page: index + 1,
              imageUrl: imageUrl.startsWith('http') ? imageUrl : resolveUrl(this.baseUrl, imageUrl),
            });
          }
        });
      }

      // Navigation links
      const nextChapterHref = $('#next-chapter, .nav-next a, button[onclick*="next"]').attr('href') || 
                              $('#next-chapter, .nav-next a, button[onclick*="next"]').attr('onclick')?.match(/['"]([^'"]+)['"]/)?.[1];
      const previousChapterHref = $('#prev-chapter, .nav-previous a, button[onclick*="prev"]').attr('href') ||
                                  $('#prev-chapter, .nav-previous a, button[onclick*="prev"]').attr('onclick')?.match(/['"]([^'"]+)['"]/)?.[1];
      
      const nextChapter = nextChapterHref ? extractIdFromUrl(nextChapterHref) : undefined;
      const previousChapter = previousChapterHref ? extractIdFromUrl(previousChapterHref) : undefined;

      if (pages.length === 0) {
        throw new ScraperError('No pages found for this chapter');
      }

      return {
        id,
        title,
        chapter: chapterNumber,
        pages,
        nextChapter,
        previousChapter,
      };
    } catch (error) {
      throw new ScraperError(`Failed to get chapter pages: ${(error as Error).message}`);
    }
  }

  async getGenres(): Promise<Genre[]> {
    try {
      const genres: Genre[] = [
        { id: 'action', name: 'Action', slug: 'action' },
        { id: 'adventure', name: 'Adventure', slug: 'adventure' },
        { id: 'cars', name: 'Cars', slug: 'cars' },
        { id: 'comedy', name: 'Comedy', slug: 'comedy' },
        { id: 'dementia', name: 'Dementia', slug: 'dementia' },
        { id: 'demons', name: 'Demons', slug: 'demons' },
        { id: 'drama', name: 'Drama', slug: 'drama' },
        { id: 'doujinshi', name: 'Doujinshi', slug: 'doujinshi' },
        { id: 'ecchi', name: 'Ecchi', slug: 'ecchi' },
        { id: 'fantasy', name: 'Fantasy', slug: 'fantasy' },
        { id: 'gender-bender', name: 'Gender Bender', slug: 'gender-bender' },
        { id: 'harem', name: 'Harem', slug: 'harem' },
        { id: 'game', name: 'Game', slug: 'game' },
        { id: 'hentai', name: 'Hentai', slug: 'hentai' },
        { id: 'historical', name: 'Historical', slug: 'historical' },
        { id: 'horror', name: 'Horror', slug: 'horror' },
        { id: 'josei', name: 'Josei', slug: 'josei' },
        { id: 'kids', name: 'Kids', slug: 'kids' },
        { id: 'magic', name: 'Magic', slug: 'magic' },
        { id: 'martial-arts', name: 'Martial Arts', slug: 'martial-arts' },
        { id: 'mecha', name: 'Mecha', slug: 'mecha' },
        { id: 'military', name: 'Military', slug: 'military' },
        { id: 'music', name: 'Music', slug: 'music' },
        { id: 'mystery', name: 'Mystery', slug: 'mystery' },
        { id: 'parody', name: 'Parody', slug: 'parody' },
        { id: 'police', name: 'Police', slug: 'police' },
        { id: 'psychological', name: 'Psychological', slug: 'psychological' },
        { id: 'romance', name: 'Romance', slug: 'romance' },
        { id: 'samurai', name: 'Samurai', slug: 'samurai' },
        { id: 'school', name: 'School', slug: 'school' },
        { id: 'sci-fi', name: 'Sci-Fi', slug: 'sci-fi' },
        { id: 'seinen', name: 'Seinen', slug: 'seinen' },
        { id: 'shoujo', name: 'Shoujo', slug: 'shoujo' },
        { id: 'shoujo-ai', name: 'Shoujo Ai', slug: 'shoujo-ai' },
        { id: 'shounen', name: 'Shounen', slug: 'shounen' },
        { id: 'shounen-ai', name: 'Shounen Ai', slug: 'shounen-ai' },
        { id: 'slice-of-life', name: 'Slice of Life', slug: 'slice-of-life' },
        { id: 'space', name: 'Space', slug: 'space' },
        { id: 'sports', name: 'Sports', slug: 'sports' },
        { id: 'super-power', name: 'Super Power', slug: 'super-power' },
        { id: 'supernatural', name: 'Supernatural', slug: 'supernatural' },
        { id: 'thriller', name: 'Thriller', slug: 'thriller' },
        { id: 'vampire', name: 'Vampire', slug: 'vampire' },
        { id: 'yaoi', name: 'Yaoi', slug: 'yaoi' },
        { id: 'yuri', name: 'Yuri', slug: 'yuri' },
      ];

      return genres;
    } catch (error) {
      throw new ScraperError(`Failed to get genres: ${(error as Error).message}`);
    }
  }

  async getGenre(genre: string, page = 1): Promise<MangaSearchResult[]> {
    try {
      const $ = await this.fetchHtml(`/filter?genre=${encodeURIComponent(genre)}&page=${page}`);
      return this.parseSearchResults($);
    } catch (error) {
      throw new ScraperError(`Failed to get genre: ${(error as Error).message}`);
    }
  }

  /**
   * Helper method to parse search results from HTML
   */
  private parseSearchResults($: CheerioAPI): MangaSearchResult[] {
    const results: MangaSearchResult[] = [];

    $('.manga_list-sbs .item, .manga-list .item, .film_list .flw-item, .flw-item').each((_: number, element: any) => {
      const $item = $(element);
      // Try both link inside .manga-poster and .manga-poster as link
      let $link = $item.find('.manga-poster a, .film-poster a').first();
      if (!$link.length) {
        $link = $item.find('a.manga-poster, a.film-poster').first();
      }
      const href = $link.attr('href') || '';
      const id = extractIdFromUrl(href);
      
      const $img = $item.find('.manga-poster img, .film-poster img').first();
      const title = cleanText($img.attr('alt') || $link.attr('title') || $item.find('.film-name a, .manga-name a, .manga-name').text());
      const cover = $img.attr('src') || $img.attr('data-src') || '';
      
      // Get latest chapter - look in fd-list or latest-chapter
      let latestChapter: string | undefined;
      const $chapterLink = $item.find('.fd-list .chapter a, .fdl-item .chapter a, .latest-chapter a').first();
      if ($chapterLink.length) {
        latestChapter = cleanText($chapterLink.text());
      }
      
      // Get genres from fdi-cate (not all fdi-items)
      const genres = $item.find('.fdi-cate a, .genres a').map((_: number, el: any) => cleanText($(el).text())).get();
      
      const ratingText = $item.find('.score, .tick-rate, .film-rating').text().trim();
      const rating = ratingText ? parseRating(ratingText) : undefined;

      const typeText = $item.find('.type, .fdi-type').text();
      const type = typeText ? parseType(typeText) : undefined;

      if (id && title) {
        results.push({
          id,
          title,
          cover: resolveUrl(this.baseUrl, cover),
          latestChapter,
          genres: genres.length > 0 ? genres : undefined,
          rating,
          type,
        });
      }
    });

    return results;
  }

}
// Force rebuild Thu Nov  6 11:41:10 PM UTC 2025
