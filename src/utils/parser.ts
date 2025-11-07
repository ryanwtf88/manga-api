import * as cheerio from 'cheerio';
import type { MangaStatus, MangaType } from '../types/index.js';

/**
 * Parse manga status from string
 */
export function parseStatus(status: string): MangaStatus {
  const normalized = status.toLowerCase().trim();

  if (normalized.includes('ongoing') || normalized.includes('publishing')) {
    return 'Ongoing' as MangaStatus;
  }
  if (normalized.includes('completed') || normalized.includes('finished')) {
    return 'Completed' as MangaStatus;
  }
  if (normalized.includes('hiatus') || normalized.includes('on hold')) {
    return 'Hiatus' as MangaStatus;
  }
  if (normalized.includes('cancelled') || normalized.includes('discontinued')) {
    return 'Cancelled' as MangaStatus;
  }
  if (normalized.includes('upcoming') || normalized.includes('not yet')) {
    return 'Upcoming' as MangaStatus;
  }

  return 'Ongoing' as MangaStatus;
}

/**
 * Parse manga type from string
 */
export function parseType(type: string): MangaType {
  const normalized = type.toLowerCase().trim();

  if (normalized.includes('manhwa')) {
    return 'Manhwa' as MangaType;
  }
  if (normalized.includes('manhua')) {
    return 'Manhua' as MangaType;
  }
  if (normalized.includes('doujinshi')) {
    return 'Doujinshi' as MangaType;
  }
  if (normalized.includes('comic')) {
    return 'Comic' as MangaType;
  }
  if (normalized.includes('one-shot') || normalized.includes('oneshot')) {
    return 'One-shot' as MangaType;
  }

  return 'Manga' as MangaType;
}

/**
 * Parse rating from string (e.g., "8.5" or "4.2/5")
 */
export function parseRating(rating: string): number {
  const match = rating.match(/(\d+\.?\d*)/);
  if (match) {
    const value = parseFloat(match[1]);
    // Normalize to 0-10 scale
    if (rating.includes('/5')) {
      return (value / 5) * 10;
    }
    return value;
  }
  return 0;
}

/**
 * Parse chapter number from string
 */
export function parseChapterNumber(text: string): string {
  const match = text.match(/(?:chapter|ch\.?)\s*(\d+(?:\.\d+)?)/i);
  return match ? match[1] : text;
}

/**
 * Extract ID from URL
 */
export function extractIdFromUrl(url: string): string {
  const parts = url.split('/').filter(Boolean);
  return parts[parts.length - 1] || '';
}

/**
 * Clean text content (remove extra whitespace, newlines)
 */
export function cleanText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Extract absolute URL from relative URL
 */
export function resolveUrl(baseUrl: string, url: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  if (url.startsWith('//')) {
    return 'https:' + url;
  }
  if (url.startsWith('/')) {
    return baseUrl + url;
  }
  return baseUrl + '/' + url;
}

/**
 * Parse views/popularity count
 */
export function parseViews(text: string): number {
  const match = text.match(/(\d+(?:,\d+)*(?:\.\d+)?)\s*([KMB])?/i);
  if (match) {
    const value = parseFloat(match[1].replace(/,/g, ''));
    const multiplier = match[2];

    switch (multiplier?.toUpperCase()) {
      case 'K':
        return Math.floor(value * 1000);
      case 'M':
        return Math.floor(value * 1000000);
      case 'B':
        return Math.floor(value * 1000000000);
      default:
        return Math.floor(value);
    }
  }
  return 0;
}

/**
 * Parse date string to ISO format
 */
export function parseDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
  } catch {
    // Ignore parsing errors
  }
  return dateString;
}

/**
 * Sanitize HTML and extract text
 */
export function sanitizeHtml(html: string): string {
  const $ = cheerio.load(html);
  // Remove script and style tags
  $('script, style').remove();
  // Get text content
  return cleanText($.text());
}

/**
 * Extract search suggestions from HTML
 */
export function extractSearchSuggestions($: cheerio.CheerioAPI, selector: string) {
  const suggestions: Array<{ id: string; title: string; cover?: string }> = [];

  $(selector).each((_, element) => {
    const $el = $(element);
    const title = cleanText($el.find('.title').text() || $el.text());
    const href = $el.attr('href') || '';
    const id = extractIdFromUrl(href);
    const cover = $el.find('img').attr('src') || $el.find('img').attr('data-src');

    if (id && title) {
      suggestions.push({
        id,
        title,
        cover: cover || undefined,
      });
    }
  });

  return suggestions;
}

/**
 * Parse pagination info from HTML
 */
export function parsePagination(
  $: cheerio.CheerioAPI,
  currentPage: number
): { currentPage: number; hasNextPage: boolean; totalPages?: number } {
  const pagination = $('.pagination, .pager, [class*="pagination"]');

  if (pagination.length === 0) {
    return { currentPage, hasNextPage: false };
  }

  // Check for next page link
  const nextLink = pagination.find('a[rel="next"], .next:not(.disabled), [class*="next"]:not(.disabled)');
  const hasNextPage = nextLink.length > 0;

  // Try to find total pages
  const lastPageLink = pagination.find('a').last();
  const lastPageText = lastPageLink.text().trim();
  const totalPagesMatch = lastPageText.match(/\d+/);
  const totalPages = totalPagesMatch ? parseInt(totalPagesMatch[0]) : undefined;

  return {
    currentPage,
    hasNextPage,
    totalPages,
  };
}

/**
 * Generate slug from title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}
