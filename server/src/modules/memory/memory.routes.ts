// ============================================
// NIVA — Memory REST API Routes
// ============================================

import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../../middleware/auth';
import { memoryService } from './memory.service';
import { logger } from '../../utils/logger';

const router = Router();

// All memory routes require authentication
router.use(authMiddleware as any);

/**
 * GET /api/v1/memory
 * List all memories for the authenticated user.
 * Query param: ?category=preference|fact|general|instruction
 */
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const category = req.query.category as string | undefined;
    const memories = await memoryService.getMemories(req.user!.userId, category);
    res.json({ success: true, data: memories });
  } catch (err: any) {
    logger.error('Memory list error:', err);
    res.status(500).json({ success: false, error: { message: err.message, statusCode: 500 } });
  }
});

/**
 * POST /api/v1/memory
 * Save or upsert a memory.
 * Body: { key: string, content: string, category?: string }
 */
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { key, content, category } = req.body;

    if (!key || !content) {
      return res.status(400).json({
        success: false,
        error: { message: 'key and content are required', statusCode: 400 },
      });
    }

    const memory = await memoryService.saveMemory(
      req.user!.userId,
      key,
      content,
      category || 'general'
    );

    res.json({ success: true, data: memory });
  } catch (err: any) {
    logger.error('Memory save error:', err);
    res.status(500).json({ success: false, error: { message: err.message, statusCode: 500 } });
  }
});

/**
 * POST /api/v1/memory/search
 * Semantic search across memories.
 * Body: { query: string, topK?: number }
 */
router.post('/search', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { query, topK } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: { message: 'query is required', statusCode: 400 },
      });
    }

    const results = await memoryService.searchMemories(
      req.user!.userId,
      query,
      topK || 5
    );

    res.json({ success: true, data: results });
  } catch (err: any) {
    logger.error('Memory search error:', err);
    res.status(500).json({ success: false, error: { message: err.message, statusCode: 500 } });
  }
});

/**
 * PATCH /api/v1/memory/:key/pin
 * Toggle pin status for a memory.
 */
router.patch('/:key/pin', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const key = String(req.params.key);
    const memory = await memoryService.togglePin(req.user!.userId, key);

    if (!memory) {
      return res.status(404).json({
        success: false,
        error: { message: 'Memory not found', statusCode: 404 },
      });
    }

    res.json({ success: true, data: memory });
  } catch (err: any) {
    logger.error('Memory pin error:', err);
    res.status(500).json({ success: false, error: { message: err.message, statusCode: 500 } });
  }
});

/**
 * DELETE /api/v1/memory/:key
 * Delete a memory by key.
 */
router.delete('/:key', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const key = String(req.params.key);
    const deleted = await memoryService.deleteMemory(req.user!.userId, key);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: { message: 'Memory not found', statusCode: 404 },
      });
    }

    res.json({ success: true, data: { message: 'Memory deleted' } });
  } catch (err: any) {
    logger.error('Memory delete error:', err);
    res.status(500).json({ success: false, error: { message: err.message, statusCode: 500 } });
  }
});

export default router;
