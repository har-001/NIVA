// ============================================
// NIVA — Multi-Agent REST API Routes
// ============================================

import { Router, Request, Response } from 'express';
import { agentRegistry } from './agent.registry';
import { orchestratorService } from './orchestrator.service';
import { authMiddleware } from '../../middleware/auth';
import { logger } from '../../utils/logger';

const router = Router();

// Public/Semi-public: View available specialized agent profiles
router.get('/roles', (req: Request, res: Response) => {
  try {
    const roles = agentRegistry.getAllProfiles();
    res.json({
      success: true,
      data: roles,
      count: roles.length,
    });
  } catch (err: any) {
    logger.error(`Failed to get agent roles: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Plan a multi-agent mission
router.post('/plan', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { goal } = req.body;
    if (!goal || typeof goal !== 'string') {
      return res.status(400).json({ success: false, error: 'Field "goal" is required.' });
    }

    const userId = (req as any).user?.id;
    const plan = await orchestratorService.planMission(goal, userId);

    res.json({
      success: true,
      data: plan,
      message: `Lead Orchestrator planned mission with ${plan.subtasks.length} subtasks.`,
    });
  } catch (err: any) {
    logger.error(`Failed to plan mission: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Execute a planned mission
router.post('/execute', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { missionId } = req.body;
    if (!missionId) {
      return res.status(400).json({ success: false, error: 'Field "missionId" is required.' });
    }

    const executed = await orchestratorService.executeMission(missionId);

    res.json({
      success: true,
      data: executed,
      message: `Mission completed in ${executed.totalDurationMs}ms across ${executed.subtasks.length} specialized agents.`,
    });
  } catch (err: any) {
    logger.error(`Failed to execute mission: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Direct plan + execute
router.post('/direct', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { goal } = req.body;
    if (!goal || typeof goal !== 'string') {
      return res.status(400).json({ success: false, error: 'Field "goal" is required.' });
    }

    const userId = (req as any).user?.id;
    const result = await orchestratorService.executeDirect(goal, userId);

    res.json({
      success: true,
      data: result,
      message: 'Multi-agent mission completed successfully.',
    });
  } catch (err: any) {
    logger.error(`Failed to execute direct mission: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get mission history
router.get('/missions', authMiddleware, (req: Request, res: Response) => {
  try {
    const missions = orchestratorService.getAllMissions();
    res.json({
      success: true,
      data: missions,
      count: missions.length,
    });
  } catch (err: any) {
    logger.error(`Failed to list missions: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get specific mission
router.get('/missions/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const mission = orchestratorService.getMission(id);
    if (!mission) {
      return res.status(404).json({ success: false, error: 'Mission not found.' });
    }
    res.json({ success: true, data: mission });
  } catch (err: any) {
    logger.error(`Failed to get mission: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
