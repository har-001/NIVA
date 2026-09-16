// ============================================
// NIVA — Vision API Routes
// ============================================

import { Router, Request, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../../middleware/auth';
import { visionService } from './vision.service';
import { logger } from '../../utils/logger';

const router = Router();

/**
 * POST /api/v1/vision/analyze
 * Analyze an uploaded webcam frame or screenshot
 */
router.post('/analyze', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { image, prompt, mimeType } = req.body;

    if (!image) {
      res.status(400).json({ error: 'Image data (base64) is required' });
      return;
    }

    const result = await visionService.analyzeImage(
      image,
      mimeType || 'image/jpeg',
      prompt || 'Describe this camera frame and identify any faces or objects.'
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    logger.error('Vision route error:', err);
    res.status(500).json({ error: 'Failed to analyze visual frame' });
  }
});

export default router;
