// ============================================
// NIVA — Chat Routes
// ============================================

import { Router, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { chatService } from './chat.service';
import { authMiddleware, AuthenticatedRequest } from '../../middleware/auth';
import { launchWindowsApp } from '../tools/system.tools';

const router = Router();

// All chat routes require authentication
router.use(authMiddleware);

/**
 * POST /api/v1/chat/conversations
 * Create a new conversation
 */
router.post(
  '/conversations',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const conversation = await chatService.createConversation(
        req.user!.userId,
        req.body.title
      );
      res.status(201).json({ success: true, data: conversation });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/chat/conversations
 * Get all conversations
 */
router.get(
  '/conversations',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const conversations = await chatService.getConversations(req.user!.userId);
      res.json({ success: true, data: conversations });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/chat/conversations/:id
 * Get a conversation with messages
 */
router.get(
  '/conversations/:id',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const conversationId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const conversation = await chatService.getConversation(
        req.user!.userId,
        conversationId
      );
      res.json({ success: true, data: conversation });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/v1/chat/conversations/:id
 * Update conversation title
 */
router.patch(
  '/conversations/:id',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const conversationId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const conversation = await chatService.updateTitle(
        req.user!.userId,
        conversationId,
        req.body.title
      );
      res.json({ success: true, data: conversation });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/v1/chat/conversations/:id
 * Delete a conversation (soft delete)
 */
router.delete(
  '/conversations/:id',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const conversationId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await chatService.deleteConversation(req.user!.userId, conversationId);
      res.json({ success: true, data: { message: 'Conversation deleted' } });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/chat/open-ide
 * Save code snippet and immediately launch in VS Code or Notepad on laptop
 */
router.post(
  '/open-ide',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { code, language, ide = 'vscode', fileName } = req.body;
      if (!code) {
        return res.status(400).json({ success: false, error: 'Code content is required' });
      }

      const workspaceDir = path.join(process.cwd(), 'niva_workspace');
      if (!fs.existsSync(workspaceDir)) {
        fs.mkdirSync(workspaceDir, { recursive: true });
      }

      const extMap: Record<string, string> = {
        python: 'py',
        typescript: 'ts',
        javascript: 'js',
        html: 'html',
        css: 'css',
        rust: 'rs',
        sql: 'sql',
        bash: 'sh',
      };
      const ext = extMap[String(language).toLowerCase()] || 'py';
      const actualFileName = fileName || `snippet_${Date.now()}.${ext}`;
      const filePath = path.join(workspaceDir, actualFileName);

      fs.writeFileSync(filePath, code, 'utf-8');

      const launchResult = await launchWindowsApp(ide, filePath);
      res.json({
        success: launchResult.success,
        filePath,
        message: launchResult.message,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/chat/open-app
 * Launch an app or URL on user's laptop directly from chat cards
 */
router.post(
  '/open-app',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { app, argument } = req.body;
      if (!app) {
        return res.status(400).json({ success: false, error: 'App name is required' });
      }
      const launchResult = await launchWindowsApp(app, argument);
      res.json({
        success: launchResult.success,
        message: launchResult.message,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
