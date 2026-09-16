'use client';

// ============================================
// NIVA — Memory & Document RAG Knowledge Panel
// ============================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../lib/api';
import styles from './MemoryPanel.module.css';

interface MemoryItem {
  id: string;
  key: string;
  content: string;
  category: string;
  isPinned: boolean;
  confidence: number;
  createdAt: string;
  score?: number;
}

interface DocumentItem {
  id: string;
  filename: string;
  mimeType: string;
  fileSize: number;
  chunkCount: number;
  createdAt: string;
}

interface DocSearchResult {
  chunkText: string;
  similarity: number;
  metadata?: any;
}

interface MemoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'preference', label: 'Preferences' },
  { id: 'fact', label: 'Facts' },
  { id: 'instruction', label: 'Instructions' },
  { id: 'general', label: 'General' },
];

export function MemoryPanel({ isOpen, onClose }: MemoryPanelProps) {
  const [activeTab, setActiveTab] = useState<'memories' | 'documents'>('memories');

  // Memories State
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [memorySearch, setMemorySearch] = useState<string>('');
  const [loadingMemories, setLoadingMemories] = useState<boolean>(false);
  const [newKey, setNewKey] = useState<string>('');
  const [newContent, setNewContent] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('general');
  const [savingMemory, setSavingMemory] = useState<boolean>(false);

  // Documents State
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loadingDocs, setLoadingDocs] = useState<boolean>(false);
  const [uploadingDoc, setUploadingDoc] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [docSearch, setDocSearch] = useState<string>('');
  const [docResults, setDocResults] = useState<DocSearchResult[] | null>(null);
  const [searchingDocs, setSearchingDocs] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load Memories
  const loadMemories = useCallback(async (category?: string) => {
    setLoadingMemories(true);
    try {
      const catParam = category && category !== 'all' ? category : undefined;
      const res = await api.getMemories(catParam);
      setMemories(res.data || []);
    } catch (err) {
      console.error('Failed to load memories:', err);
    } finally {
      setLoadingMemories(false);
    }
  }, []);

  // Load Documents
  const loadDocuments = useCallback(async () => {
    setLoadingDocs(true);
    try {
      const res = await api.getDocuments();
      setDocuments(res.data || []);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoadingDocs(false);
    }
  }, []);

  // Fetch when opened
  useEffect(() => {
    if (isOpen) {
      if (activeTab === 'memories') {
        loadMemories(selectedCategory);
      } else {
        loadDocuments();
      }
    }
  }, [isOpen, activeTab, selectedCategory, loadMemories, loadDocuments]);

  // Handle semantic memory search
  const handleMemorySearch = async (query: string) => {
    setMemorySearch(query);
    if (!query.trim()) {
      loadMemories(selectedCategory);
      return;
    }
    try {
      const res = await api.searchMemories(query, 8);
      const results = (res.data as any[]) || [];
      const mapped = results.map((r: any) => ({
        ...r.memory,
        score: Math.round(r.similarity * 100),
      }));
      setMemories(mapped);
    } catch (err) {
      console.error('Search memories error:', err);
    }
  };

  // Add new memory
  const handleSaveMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || !newContent.trim() || savingMemory) return;

    setSavingMemory(true);
    try {
      await api.saveMemory(newKey.trim().toLowerCase(), newContent.trim(), newCategory);
      setNewKey('');
      setNewContent('');
      await loadMemories(selectedCategory);
    } catch (err) {
      console.error('Failed to save memory:', err);
    } finally {
      setSavingMemory(false);
    }
  };

  const [confirmDeleteKey, setConfirmDeleteKey] = useState<string | null>(null);

  // Toggle pin
  const handleTogglePin = async (key: string) => {
    try {
      await api.togglePinMemory(key);
      setMemories((prev) =>
        prev.map((m) => (m.key === key ? { ...m, isPinned: !m.isPinned } : m))
      );
    } catch (err) {
      console.error('Failed to toggle pin:', err);
    }
  };

  // Delete memory (smooth, non-blocking in-UI confirmation)
  const executeDeleteMemory = async (key: string, id?: string) => {
    setConfirmDeleteKey(null);
    // Optimistic UI update
    setMemories((prev) => prev.filter((m) => m.key !== key && (!id || m.id !== id)));
    try {
      await api.deleteMemory(key);
    } catch (err) {
      console.warn('Delete by key failed, attempting fallback by ID...', err);
      if (id) {
        try {
          await api.deleteMemory(id);
        } catch (e) {
          console.error('Failed to delete memory:', e);
          // Reload memories on hard failure
          loadMemories(selectedCategory);
        }
      }
    }
  };

  // Upload document
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setUploadingDoc(true);
    setUploadError(null);
    try {
      await api.uploadDocument(file);
      await loadDocuments();
    } catch (err: any) {
      console.error('Upload document error:', err);
      setUploadError(err.message || 'Failed to upload and index document');
    } finally {
      setUploadingDoc(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Search documents
  const handleDocSearch = async (query: string) => {
    setDocSearch(query);
    if (!query.trim()) {
      setDocResults(null);
      return;
    }
    setSearchingDocs(true);
    try {
      const res = await api.searchDocuments(query, 5);
      setDocResults((res.data as any[]) || []);
    } catch (err) {
      console.error('Doc search error:', err);
    } finally {
      setSearchingDocs(false);
    }
  };

  // Delete document
  const handleDeleteDocument = async (id: string, name: string) => {
    if (!confirm(`Delete document "${name}" and all of its indexed chunks?`)) return;
    try {
      await api.deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      if (docResults) setDocResults(null);
    } catch (err) {
      console.error('Failed to delete document:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <div className={styles.headerIcon}>🧠</div>
            <div className={styles.titleText}>
              <span className={styles.title}>Memory &amp; Knowledge Base</span>
              <span className={styles.subtitle}>Semantic Long-Term Memory &amp; Document RAG</span>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} title="Close Panel">
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className={styles.tabNav}>
          <button
            className={`${styles.tabBtn} ${activeTab === 'memories' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('memories')}
          >
            <span>🧠</span>
            <span>Memories ({memories.length})</span>
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'documents' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('documents')}
          >
            <span>📄</span>
            <span>Documents ({documents.length})</span>
          </button>
        </div>

        {/* Content Area */}
        <div className={styles.contentArea}>
          {activeTab === 'memories' ? (
            <>
              {/* Semantic Search Bar */}
              <div className={styles.searchBar}>
                <span className={styles.searchIcon}>🔍</span>
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Semantic search across your memories..."
                  value={memorySearch}
                  onChange={(e) => handleMemorySearch(e.target.value)}
                />
              </div>

              {/* Category Pills */}
              <div className={styles.categoryPills}>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    className={`${styles.categoryPill} ${
                      selectedCategory === cat.id ? styles.categoryPillActive : ''
                    }`}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setMemorySearch('');
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Add New Memory Form */}
              <form className={styles.addBox} onSubmit={handleSaveMemory}>
                <div className={styles.addBoxHeader}>
                  <span>⚡ Add Permanent Memory / Fact</span>
                </div>
                <div className={styles.addInputsRow}>
                  <input
                    type="text"
                    className={styles.textInput}
                    placeholder="Key (e.g. user_city, coding_lang)"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    required
                  />
                  <select
                    className={styles.selectInput}
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                  >
                    <option value="general">General</option>
                    <option value="preference">Preference</option>
                    <option value="fact">Fact</option>
                    <option value="instruction">Instruction</option>
                  </select>
                </div>
                <textarea
                  className={styles.textareaInput}
                  placeholder="Content (e.g. 'I prefer writing clean TypeScript with dark theme.')"
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  className={styles.saveBtn}
                  disabled={savingMemory || !newKey.trim() || !newContent.trim()}
                >
                  {savingMemory ? <span className={styles.spinner}></span> : '💾 Remember'}
                </button>
              </form>

              {/* Memories List */}
              <div className={styles.cardList}>
                {loadingMemories ? (
                  <div className={styles.emptyState}>
                    <div className={styles.spinner}></div>
                    <span className={styles.emptyTitle}>Loading memories...</span>
                  </div>
                ) : memories.length === 0 ? (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>🧠</div>
                    <div className={styles.emptyTitle}>No memories found</div>
                    <div className={styles.emptyText}>
                      Ask NIVA to remember something or add your first custom fact above!
                    </div>
                  </div>
                ) : (
                  memories.map((mem) => (
                    <div
                      key={mem.id || mem.key}
                      className={`${styles.memoryCard} ${mem.isPinned ? styles.memoryCardPinned : ''}`}
                    >
                      <div className={styles.cardTop}>
                        <div className={styles.cardBadges}>
                          <span className={styles.keyBadge}>{mem.key}</span>
                          <span className={styles.catBadge}>{mem.category}</span>
                          {mem.isPinned && <span className={styles.pinnedBadge}>📌 Pinned</span>}
                          {mem.score !== undefined && (
                            <span className={styles.similarityScore}>🎯 {mem.score}% match</span>
                          )}
                        </div>
                        <div className={styles.cardActions}>
                          <button
                            className={`${styles.cardIconBtn} ${mem.isPinned ? styles.pinActive : ''}`}
                            onClick={() => handleTogglePin(mem.key)}
                            title={mem.isPinned ? 'Unpin from Prompt' : 'Pin to Prompt (Always Active)'}
                          >
                            📌
                          </button>
                          {confirmDeleteKey === mem.key ? (
                            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                              <button
                                className={styles.cardIconBtn}
                                style={{
                                  color: '#f87171',
                                  fontWeight: 700,
                                  fontSize: '0.72rem',
                                  width: 'auto',
                                  padding: '2px 8px',
                                  background: 'rgba(239, 68, 68, 0.2)',
                                  border: '1px solid rgba(239, 68, 68, 0.4)',
                                }}
                                onClick={() => executeDeleteMemory(mem.key, mem.id)}
                                title="Click to confirm deletion"
                              >
                                Delete?
                              </button>
                              <button
                                className={styles.cardIconBtn}
                                onClick={() => setConfirmDeleteKey(null)}
                                title="Cancel"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              className={styles.cardIconBtn}
                              onClick={() => setConfirmDeleteKey(mem.key)}
                              title="Forget Memory"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </div>
                      <div className={styles.cardContent}>{mem.content}</div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <>
              {/* Document Drag & Drop Upload Zone */}
              <div
                className={styles.uploadZone}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className={styles.fileInputHidden}
                  accept=".txt,.md,.pdf,.csv,.json"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                />
                <div className={styles.uploadIcon}>
                  {uploadingDoc ? <div className={styles.spinner}></div> : '📤'}
                </div>
                <div className={styles.uploadTitle}>
                  {uploadingDoc ? 'Processing Document & Vectorizing...' : 'Upload Knowledge Document'}
                </div>
                <div className={styles.uploadSubtitle}>
                  Supports PDF, Markdown, TXT, CSV, JSON (Up to 10MB)
                </div>
              </div>

              {uploadError && (
                <div style={{ color: '#f87171', fontSize: '0.8rem', padding: '6px 12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>
                  ⚠️ {uploadError}
                </div>
              )}

              {/* RAG Knowledge Search Tester */}
              <div className={styles.searchBar}>
                <span className={styles.searchIcon}>🔍</span>
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Test query across all documents (RAG)..."
                  value={docSearch}
                  onChange={(e) => handleDocSearch(e.target.value)}
                />
              </div>

              {/* Document Search Results if searching */}
              {docResults && docResults.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#38bdf8' }}>
                    🔍 Top Matching Chunks ({docResults.length})
                  </span>
                  {docResults.map((r, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: 'rgba(14, 165, 233, 0.08)',
                        border: '1px solid rgba(14, 165, 233, 0.25)',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        fontSize: '0.82rem',
                        color: '#f1f5f9',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.7rem', color: '#94a3b8' }}>
                        <span>Chunk #{idx + 1}</span>
                        <span style={{ color: '#10b981', fontWeight: 600 }}>{Math.round(r.similarity * 100)}% match</span>
                      </div>
                      <div>{r.chunkText}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Uploaded Documents List */}
              <div className={styles.cardList}>
                {loadingDocs ? (
                  <div className={styles.emptyState}>
                    <div className={styles.spinner}></div>
                    <span className={styles.emptyTitle}>Loading documents...</span>
                  </div>
                ) : documents.length === 0 ? (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>📄</div>
                    <div className={styles.emptyTitle}>No documents uploaded</div>
                    <div className={styles.emptyText}>
                      Upload textbooks, manuals, notes or code docs to grant NIVA deep knowledge!
                    </div>
                  </div>
                ) : (
                  documents.map((doc) => (
                    <div key={doc.id} className={styles.docCard}>
                      <div className={styles.docInfo}>
                        <div className={styles.docIcon}>
                          {doc.filename.endsWith('.pdf') ? '📕' : doc.filename.endsWith('.md') ? '📝' : '📄'}
                        </div>
                        <div className={styles.docMeta}>
                          <span className={styles.docName} title={doc.filename}>
                            {doc.filename}
                          </span>
                          <span className={styles.docSub}>
                            <span>{(doc.fileSize / 1024).toFixed(1)} KB</span>
                            <span>•</span>
                            <span>{doc.chunkCount} vector chunks</span>
                          </span>
                        </div>
                      </div>
                      <button
                        className={styles.cardIconBtn}
                        onClick={() => handleDeleteDocument(doc.id, doc.filename)}
                        title="Delete Document"
                      >
                        🗑️
                      </button>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
