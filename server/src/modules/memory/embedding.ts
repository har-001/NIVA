// ============================================
// NIVA — Embedding Utility (@google/genai text-embedding-004)
// ============================================

import { GoogleGenAI } from '@google/genai';
import { config } from '../../config';
import { logger } from '../../utils/logger';

const EMBEDDING_MODEL = 'text-embedding-004';
const EMBEDDING_DIMENSION = 768;

let genAI: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI | null {
  if (!config.geminiApiKey) return null;
  if (!genAI) {
    genAI = new GoogleGenAI({ apiKey: config.geminiApiKey });
  }
  return genAI;
}

/**
 * Generate a vector embedding for a text string using Gemini's text-embedding-004.
 * Falls back to TF-IDF keyword vector if no API key is configured.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const ai = getGenAI();

  if (ai) {
    try {
      const result = await ai.models.embedContent({
        model: EMBEDDING_MODEL,
        contents: text,
      });
      const embedding = result.embeddings?.[0]?.values;
      if (embedding && embedding.length > 0) {
        return embedding;
      }
      logger.warn('Empty embedding returned, using TF-IDF fallback');
      return tfidfFallback(text);
    } catch (err: any) {
      logger.warn(`Gemini embedding failed, using TF-IDF fallback: ${err.message}`);
      return tfidfFallback(text);
    }
  }

  // Fallback: deterministic keyword-based pseudo-embedding
  return tfidfFallback(text);
}

/**
 * Generate embeddings for multiple texts in a batch.
 */
export async function generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  const ai = getGenAI();

  if (ai && texts.length > 0) {
    try {
      const results: number[][] = [];

      // Process in batches of 100
      for (let i = 0; i < texts.length; i += 100) {
        const batch = texts.slice(i, i + 100);

        // Use individual calls since batch API may differ by SDK version
        for (const text of batch) {
          const result = await ai.models.embedContent({
            model: EMBEDDING_MODEL,
            contents: text,
          });
          const embedding = result.embeddings?.[0]?.values;
          results.push(embedding && embedding.length > 0 ? embedding : tfidfFallback(text));
        }
      }

      return results;
    } catch (err: any) {
      logger.warn(`Batch embedding failed, using TF-IDF fallback: ${err.message}`);
      return texts.map((t) => tfidfFallback(t));
    }
  }

  return texts.map((t) => tfidfFallback(t));
}

/**
 * Compute cosine similarity between two vectors.
 * Returns a value between -1 and 1 (1 = identical, 0 = orthogonal).
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  if (magnitude === 0) return 0;

  return dotProduct / magnitude;
}

/**
 * TF-IDF-style fallback pseudo-embedding.
 * Creates a deterministic 768-dim vector from text keywords.
 * Not as good as neural embeddings but works offline.
 */
function tfidfFallback(text: string): number[] {
  const vector = new Array(EMBEDDING_DIMENSION).fill(0);
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);

  for (const word of words) {
    // Hash word to a set of indices
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = ((hash << 5) - hash + word.charCodeAt(i)) | 0;
    }

    // Distribute word signal across multiple dimensions
    const idx1 = Math.abs(hash) % EMBEDDING_DIMENSION;
    const idx2 = Math.abs(hash * 31) % EMBEDDING_DIMENSION;
    const idx3 = Math.abs(hash * 37) % EMBEDDING_DIMENSION;

    vector[idx1] += 1;
    vector[idx2] += 0.5;
    vector[idx3] += 0.25;
  }

  // Normalize the vector
  const norm = Math.sqrt(vector.reduce((sum: number, v: number) => sum + v * v, 0));
  if (norm > 0) {
    for (let i = 0; i < vector.length; i++) {
      vector[i] /= norm;
    }
  }

  return vector;
}
