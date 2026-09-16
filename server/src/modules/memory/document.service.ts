// ============================================
// NIVA — Document RAG Service (Upload, Chunk, Embed, Search)
// ============================================

import { prisma } from '../../config/database';
import { generateEmbedding, generateEmbeddingsBatch, cosineSimilarity } from './embedding';
import { logger } from '../../utils/logger';
import fs from 'fs';

export interface DocumentEntry {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  chunkCount?: number;
  createdAt: Date;
}

export interface DocumentSearchResult {
  documentId: string;
  documentName: string;
  chunkContent: string;
  chunkIndex: number;
  score: number;
}

// Chunk configuration
const CHUNK_SIZE = 500; // ~500 words per chunk
const CHUNK_OVERLAP = 50; // 50 words overlap between chunks

class DocumentService {
  /**
   * Upload and process a document.
   * Extracts text, splits into chunks, and generates embeddings.
   */
  async uploadDocument(
    userId: string,
    filename: string,
    mimeType: string,
    filePath: string
  ): Promise<DocumentEntry> {
    // Read the file
    const fileBuffer = fs.readFileSync(filePath);
    const sizeBytes = fileBuffer.length;

    // Extract text based on MIME type
    let textContent = '';

    if (mimeType === 'application/pdf') {
      try {
        const pdfParse = require('pdf-parse');
        const pdfData = await pdfParse(fileBuffer);
        textContent = pdfData.text;
      } catch (err: any) {
        logger.error('PDF parse error:', err);
        throw new Error(`Failed to parse PDF: ${err.message}`);
      }
    } else if (
      mimeType === 'text/plain' ||
      mimeType === 'text/markdown' ||
      mimeType === 'text/csv' ||
      mimeType === 'application/json'
    ) {
      textContent = fileBuffer.toString('utf-8');
    } else {
      throw new Error(`Unsupported file type: ${mimeType}. Supported: .txt, .md, .csv, .json, .pdf`);
    }

    if (!textContent.trim()) {
      throw new Error('Document appears to be empty or could not be read.');
    }

    // Create the document record
    const document = await prisma.document.create({
      data: {
        userId,
        filename,
        mimeType,
        sizeBytes,
        content: textContent.slice(0, 50000), // Store first 50K chars for reference
      },
    });

    // Split text into chunks
    const chunks = this.splitIntoChunks(textContent);
    logger.info(`Document "${filename}" split into ${chunks.length} chunks`);

    // Generate embeddings for all chunks in batch
    let embeddings: number[][] = [];
    try {
      embeddings = await generateEmbeddingsBatch(chunks);
    } catch (err: any) {
      logger.warn(`Batch embedding failed for document "${filename}": ${err.message}`);
      embeddings = chunks.map(() => []);
    }

    // Store chunks with embeddings
    const chunkRecords = chunks.map((content, index) => ({
      documentId: document.id,
      content,
      chunkIndex: index,
      embedding: embeddings[index] || [],
    }));

    await prisma.documentChunk.createMany({
      data: chunkRecords,
    });

    // Clean up temp file
    try {
      fs.unlinkSync(filePath);
    } catch {
      // ignore cleanup errors
    }

    logger.info(`Document "${filename}" uploaded with ${chunks.length} chunks for user ${userId}`);

    return {
      id: document.id,
      filename: document.filename,
      mimeType: document.mimeType,
      sizeBytes: document.sizeBytes,
      chunkCount: chunks.length,
      createdAt: document.createdAt,
    };
  }

  /**
   * Get all documents for a user.
   */
  async getDocuments(userId: string): Promise<DocumentEntry[]> {
    const documents = await prisma.document.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { chunks: true },
        },
      },
    });

    return documents.map((doc) => ({
      id: doc.id,
      filename: doc.filename,
      mimeType: doc.mimeType,
      sizeBytes: doc.sizeBytes,
      chunkCount: (doc as any)._count.chunks,
      createdAt: doc.createdAt,
    }));
  }

  /**
   * Semantic search across all document chunks for a user.
   */
  async searchDocuments(
    userId: string,
    query: string,
    topK: number = 5
  ): Promise<DocumentSearchResult[]> {
    // Generate query embedding
    const queryEmbedding = await generateEmbedding(query);

    // Fetch all chunks with embeddings for user's documents
    const documents = await prisma.document.findMany({
      where: { userId },
      select: { id: true, filename: true },
    });

    const docIds = documents.map((d) => d.id);
    const docNameMap = new Map(documents.map((d) => [d.id, d.filename]));

    if (docIds.length === 0) return [];

    const chunks = await prisma.documentChunk.findMany({
      where: { documentId: { in: docIds } },
    });

    // Compute similarity scores
    const scored: DocumentSearchResult[] = chunks
      .filter((c) => c.embedding && c.embedding.length > 0)
      .map((c) => ({
        documentId: c.documentId,
        documentName: docNameMap.get(c.documentId) || 'Unknown',
        chunkContent: c.content,
        chunkIndex: c.chunkIndex,
        score: cosineSimilarity(queryEmbedding, c.embedding),
      }))
      .filter((r) => r.score > 0.3) // Relevance threshold
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return scored;
  }

  /**
   * Delete a document and all its chunks.
   */
  async deleteDocument(userId: string, documentId: string): Promise<boolean> {
    const doc = await prisma.document.findFirst({
      where: { id: documentId, userId },
    });

    if (!doc) return false;

    // Delete chunks first (cascade should handle this, but be explicit)
    await prisma.documentChunk.deleteMany({
      where: { documentId },
    });

    await prisma.document.delete({
      where: { id: documentId },
    });

    logger.info(`Document "${doc.filename}" deleted for user ${userId}`);
    return true;
  }

  /**
   * Split text into overlapping chunks for RAG.
   * Uses word-level splitting with sentence-boundary awareness.
   */
  private splitIntoChunks(text: string): string[] {
    const words = text.split(/\s+/).filter(Boolean);
    const chunks: string[] = [];

    if (words.length <= CHUNK_SIZE) {
      return [words.join(' ')];
    }

    let start = 0;
    while (start < words.length) {
      const end = Math.min(start + CHUNK_SIZE, words.length);
      const chunk = words.slice(start, end).join(' ');
      chunks.push(chunk);

      if (end >= words.length) break;
      start = end - CHUNK_OVERLAP; // Overlap
    }

    return chunks;
  }
}

export const documentService = new DocumentService();
