// ============================================
// NIVA — Plugin REST API Routes
// ============================================

import { Router, Request, Response } from 'express';
import { pluginService } from './plugin.service';
import { logger } from '../../utils/logger';

const router = Router();

// GET /api/v1/plugins - List all plugins
router.get('/', (_req: Request, res: Response) => {
  try {
    const plugins = pluginService.getAllPlugins();
    return res.json({
      success: true,
      data: plugins,
    });
  } catch (err: any) {
    logger.error(`[PluginRoutes] Error listing plugins: ${err.message}`);
    return res.status(500).json({
      success: false,
      error: { message: err.message },
    });
  }
});

// GET /api/v1/plugins/:id - Get specific plugin
router.get('/:id', (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const plugin = pluginService.getPlugin(id);
    if (!plugin) {
      return res.status(404).json({
        success: false,
        error: { message: `Plugin "${id}" not found` },
      });
    }

    return res.json({
      success: true,
      data: plugin,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { message: err.message },
    });
  }
});

// PUT /api/v1/plugins/:id/toggle - Toggle plugin active/disabled
router.put('/:id/toggle', async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { active } = req.body;
    const updated = await pluginService.togglePlugin(id, active);
    return res.json({
      success: true,
      data: updated,
    });
  } catch (err: any) {
    logger.error(`[PluginRoutes] Failed to toggle plugin: ${err.message}`);
    return res.status(500).json({
      success: false,
      error: { message: err.message },
    });
  }
});

// PUT /api/v1/plugins/:id/config - Update plugin configuration
router.put('/:id/config', async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { config } = req.body;
    const updated = await pluginService.updateConfig(id, config || {});
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

// POST /api/v1/plugins/install - Install a new custom plugin
router.post('/install', async (req: Request, res: Response) => {
  try {
    const { manifest, config } = req.body;
    if (!manifest) {
      return res.status(400).json({
        success: false,
        error: { message: 'Missing plugin manifest' },
      });
    }

    const installed = await pluginService.installPlugin(manifest, config);
    return res.status(201).json({
      success: true,
      data: installed,
    });
  } catch (err: any) {
    logger.error(`[PluginRoutes] Install failed: ${err.message}`);
    return res.status(500).json({
      success: false,
      error: { message: err.message },
    });
  }
});

// DELETE /api/v1/plugins/:id - Uninstall plugin
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const deleted = await pluginService.deletePlugin(id);
    return res.json({
      success: deleted,
      message: deleted ? 'Plugin uninstalled successfully' : 'Plugin not found',
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { message: err.message },
    });
  }
});

export default router;
