// ============================================
// NIVA — Internet Intelligence REST Routes
// ============================================

import { Router, Request, Response } from 'express';
import { internetService } from './internet.service';
import { logger } from '../../utils/logger';

const router = Router();

// GET /api/v1/internet/search?q=...&limit=8
router.get('/search', async (req: Request, res: Response) => {
  try {
    const q = req.query.q as string;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 8;

    if (!q || !q.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Query parameter "q" is required' },
      });
    }

    const searchResponse = await internetService.search(q, limit);
    return res.json({
      success: true,
      data: searchResponse,
    });
  } catch (err: any) {
    logger.error(`[InternetRoutes] Search failed: ${err.message}`);
    return res.status(500).json({
      success: false,
      error: { message: err.message || 'Search execution failed' },
    });
  }
});

// GET /api/v1/internet/read?url=...
router.get('/read', async (req: Request, res: Response) => {
  try {
    const targetUrl = req.query.url as string;
    if (!targetUrl || !targetUrl.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Query parameter "url" is required' },
      });
    }

    const pageContent = await internetService.readWebpage(targetUrl);
    return res.json({
      success: true,
      data: pageContent,
    });
  } catch (err: any) {
    logger.error(`[InternetRoutes] Read webpage failed: ${err.message}`);
    return res.status(500).json({
      success: false,
      error: { message: err.message || 'Webpage reading failed' },
    });
  }
});

// GET /api/v1/internet/news?topic=...&limit=10
router.get('/news', async (req: Request, res: Response) => {
  try {
    const topic = (req.query.topic as string) || 'Trending';
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

    const newsResponse = await internetService.getNews(topic, limit);
    return res.json({
      success: true,
      data: newsResponse,
    });
  } catch (err: any) {
    logger.error(`[InternetRoutes] News fetch failed: ${err.message}`);
    return res.status(500).json({
      success: false,
      error: { message: err.message || 'News fetching failed' },
    });
  }
});

// GET /api/v1/internet/quick-answer?q=...
router.get('/quick-answer', async (req: Request, res: Response) => {
  try {
    const q = req.query.q as string;
    if (!q || !q.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Query parameter "q" is required' },
      });
    }

    const answer = await internetService.quickFact(q);
    return res.json({
      success: true,
      data: { query: q, answer },
    });
  } catch (err: any) {
    logger.error(`[InternetRoutes] Quick answer failed: ${err.message}`);
    return res.status(500).json({
      success: false,
      error: { message: err.message || 'Quick answer failed' },
    });
  }
});

export default router;
