// ============================================
// NIVA — Zero-Cost Multi-Engine Search Adapter
// ============================================

import { SearchResponse, SearchResult, InstantAnswer } from '../types';
import { logger } from '../../../utils/logger';

export class SearchAdapter {
  private userAgent =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  /**
   * Main search method that combines Instant Answer, Web Search, and Wikipedia fallback
   */
  public async search(query: string, limit: number = 8): Promise<SearchResponse> {
    const cleanQuery = query.trim();
    if (!cleanQuery) {
      return {
        query,
        totalResults: 0,
        results: [],
        timestamp: new Date().toISOString(),
      };
    }

    logger.info(`[SearchAdapter] Searching for: "${cleanQuery}"`);

    // 1. Fetch Instant Answer from DuckDuckGo and Wikipedia in parallel
    const [ddgData, wikiData, organicResults] = await Promise.allSettled([
      this.fetchDuckDuckGoInstant(cleanQuery),
      this.fetchWikipediaSummary(cleanQuery),
      this.fetchDuckDuckGoOrganic(cleanQuery, limit),
    ]);

    let instantAnswer: InstantAnswer | undefined = undefined;

    // Prefer DDG instant answer if available
    if (ddgData.status === 'fulfilled' && ddgData.value) {
      instantAnswer = ddgData.value;
    } else if (wikiData.status === 'fulfilled' && wikiData.value) {
      instantAnswer = wikiData.value;
    }

    let results: SearchResult[] = [];
    if (organicResults.status === 'fulfilled' && organicResults.value.length > 0) {
      results = organicResults.value;
    }

    // If organic search yielded few results, supplement with Wikipedia search
    if (results.length < 3) {
      try {
        const wikiArticles = await this.fetchWikipediaSearch(cleanQuery, limit - results.length);
        results = [...results, ...wikiArticles];
      } catch (err) {
        logger.warn(`[SearchAdapter] Wikipedia search fallback failed: ${err}`);
      }
    }

    // Deduplicate results by URL
    const seenUrls = new Set<string>();
    const deduplicatedResults: SearchResult[] = [];
    for (const res of results) {
      if (!seenUrls.has(res.url)) {
        seenUrls.add(res.url);
        deduplicatedResults.push(res);
      }
    }

    return {
      query: cleanQuery,
      totalResults: deduplicatedResults.length,
      instantAnswer,
      results: deduplicatedResults.slice(0, limit),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * DuckDuckGo Instant Answer API (Definitions, Infoboxes)
   */
  private async fetchDuckDuckGoInstant(query: string): Promise<InstantAnswer | null> {
    try {
      const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
      const res = await fetch(url, {
        headers: { 'User-Agent': this.userAgent },
        signal: AbortSignal.timeout(5000),
      });

      if (!res.ok) return null;
      const data: any = await res.json();

      if (data.AbstractText && data.Heading) {
        return {
          heading: data.Heading,
          abstractText: data.AbstractText,
          source: data.AbstractSource || 'DuckDuckGo Knowledge',
          sourceUrl: data.AbstractURL || `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
          imageUrl: data.Image ? (data.Image.startsWith('http') ? data.Image : `https://duckduckgo.com${data.Image}`) : undefined,
          entityType: data.Entity,
        };
      }

      // Check RelatedTopics for summary
      if (Array.isArray(data.RelatedTopics) && data.RelatedTopics.length > 0) {
        const first = data.RelatedTopics[0];
        if (first.Text && first.FirstURL) {
          return {
            heading: query,
            abstractText: first.Text,
            source: 'DuckDuckGo Knowledge',
            sourceUrl: first.FirstURL,
            imageUrl: first.Icon?.URL ? `https://duckduckgo.com${first.Icon.URL}` : undefined,
          };
        }
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * DuckDuckGo HTML Lite / Organic Web Search
   */
  private async fetchDuckDuckGoOrganic(query: string, limit: number): Promise<SearchResult[]> {
    try {
      // Use DuckDuckGo HTML interface for organic links
      const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'User-Agent': this.userAgent,
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'text/html,application/xhtml+xml',
        },
        body: `q=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(7000),
      });

      if (!res.ok) return [];
      const html = await res.text();

      const results: SearchResult[] = [];
      // DuckDuckGo HTML results pattern
      // <a class="result__snippet" ...> / <h2 class="result__title"><a class="result__url" href="...">Title</a></h2>
      const resultBlocks = html.split('<div class="result results_links');

      for (let i = 1; i < resultBlocks.length && results.length < limit; i++) {
        const block = resultBlocks[i];

        // Extract title & URL
        // <a class="result__url" href="..."> or <a class="result__snippet" ...>
        const titleMatch = block.match(/<a[^>]*class="[^"]*result__url[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i) ||
                           block.match(/<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
        
        // Extract snippet
        const snippetMatch = block.match(/<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/i) ||
                             block.match(/<div[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/div>/i);

        if (titleMatch) {
          let rawUrl = titleMatch[1];
          // Unwrap DDG redirect url if present: //duckduckgo.com/l/?uddg=...
          if (rawUrl.includes('uddg=')) {
            const uddgMatch = rawUrl.match(/uddg=([^&]+)/);
            if (uddgMatch) {
              rawUrl = decodeURIComponent(uddgMatch[1]);
            }
          }

          if (rawUrl.startsWith('//')) {
            rawUrl = 'https:' + rawUrl;
          }

          // Clean title
          const title = this.stripHtmlTags(titleMatch[2]).trim();
          const snippet = snippetMatch ? this.stripHtmlTags(snippetMatch[1]).trim() : '';

          if (title && rawUrl.startsWith('http')) {
            let domain = '';
            try {
              domain = new URL(rawUrl).hostname.replace(/^www\./, '');
            } catch {
              domain = 'web';
            }

            results.push({
              title,
              url: rawUrl,
              snippet: snippet || `Information from ${domain}`,
              source: domain,
              favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
            });
          }
        }
      }

      return results;
    } catch (err: any) {
      logger.warn(`[SearchAdapter] DDG HTML parsing failed: ${err.message}`);
      return [];
    }
  }

  /**
   * Wikipedia Summary API
   */
  private async fetchWikipediaSummary(query: string): Promise<InstantAnswer | null> {
    try {
      const sanitized = query.replace(/[^\w\s]/gi, '').trim();
      const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(sanitized)}`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'NIVA-Agent/1.0 (https://github.com)' },
        signal: AbortSignal.timeout(4000),
      });

      if (!res.ok) return null;
      const data: any = await res.json();

      if (data.extract && data.title && data.type !== 'disambiguation') {
        return {
          heading: data.title,
          abstractText: data.extract,
          source: 'Wikipedia',
          sourceUrl: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(data.title)}`,
          imageUrl: data.thumbnail?.source,
          entityType: data.description,
        };
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Wikipedia OpenSearch API
   */
  private async fetchWikipediaSearch(query: string, limit: number): Promise<SearchResult[]> {
    try {
      const url = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=${limit}&namespace=0&format=json`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'NIVA-Agent/1.0 (https://github.com)' },
        signal: AbortSignal.timeout(4000),
      });

      if (!res.ok) return [];
      const data: any = await res.json();
      // Format: [query, [titles], [descriptions], [urls]]
      const titles: string[] = data[1] || [];
      const descriptions: string[] = data[2] || [];
      const urls: string[] = data[3] || [];

      const results: SearchResult[] = [];
      for (let i = 0; i < titles.length; i++) {
        if (urls[i] && titles[i]) {
          results.push({
            title: titles[i],
            url: urls[i],
            snippet: descriptions[i] || `Wikipedia article about ${titles[i]}`,
            source: 'en.wikipedia.org',
            favicon: 'https://en.wikipedia.org/static/favicon/wikipedia.ico',
          });
        }
      }

      return results;
    } catch {
      return [];
    }
  }

  private stripHtmlTags(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

export const searchAdapter = new SearchAdapter();
