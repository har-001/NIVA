// ============================================
// NIVA — Document REST API Routes
// ============================================

import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authMiddleware, AuthenticatedRequest } from '../../middleware/auth';
import { documentService } from './document.service';
import { logger } from '../../utils/logger';

const router = Router();

// Configure multer for document uploads
const uploadsDir = path.join(process.cwd(), 'uploads', 'documents');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e6)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      'text/plain',
      'text/markdown',
      'text/csv',
      'application/json',
      'application/pdf',
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: .txt, .md, .csv, .json, .pdf`));
    }
  },
});

// All document routes require authentication
router.use(authMiddleware as any);

/**
 * GET /api/v1/documents
 * List all documents for the authenticated user.
 */
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const documents = await documentService.getDocuments(req.user!.userId);
    res.json({ success: true, data: documents });
  } catch (err: any) {
    logger.error('Document list error:', err);
    res.status(500).json({ success: false, error: { message: err.message, statusCode: 500 } });
  }
});

/**
 * POST /api/v1/documents/upload
 * Upload a document for RAG processing.
 */
router.post(
  '/upload',
  upload.single('file'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: { message: 'No file uploaded', statusCode: 400 },
        });
      }

      const document = await documentService.uploadDocument(
        req.user!.userId,
        req.file.originalname,
        req.file.mimetype,
        req.file.path
      );

      res.json({ success: true, data: document });
    } catch (err: any) {
      // Clean up file on error
      if (req.file?.path) {
        try { fs.unlinkSync(req.file.path); } catch { /* ignore */ }
      }
      logger.error('Document upload error:', err);
      res.status(500).json({ success: false, error: { message: err.message, statusCode: 500 } });
    }
  }
);

/**
 * POST /api/v1/documents/search
 * Semantic search across all user documents.
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

    const results = await documentService.searchDocuments(
      req.user!.userId,
      query,
      topK || 5
    );

    res.json({ success: true, data: results });
  } catch (err: any) {
    logger.error('Document search error:', err);
    res.status(500).json({ success: false, error: { message: err.message, statusCode: 500 } });
  }
});

/**
 * DELETE /api/v1/documents/:id
 * Delete a document and all its chunks.
 */
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const deleted = await documentService.deleteDocument(req.user!.userId, String(req.params.id));

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: { message: 'Document not found', statusCode: 404 },
      });
    }

    res.json({ success: true, data: { message: 'Document deleted' } });
  } catch (err: any) {
    logger.error('Document delete error:', err);
    res.status(500).json({ success: false, error: { message: err.message, statusCode: 500 } });
  }
});

export default router;
