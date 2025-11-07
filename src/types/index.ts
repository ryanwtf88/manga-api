export interface ApiResponse<T> {
  success: boolean;
  source: string;
  data: T;
  pagination?: PaginationInfo;
  cached: boolean;
  timestamp: string;
}

export interface PaginationInfo {
  currentPage: number;
  hasNextPage: boolean;
  totalPages?: number;
}

export interface MangaInfo {
  id: string;
  title: string;
  altTitles?: string[];
  cover: string;
  description: string;
  status: MangaStatus;
  rating?: number;
  genres: string[];
  authors?: string[];
  artists?: string[];
  type?: MangaType;
  releaseDate?: string;
  lastUpdated?: string;
  views?: number;
  chapters: ChapterInfo[];
  relatedManga?: MangaSearchResult[];
  authorsManga?: MangaSearchResult[];
  characters?: Character[];
  recommendations?: MangaSearchResult[];
}

export interface Character {
  name: string;
  role?: string;
  image?: string;
}

export interface MangaSearchResult {
  id: string;
  title: string;
  cover: string;
  latestChapter?: string;
  genres?: string[];
  rating?: number;
  type?: MangaType;
}

export interface ChapterInfo {
  id: string;
  title: string;
  chapter: string;
  releaseDate?: string;
  views?: number;
}

export interface ChapterPages {
  id: string;
  title: string;
  chapter: string;
  pages: PageInfo[];
  nextChapter?: string;
  previousChapter?: string;
}

export interface PageInfo {
  page: number;
  imageUrl: string;
}

export interface SearchSuggestion {
  id: string;
  title: string;
  cover?: string;
}

export interface Genre {
  id: string;
  name: string;
  slug: string;
}

export interface HomeData {
  trending?: MangaSearchResult[];
  popularToday?: MangaSearchResult[];
  latestUpdates?: MangaSearchResult[];
  newReleases?: MangaSearchResult[];
  recommendations?: MangaSearchResult[];
}

export interface SourceInfo {
  name: string;
  baseUrl: string;
  isActive: boolean;
  features: string[];
}

export enum MangaStatus {
  ONGOING = 'Ongoing',
  COMPLETED = 'Completed',
  HIATUS = 'Hiatus',
  CANCELLED = 'Cancelled',
  UPCOMING = 'Upcoming',
}

export enum MangaType {
  MANGA = 'Manga',
  MANHWA = 'Manhwa',
  MANHUA = 'Manhua',
  COMIC = 'Comic',
  DOUJINSHI = 'Doujinshi',
  ONE_SHOT = 'One-shot',
}

export interface CacheConfig {
  ttl: number;
  checkperiod?: number;
}

export interface RateLimitConfig {
  windowMs: number;
  max: number;
}

export interface ScraperConfig {
  baseUrl: string;
  timeout: number;
  userAgents: string[];
  retryAttempts: number;
  retryDelay: number;
}

export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
}

export type SourceName = 'mangareader' | 'hentai20' | 'omegascans';

export interface SearchParams {
  query: string;
  page?: number;
}

export interface GenreParams {
  genre: string;
  page?: number;
}

export interface PageParams {
  page?: number;
}
