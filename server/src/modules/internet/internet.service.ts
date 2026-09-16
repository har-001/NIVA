// ============================================
// NIVA — Internet Intelligence Service
// ============================================

import { searchAdapter } from './adapters/search.adapter';
import { webReaderAdapter } from './adapters/reader.adapter';
import { newsAdapter } from './adapters/news.adapter';
import { SearchResponse, WebpageContent, NewsResponse } from './types';
import { logger } from '../../utils/logger';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class InternetService {
  private searchCache = new Map<string, CacheEntry<SearchResponse>>();
  private readerCache = new Map<string, CacheEntry<WebpageContent>>();
  private newsCache = new Map<string, CacheEntry<NewsResponse>>();
  private cacheTtlMs = 5 * 60 * 1000; // 5 minutes

  /**
   * Search the live web with multi-engine retrieval and cache
   */
  public async search(query: string, limit: number = 8): Promise<SearchResponse> {
    const key = query.toLowerCase().trim();
    const cached = this.searchCache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      logger.info(`[InternetService] Returning cached search for: "${query}"`);
      return { ...cached.data, cached: true };
    }

    const result = await searchAdapter.search(query, limit);
    this.searchCache.set(key, {
      data: result,
      expiresAt: Date.now() + this.cacheTtlMs,
    });

    return result;
  }

  /**
   * Extract and read clean Markdown content from any URL
   */
  public async readWebpage(url: string): Promise<WebpageContent> {
    const key = url.trim();
    const cached = this.readerCache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      logger.info(`[InternetService] Returning cached article for: ${url}`);
      return cached.data;
    }

    const content = await webReaderAdapter.read(url);
    this.readerCache.set(key, {
      data: content,
      expiresAt: Date.now() + this.cacheTtlMs,
    });

    return content;
  }

  /**
   * Get breaking or topic-specific news
   */
  public async getNews(topic?: string, limit: number = 10): Promise<NewsResponse> {
    const key = (topic || 'trending').toLowerCase().trim();
    const cached = this.newsCache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      logger.info(`[InternetService] Returning cached news for: "${key}"`);
      return cached.data;
    }

    const news = await newsAdapter.getNews(topic, limit);
    this.newsCache.set(key, {
      data: news,
      expiresAt: Date.now() + 3 * 60 * 1000, // 3 minutes for news
    });

    return news;
  }

  /**
   * Quick fact / answer extraction for conversational agent queries
   */
  public async quickFact(query: string): Promise<string> {
    const searchRes = await this.search(query, 3);
    if (searchRes.instantAnswer) {
      return `**${searchRes.instantAnswer.heading}**: ${searchRes.instantAnswer.abstractText}\n*(Source: [${searchRes.instantAnswer.source}](${searchRes.instantAnswer.sourceUrl}))*`;
    }

    if (searchRes.results.length > 0) {
      const top = searchRes.results[0];
      return `**${top.title}**: ${top.snippet}\n*(Source: [${top.source}](${top.url}))*`;
    }

    return `No immediate web facts found for "${query}".`;
  }
}

export const internetService = new InternetService();
