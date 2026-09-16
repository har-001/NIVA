// ============================================
// NIVA — Memory Service (Long-Term Memory CRUD + Semantic Search)
// ============================================

import { prisma } from '../../config/database';
import { generateEmbedding, cosineSimilarity } from './embedding';
import { logger } from '../../utils/logger';

export interface MemoryEntry {
  id: string;
  key: string;
  content: string;
  category: string;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemorySearchResult {
  memory: MemoryEntry;
  score: number;
}

class MemoryService {
  /**
   * Save or update a memory entry for a user.
   * Automatically generates a vector embedding for semantic search.
   */
  async saveMemory(
    userId: string,
    key: string,
    content: string,
    category: string = 'general'
  ): Promise<MemoryEntry> {
    // Generate embedding for the combined key+content
    const embeddingText = `${key}: ${content}`;
    let embedding: number[] = [];

    try {
      embedding = await generateEmbedding(embeddingText);
    } catch (err: any) {
      logger.warn(`Failed to generate embedding for memory "${key}": ${err.message}`);
    }

    const memory = await prisma.memory.upsert({
      where: {
        userId_key: { userId, key },
      },
      update: {
        content,
        category,
        embedding,
        updatedAt: new Date(),
      },
      create: {
        userId,
        key,
        content,
        category,
        embedding,
      },
    });

    logger.info(`Memory saved: "${key}" for user ${userId}`);
    return memory as MemoryEntry;
  }

  /**
   * Get all memories for a user, optionally filtered by category.
   */
  async getMemories(userId: string, category?: string): Promise<MemoryEntry[]> {
    const where: any = { userId };
    if (category) {
      where.category = category;
    }

    const memories = await prisma.memory.findMany({
      where,
      orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }],
      select: {
        id: true,
        key: true,
        content: true,
        category: true,
        isPinned: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return memories as MemoryEntry[];
  }

  /**
   * Get only pinned memories for context injection.
   */
  async getPinnedMemories(userId: string): Promise<MemoryEntry[]> {
    const memories = await prisma.memory.findMany({
      where: { userId, isPinned: true },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        key: true,
        content: true,
        category: true,
        isPinned: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return memories as MemoryEntry[];
  }

  /**
   * Semantic search across all user memories.
   * Generates embedding for query and finds top-K by cosine similarity.
   */
  async searchMemories(
    userId: string,
    query: string,
    topK: number = 5
  ): Promise<MemorySearchResult[]> {
    // Generate query embedding
    const queryEmbedding = await generateEmbedding(query);

    // Fetch all memories with embeddings
    const memories = await prisma.memory.findMany({
      where: { userId },
    });

    // Compute similarity scores
    const scored: MemorySearchResult[] = memories
      .filter((m) => m.embedding && m.embedding.length > 0)
      .map((m) => ({
        memory: {
          id: m.id,
          key: m.key,
          content: m.content,
          category: m.category,
          isPinned: m.isPinned,
          createdAt: m.createdAt,
          updatedAt: m.updatedAt,
        },
        score: cosineSimilarity(queryEmbedding, m.embedding),
      }))
      .filter((r) => r.score > 0.3) // Minimum relevance threshold
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return scored;
  }

  /**
   * Delete a memory by key or ID for a user.
   */
  async deleteMemory(userId: string, keyOrId: string): Promise<boolean> {
    try {
      const res = await prisma.memory.deleteMany({
        where: {
          userId,
          OR: [
            { key: keyOrId },
            { key: keyOrId.toLowerCase() },
            { id: keyOrId },
          ],
        },
      });
      if (res.count > 0) {
        logger.info(`Memory deleted: "${keyOrId}" for user ${userId} (${res.count} records removed)`);
        return true;
      }
      return false;
    } catch (err: any) {
      logger.error(`Failed to delete memory "${keyOrId}":`, err);
      return false;
    }
  }

  /**
   * Toggle pin status for a memory.
   */
  async togglePin(userId: string, key: string): Promise<MemoryEntry | null> {
    const existing = await prisma.memory.findUnique({
      where: { userId_key: { userId, key } },
    });

    if (!existing) return null;

    const updated = await prisma.memory.update({
      where: { userId_key: { userId, key } },
      data: { isPinned: !existing.isPinned },
      select: {
        id: true,
        key: true,
        content: true,
        category: true,
        isPinned: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updated as MemoryEntry;
  }

  /**
   * Get a memory by key.
   */
  async getMemory(userId: string, key: string): Promise<MemoryEntry | null> {
    const memory = await prisma.memory.findUnique({
      where: { userId_key: { userId, key } },
      select: {
        id: true,
        key: true,
        content: true,
        category: true,
        isPinned: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return memory as MemoryEntry | null;
  }
}

export const memoryService = new MemoryService();
