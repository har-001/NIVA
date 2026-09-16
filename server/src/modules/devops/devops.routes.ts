// ============================================
// NIVA — DevOps & Deployment Routes
// ============================================

import { Router, Request, Response } from 'express';
import { devopsService } from './devops.service';
import { authMiddleware } from '../../middleware/auth';

const router = Router();

// Allow reading status both unauthenticated or authenticated for health checks
router.get('/status', async (req: Request, res: Response) => {
  try {
    const status = await devopsService.getStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve DevOps status'
    });
  }
});

// Trigger database backup
router.post('/backup', authMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await devopsService.createBackup();
    res.json({
      success: true,
      data: result,
      message: `Database backup created: ${result.filename} (${result.sizeKb} KB, ${result.records} records)`
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create database backup'
    });
  }
});

export default router;
