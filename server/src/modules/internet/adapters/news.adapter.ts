// ============================================
// NIVA — Live Real-Time News Feed Adapter
// ============================================

import { NewsItem, NewsResponse } from '../types';
import { logger } from '../../../utils/logger';

export class NewsAdapter {
  private userAgent =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  /**
   * Fetch live headlines by topic or general top news
   */
  public async getNews(topic?: string, limit: number = 10): Promise<NewsResponse> {
    const cleanTopic = topic ? topic.trim() : '';
    logger.info(`[NewsAdapter] Fetching news for topic: "${cleanTopic || 'Top Headlines'}"`);

    let rssUrl = 'https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en';
    if (cleanTopic && cleanTopic.toLowerCase() !== 'top' && cleanTopic.toLowerCase() !== 'trending') {
      rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(cleanTopic)}&hl=en-IN&gl=IN&ceid=IN:en`;
    }

    try {
      const res = await fetch(rssUrl, {
        headers: { 'User-Agent': this.userAgent },
        signal: AbortSignal.timeout(6000),
      });

      if (!res.ok) {
        throw new Error(`Google News RSS returned ${res.status}`);
      }

      const xml = await res.text();
      const items = this.parseRssXml(xml, cleanTopic, limit);

      return {
        topic: cleanTopic || 'Trending',
        total: items.length,
        items,
        fetchedAt: new Date().toISOString(),
      };
    } catch (err: any) {
      logger.warn(`[NewsAdapter] Failed to fetch Google News RSS: ${err.message}`);
      // Fallback empty response
      return {
        topic: cleanTopic || 'Trending',
        total: 0,
        items: [],
        fetchedAt: new Date().toISOString(),
      };
    }
  }

  private parseRssXml(xml: string, topic: string, limit: number): NewsItem[] {
    const items: NewsItem[] = [];
    const itemBlocks = xml.split('<item>');

    for (let i = 1; i < itemBlocks.length && items.length < limit; i++) {
      const block = itemBlocks[i].split('</item>')[0];

      const titleRaw = this.extractTag(block, 'title');
      const link = this.extractTag(block, 'link');
      const pubDate = this.extractTag(block, 'pubDate');
      const sourceRaw = this.extractTag(block, 'source');

      if (titleRaw && link) {
        // Google News titles usually end with " - Source Name"
        let title = this.cleanEntities(titleRaw);
        let source = sourceRaw ? this.cleanEntities(sourceRaw) : '';

        if (!source && title.includes(' - ')) {
          const parts = title.split(' - ');
          source = parts.pop() || '';
          title = parts.join(' - ');
        }

        const publishedDate = pubDate ? new Date(pubDate) : new Date();
        const timeAgo = this.formatTimeAgo(publishedDate);

        items.push({
          id: `news_${Date.now()}_${i}`,
          title,
          url: link,
          source: source || 'News',
          publishedAt: publishedDate.toISOString(),
          timeAgo,
          topic: topic || 'Trending',
        });
      }
    }

    return items;
  }

  private extractTag(xmlChunk: string, tag: string): string | null {
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
    const match = xmlChunk.match(regex);
    return match ? match[1].trim() : null;
  }

  private cleanEntities(raw: string): string {
    return raw
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  }

  private formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }
}

export const newsAdapter = new NewsAdapter();
