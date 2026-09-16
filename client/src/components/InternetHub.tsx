// ============================================
// NIVA — Internet Intelligence Hub Component
// ============================================

import React, { useState, useEffect } from 'react';
import styles from './InternetHub.module.css';
import { api } from '../lib/api';

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
  favicon?: string;
}

interface InstantAnswer {
  heading: string;
  abstractText: string;
  source: string;
  sourceUrl: string;
  imageUrl?: string;
}

interface WebpageContent {
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
}

interface NewsItem {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  timeAgo: string;
}

interface InternetHubProps {
  isOpen: boolean;
  onClose: () => void;
  onAskNiva?: (query: string) => void;
}

type TabType = 'search' | 'reader' | 'news';

export const InternetHub: React.FC<InternetHubProps> = ({ isOpen, onClose, onAskNiva }) => {
  const [activeTab, setActiveTab] = useState<TabType>('search');

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [instantAnswer, setInstantAnswer] = useState<InstantAnswer | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  // Reader State
  const [readerUrl, setReaderUrl] = useState('');
  const [isReading, setIsReading] = useState(false);
  const [readArticle, setReadArticle] = useState<WebpageContent | null>(null);
  const [readerError, setReaderError] = useState<string | null>(null);

  // News State
  const [newsTopic, setNewsTopic] = useState('Trending');
  const [isNewsLoading, setIsNewsLoading] = useState(false);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);

  // Topics for News
  const newsTopics = ['Trending', 'AI & Technology', 'World', 'India', 'Business', 'Science'];

  // Load default news when opening News Tab
  useEffect(() => {
    if (isOpen && activeTab === 'news' && newsItems.length === 0) {
      loadNews(newsTopic);
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  // 1. Search Execution
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = searchQuery.trim();
    if (!q || isSearching) return;

    setIsSearching(true);
    setInstantAnswer(null);
    setSearchResults([]);

    try {
      const res = await api.searchInternet(q, 8);
      if (res?.data) {
        setInstantAnswer(res.data.instantAnswer || null);
        setSearchResults(res.data.results || []);
      }
    } catch (err: any) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // 2. Reader Execution
  const handleRead = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const u = readerUrl.trim();
    if (!u || isReading) return;

    setIsReading(true);
    setReaderError(null);
    setReadArticle(null);

    try {
      const res = await api.readWebpage(u);
      if (res?.data) {
        setReadArticle(res.data);
      } else {
        setReaderError('Unable to extract content from this webpage.');
      }
    } catch (err: any) {
      setReaderError(err.message || 'Failed to fetch article');
    } finally {
      setIsReading(false);
    }
  };

  // 3. News Execution
  const loadNews = async (topic: string) => {
    setNewsTopic(topic);
    setIsNewsLoading(true);

    try {
      const res = await api.fetchNews(topic === 'Trending' ? '' : topic, 12);
      if (res?.data?.items) {
        setNewsItems(res.data.items);
      }
    } catch (err) {
      console.error('Failed to load news:', err);
    } finally {
      setIsNewsLoading(false);
    }
  };

  const handleAskInChat = (prompt: string) => {
    onClose();
    onAskNiva?.(prompt);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTitleRow}>
            <div className={styles.hubIcon}>🌐</div>
            <div>
              <h2 className={styles.title}>
                Internet Intelligence Hub
                <span className={styles.badge}>Live Knowledge</span>
              </h2>
              <p className={styles.subtitle}>Real-time web search, zero-cost reader, and verified breaking news</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} title="Close Hub">
            ✕
          </button>
        </div>

        {/* Tabs Bar */}
        <div className={styles.tabsBar}>
          <button
            className={`${styles.tabBtn} ${activeTab === 'search' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('search')}
          >
            <span>🔍</span>
            <span>Live Web Search</span>
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'reader' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('reader')}
          >
            <span>📖</span>
            <span>Web Reader & Extractor</span>
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'news' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('news')}
          >
            <span>📰</span>
            <span>Breaking News Feeds</span>
          </button>
        </div>

        {/* Content Area */}
        <div className={styles.contentArea}>
          {/* TAB 1: SEARCH */}
          {activeTab === 'search' && (
            <>
              <form onSubmit={handleSearch} className={styles.searchBarWrapper}>
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Search the live web for facts, news, documentation, or tutorials..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
                <button type="submit" className={styles.actionBtn} disabled={isSearching || !searchQuery.trim()}>
                  {isSearching ? 'Searching...' : 'Search'}
                </button>
              </form>

              {isSearching && (
                <div className={styles.loadingSpinner}>
                  <div className={styles.spinnerOrb} />
                  <span>Searching multi-engine web indexes...</span>
                </div>
              )}

              {/* Instant Answer */}
              {!isSearching && instantAnswer && (
                <div className={styles.instantCard}>
                  {instantAnswer.imageUrl && (
                    <img src={instantAnswer.imageUrl} alt={instantAnswer.heading} className={styles.instantImage} />
                  )}
                  <div className={styles.instantBody}>
                    <div className={styles.instantBadge}>
                      <span>⚡</span>
                      <span>Verified Instant Answer</span>
                    </div>
                    <h3 className={styles.instantHeading}>{instantAnswer.heading}</h3>
                    <p className={styles.instantAbstract}>{instantAnswer.abstractText}</p>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <a
                        href={instantAnswer.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.sourceLink}
                      >
                        🔗 Source: {instantAnswer.source}
                      </a>
                      <button
                        className={styles.quickAskBtn}
                        onClick={() => handleAskInChat(`Explain in detail: "${instantAnswer.heading}"`)}
                      >
                        🤖 Ask NIVA to Explain
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Organic Results */}
              {!isSearching && searchResults.length > 0 && (
                <div className={styles.resultsList}>
                  {searchResults.map((r, idx) => (
                    <div key={idx} className={styles.resultCard}>
                      <div className={styles.resultHeader}>
                        {r.favicon && <img src={r.favicon} alt="" className={styles.favicon} />}
                        <span className={styles.resultDomain}>{r.source}</span>
                      </div>
                      <a href={r.url} target="_blank" rel="noopener noreferrer" className={styles.resultTitle}>
                        {r.title}
                      </a>
                      <p className={styles.resultSnippet}>{r.snippet}</p>
                      <div className={styles.resultActions}>
                        <button
                          className={styles.quickAskBtn}
                          onClick={() => handleAskInChat(`What does this article say about "${r.title}": ${r.url}`)}
                        >
                          💬 Discuss with NIVA
                        </button>
                        <button
                          className={styles.quickAskBtn}
                          onClick={() => {
                            setReaderUrl(r.url);
                            setActiveTab('reader');
                            setTimeout(() => handleRead(), 50);
                          }}
                        >
                          📖 Read Clean Article
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!isSearching && !instantAnswer && searchResults.length === 0 && searchQuery && (
                <div className={styles.emptyState}>No results found. Try rephrasing your search query.</div>
              )}
            </>
          )}

          {/* TAB 2: WEB READER */}
          {activeTab === 'reader' && (
            <>
              <form onSubmit={handleRead} className={styles.searchBarWrapper}>
                <input
                  type="url"
                  className={styles.searchInput}
                  placeholder="Enter any article or webpage URL (e.g. https://en.wikipedia.org/wiki/...)"
                  value={readerUrl}
                  onChange={(e) => setReaderUrl(e.target.value)}
                />
                <button type="submit" className={styles.actionBtn} disabled={isReading || !readerUrl.trim()}>
                  {isReading ? 'Extracting...' : 'Read Page'}
                </button>
              </form>

              {isReading && (
                <div className={styles.loadingSpinner}>
                  <div className={styles.spinnerOrb} />
                  <span>Fetching webpage and stripping ads/scripts into clean Markdown...</span>
                </div>
              )}

              {readerError && (
                <div style={{ color: '#f87171', background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '10px' }}>
                  ⚠️ {readerError}
                </div>
              )}

              {!isReading && readArticle && (
                <>
                  <div className={styles.readerStatsBar}>
                    <div className={styles.statPill}>
                      <span>🌐</span>
                      <span>{readArticle.domain}</span>
                    </div>
                    <div className={styles.statPill}>
                      <span>⏱️</span>
                      <span>~{readArticle.readingTimeMin} min read</span>
                    </div>
                    <div className={styles.statPill}>
                      <span>📝</span>
                      <span>{readArticle.wordCount} words</span>
                    </div>
                    {readArticle.author && (
                      <div className={styles.statPill}>
                        <span>👤</span>
                        <span>{readArticle.author}</span>
                      </div>
                    )}
                    <button
                      className={styles.quickAskBtn}
                      style={{ marginLeft: 'auto' }}
                      onClick={() => handleAskInChat(`Please summarize this article: ${readArticle.url}`)}
                    >
                      🤖 Ask NIVA to Summarize
                    </button>
                  </div>

                  <div className={styles.articleCard}>
                    <h1 className={styles.articleTitle}>{readArticle.title}</h1>
                    <pre className={styles.articlePre}>{readArticle.contentMarkdown}</pre>
                  </div>
                </>
              )}

              {!isReading && !readArticle && !readerError && (
                <div className={styles.emptyState}>
                  Paste any web link above to extract ad-free, distraction-free Markdown text.
                </div>
              )}
            </>
          )}

          {/* TAB 3: BREAKING NEWS */}
          {activeTab === 'news' && (
            <>
              {/* Topics Pills */}
              <div className={styles.topicPillsRow}>
                {newsTopics.map((t) => (
                  <button
                    key={t}
                    className={`${styles.topicPill} ${newsTopic === t ? styles.topicPillActive : ''}`}
                    onClick={() => loadNews(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {isNewsLoading && (
                <div className={styles.loadingSpinner}>
                  <div className={styles.spinnerOrb} />
                  <span>Fetching verified real-time RSS news feeds...</span>
                </div>
              )}

              {!isNewsLoading && newsItems.length > 0 && (
                <div className={styles.newsGrid}>
                  {newsItems.map((item) => (
                    <div key={item.id} className={styles.newsCard}>
                      <div>
                        <div className={styles.newsMeta}>
                          <span className={styles.newsSource}>{item.source}</span>
                          <span>{item.timeAgo}</span>
                        </div>
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className={styles.newsTitle}>
                          {item.title}
                        </a>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.sourceLink}
                        >
                          🔗 Read Full
                        </a>
                        <button
                          className={styles.quickAskBtn}
                          style={{ marginLeft: 'auto' }}
                          onClick={() => handleAskInChat(`What is the latest update on this news: "${item.title}"`)}
                        >
                          🤖 Discuss
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!isNewsLoading && newsItems.length === 0 && (
                <div className={styles.emptyState}>No breaking news headlines found for this topic right now.</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
