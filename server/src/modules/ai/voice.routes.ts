// ============================================
// NIVA — Voice API Routes
// ============================================

import { Router, Request, Response } from 'express';
import { voiceTranscriptionService } from './voice.service';
import { logger } from '../../utils/logger';

const router = Router();

/**
 * POST /api/v1/voice/transcribe
 * Transcribe spoken audio recorded from client microphone
 */
router.post('/transcribe', async (req: Request, res: Response): Promise<void> => {
  try {
    const { audio, mimeType, language } = req.body;

    if (!audio) {
      res.status(400).json({ error: 'Audio data (base64) is required' });
      return;
    }

    const result = await voiceTranscriptionService.transcribeAudio(
      audio,
      mimeType || 'audio/webm',
      language || 'en-IN'
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    logger.error('Voice transcription route error:', err);
    res.status(500).json({ error: 'Failed to transcribe audio' });
  }
});

export default router;
