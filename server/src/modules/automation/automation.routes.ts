// ============================================
// NIVA — Automation & Workflows REST API
// ============================================

import { Router, Request, Response } from 'express';
import { automationService } from './automation.service';
import { logger } from '../../utils/logger';

const router = Router();

// GET /api/v1/automation/workflows
router.get('/workflows', (_req: Request, res: Response) => {
  try {
    const workflows = automationService.getAllWorkflows();
    return res.json({
      success: true,
      data: workflows,
    });
  } catch (err: any) {
    logger.error(`[AutomationRoutes] Failed to list workflows: ${err.message}`);
    return res.status(500).json({
      success: false,
      error: { message: err.message },
    });
  }
});

// POST /api/v1/automation/workflows
router.post('/workflows', (req: Request, res: Response) => {
  try {
    const { name, description, trigger, steps, isActive } = req.body;
    if (!name || !steps || !Array.isArray(steps)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Workflow "name" and "steps" array are required' },
      });
    }

    const created = automationService.createWorkflow({
      name,
      description,
      trigger,
      steps,
      isActive,
    });

    return res.status(201).json({
      success: true,
      data: created,
    });
  } catch (err: any) {
    logger.error(`[AutomationRoutes] Failed to create workflow: ${err.message}`);
    return res.status(500).json({
      success: false,
      error: { message: err.message },
    });
  }
});

// GET /api/v1/automation/workflows/:id
router.get('/workflows/:id', (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const wf = automationService.getWorkflowById(id);
    if (!wf) {
      return res.status(404).json({
        success: false,
        error: { message: 'Workflow not found' },
      });
    }

    return res.json({
      success: true,
      data: wf,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { message: err.message },
    });
  }
});

// PUT /api/v1/automation/workflows/:id/toggle
router.put('/workflows/:id/toggle', (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { active } = req.body;
    const updated = automationService.toggleWorkflow(id, active);
    return res.json({
      success: true,
      data: updated,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { message: err.message },
    });
  }
});

// DELETE /api/v1/automation/workflows/:id
router.delete('/workflows/:id', (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const deleted = automationService.deleteWorkflow(id);
    return res.json({
      success: deleted,
      message: deleted ? 'Workflow deleted' : 'Workflow not found',
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { message: err.message },
    });
  }
});

// POST /api/v1/automation/workflows/:id/run
router.post('/workflows/:id/run', async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const execution = await automationService.runWorkflow(id, req.body.context);
    return res.json({
      success: true,
      data: execution,
    });
  } catch (err: any) {
    logger.error(`[AutomationRoutes] Failed to run workflow ${req.params.id}: ${err.message}`);
    return res.status(500).json({
      success: false,
      error: { message: err.message },
    });
  }
});

// GET /api/v1/automation/executions
router.get('/executions', (_req: Request, res: Response) => {
  try {
    const executions = automationService.getExecutions();
    return res.json({
      success: true,
      data: executions,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { message: err.message },
    });
  }
});

// POST /api/v1/automation/executions/:id/approve
router.post('/executions/:id/approve', async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const execution = await automationService.approveExecution(id);
    return res.json({
      success: true,
      data: execution,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { message: err.message },
    });
  }
});

// POST /api/v1/automation/executions/:id/cancel
router.post('/executions/:id/cancel', (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const execution = automationService.cancelExecution(id);
    return res.json({
      success: true,
      data: execution,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { message: err.message },
    });
  }
});

export default router;
