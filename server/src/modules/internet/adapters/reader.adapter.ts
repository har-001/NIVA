// ============================================
// NIVA — Live Webpage Reader & Article Extractor
// ============================================

import { WebpageContent, WebpageLink } from '../types';
import { logger } from '../../../utils/logger';

export class WebReaderAdapter {
  private userAgent =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  public async read(targetUrl: string): Promise<WebpageContent> {
    const cleanUrl = targetUrl.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      throw new Error('Invalid URL. Must start with http:// or https://');
    }

    let domain = '';
    try {
      domain = new URL(cleanUrl).hostname.replace(/^www\./, '');
    } catch {
      domain = cleanUrl;
    }

    logger.info(`[WebReaderAdapter] Fetching page content from: ${cleanUrl}`);

    const res = await fetch(cleanUrl, {
      headers: {
        'User-Agent': this.userAgent,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      throw new Error(`HTTP Error ${res.status}: ${res.statusText}`);
    }

    const html = await res.text();

    // 1. Extract Metadata
    const title = this.extractTitle(html, domain);
    const description = this.extractMeta(html, 'description') || this.extractMeta(html, 'og:description');
    const author = this.extractMeta(html, 'author') || this.extractMeta(html, 'article:author');
    const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

    // 2. Extract Links before stripping tags
    const links = this.extractLinks(html, cleanUrl);

    // 3. Clean HTML and convert to Markdown
    const contentMarkdown = this.htmlToMarkdown(html);

    // 4. Metrics
    const words = contentMarkdown.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const readingTimeMin = Math.max(1, Math.ceil(wordCount / 220));

    // Snippet for quick card previews (first 300 characters)
    const textSnippet = contentMarkdown
      .replace(/[#*`_>]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 320);

    return {
      url: cleanUrl,
      title,
      description: description || undefined,
      author: author || undefined,
      domain,
      favicon,
      contentMarkdown: contentMarkdown.slice(0, 45000), // Safe token cap
      textSnippet,
      wordCount,
      readingTimeMin,
      links: links.slice(0, 15),
      extractedAt: new Date().toISOString(),
    };
  }

  private extractTitle(html: string, fallback: string): string {
    // Try og:title first
    const ogTitle = this.extractMeta(html, 'og:title');
    if (ogTitle) return ogTitle;

    // Try <title> tag
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
      return this.cleanText(titleMatch[1]);
    }

    // Try h1 tag
    const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    if (h1Match && h1Match[1]) {
      return this.cleanText(h1Match[1]);
    }

    return fallback;
  }

  private extractMeta(html: string, nameOrProp: string): string | null {
    const regex1 = new RegExp(`<meta[^>]+(?:name|property)=["']${nameOrProp}["'][^>]+content=["']([^"']+)["']`, 'i');
    const match1 = html.match(regex1);
    if (match1) return this.cleanText(match1[1]);

    const regex2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${nameOrProp}["']`, 'i');
    const match2 = html.match(regex2);
    if (match2) return this.cleanText(match2[1]);

    return null;
  }

  private extractLinks(html: string, baseUrl: string): WebpageLink[] {
    const links: WebpageLink[] = [];
    const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let match;

    while ((match = linkRegex.exec(html)) !== null && links.length < 25) {
      let href = match[1].trim();
      const text = this.cleanText(match[2]);

      if (text.length > 2 && !href.startsWith('javascript:') && !href.startsWith('#')) {
        try {
          const resolved = new URL(href, baseUrl).toString();
          if (resolved.startsWith('http')) {
            links.push({ text, url: resolved });
          }
        } catch {
          // ignore malformed URLs
        }
      }
    }

    return links;
  }

  private htmlToMarkdown(html: string): string {
    // 1. Isolate main/article content if possible
    let bodyHtml = html;
    const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);

    if (articleMatch && articleMatch[1].length > 400) {
      bodyHtml = articleMatch[1];
    } else if (mainMatch && mainMatch[1].length > 400) {
      bodyHtml = mainMatch[1];
    }

    // 2. Strip scripts, styles, forms, iframes, nav, footer, headers
    let clean = bodyHtml
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '')
      .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
      .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '')
      .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '')
      .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '')
      .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '');

    // 3. Convert code blocks
    clean = clean.replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, (_m, code) => {
      return `\n\`\`\`\n${this.cleanText(code)}\n\`\`\`\n`;
    });

    // 4. Convert Headings
    clean = clean.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (_m, t) => `\n\n# ${this.cleanText(t)}\n\n`);
    clean = clean.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (_m, t) => `\n\n## ${this.cleanText(t)}\n\n`);
    clean = clean.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (_m, t) => `\n\n### ${this.cleanText(t)}\n\n`);
    clean = clean.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, (_m, t) => `\n\n#### ${this.cleanText(t)}\n\n`);

    // 5. Convert lists
    clean = clean.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_m, item) => `\n- ${this.cleanText(item)}`);
    clean = clean.replace(/<\/(?:ul|ol)>/gi, '\n');

    // 6. Convert blockquotes
    clean = clean.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_m, q) => `\n> ${this.cleanText(q)}\n`);

    // 7. Convert paragraphs and linebreaks
    clean = clean.replace(/<br\s*[\/]?>/gi, '\n');
    clean = clean.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_m, p) => `\n\n${this.cleanText(p)}\n\n`);

    // 8. Convert bold / italics
    clean = clean.replace(/<(?:strong|b)[^>]*>([\s\S]*?)<\/(?:strong|b)>/gi, '**$1**');
    clean = clean.replace(/<(?:em|i)[^>]*>([\s\S]*?)<\/(?:em|i)>/gi, '*$1*');

    // 9. Strip all remaining HTML tags
    clean = clean.replace(/<[^>]+>/g, '');

    // 10. Decode entities & clean whitespace
    clean = this.cleanText(clean);

    // Normalize empty lines
    return clean.replace(/\n{3,}/g, '\n\n').trim();
  }

  private cleanText(raw: string): string {
    return raw
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/&mdash;/g, '—')
      .replace(/&ndash;/g, '–')
      .replace(/&#(\d+);/g, (_m, dec) => String.fromCharCode(dec))
      .trim();
  }
}

export const webReaderAdapter = new WebReaderAdapter();
