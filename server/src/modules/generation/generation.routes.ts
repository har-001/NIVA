// ============================================
// NIVA — Generation REST API Routes
// ============================================

import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../../middleware/auth';
import { generationService } from './generation.service';
import { logger } from '../../utils/logger';

const router = Router();

// All generation routes require authentication
router.use(authMiddleware as any);

/**
 * POST /api/v1/generate/image
 */
router.post('/image', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { prompt, style, aspectRatio, width, height, seed } = req.body;
    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: { message: 'prompt is required', statusCode: 400 },
      });
    }

    const result = await generationService.generateImage(req.user!.userId, {
      prompt,
      style,
      aspectRatio,
      width,
      height,
      seed,
    });

    res.json({ success: true, data: result });
  } catch (err: any) {
    logger.error('Generate image error:', err);
    res.status(500).json({ success: false, error: { message: err.message, statusCode: 500 } });
  }
});

/**
 * POST /api/v1/generate/code
 */
router.post('/code', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { prompt, language, includeTests, projectType } = req.body;
    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: { message: 'prompt is required', statusCode: 400 },
      });
    }

    const result = await generationService.generateCode(req.user!.userId, {
      prompt,
      language,
      includeTests,
      projectType,
    });

    res.json({ success: true, data: result });
  } catch (err: any) {
    logger.error('Generate code error:', err);
    res.status(500).json({ success: false, error: { message: err.message, statusCode: 500 } });
  }
});

/**
 * POST /api/v1/generate/document
 */
router.post('/document', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { topic, format, sections, depth } = req.body;
    if (!topic) {
      return res.status(400).json({
        success: false,
        error: { message: 'topic is required', statusCode: 400 },
      });
    }

    const result = await generationService.generateDocument(req.user!.userId, {
      topic,
      format,
      sections,
      depth,
    });

    res.json({ success: true, data: result });
  } catch (err: any) {
    logger.error('Generate document error:', err);
    res.status(500).json({ success: false, error: { message: err.message, statusCode: 500 } });
  }
});

/**
 * POST /api/v1/generate/audio
 */
router.post('/audio', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { text, voice, format } = req.body;
    if (!text) {
      return res.status(400).json({
        success: false,
        error: { message: 'text is required', statusCode: 400 },
      });
    }

    const result = await generationService.generateAudio(req.user!.userId, {
      text,
      voice,
      format,
    });

    res.json({ success: true, data: result });
  } catch (err: any) {
    logger.error('Generate audio error:', err);
    res.status(500).json({ success: false, error: { message: err.message, statusCode: 500 } });
  }
});

/**
 * GET /api/v1/generate/jobs
 */
router.get('/jobs', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const type = req.query.type as string | undefined;
    const jobs = await generationService.getRecentJobs(type);
    res.json({ success: true, data: jobs });
  } catch (err: any) {
    logger.error('List jobs error:', err);
    res.status(500).json({ success: false, error: { message: err.message, statusCode: 500 } });
  }
});

/**
 * GET /api/v1/generate/jobs/:id
 */
router.get('/jobs/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const job = await generationService.getJobById(String(req.params.id));
    if (!job) {
      return res.status(404).json({
        success: false,
        error: { message: 'Job not found', statusCode: 404 },
      });
    }
    res.json({ success: true, data: job });
  } catch (err: any) {
    logger.error('Get job error:', err);
    res.status(500).json({ success: false, error: { message: err.message, statusCode: 500 } });
  }
});

export default router;
