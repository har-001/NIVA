// ============================================
// NIVA — Internet Intelligence Module Types
// ============================================

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
  favicon?: string;
  publishedDate?: string;
}

export interface InstantAnswer {
  heading: string;
  abstractText: string;
  source: string;
  sourceUrl: string;
  imageUrl?: string;
  entityType?: string;
}

export interface SearchResponse {
  query: string;
  totalResults: number;
  instantAnswer?: InstantAnswer;
  results: SearchResult[];
  timestamp: string;
  cached?: boolean;
}

export interface WebpageLink {
  text: string;
  url: string;
}

export interface WebpageContent {
  url: string;
  title: string;
  description?: string;
  author?: string;
  domain: string;
  favicon?: string;
  contentMarkdown: string;
  textSnippet: string;
  wordCount: number;
  readingTimeMin: number;
  links: WebpageLink[];
  extractedAt: string;
}

export interface NewsItem {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  timeAgo: string;
  snippet?: string;
  topic?: string;
}

export interface NewsResponse {
  topic: string;
  total: number;
  items: NewsItem[];
  fetchedAt: string;
}
