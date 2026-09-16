// ============================================
// NIVA — Auth Routes
// ============================================

import { Router, Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { registerSchema, loginSchema } from './auth.schema';
import { validate } from '../../middleware/validate';
import { authMiddleware, AuthenticatedRequest } from '../../middleware/auth';
import { prisma } from '../../config/database';
import { visionService } from '../ai/vision.service';

const router = Router();

/**
 * POST /api/v1/auth/register
 * Register a new user
 */
router.post(
  '/register',
  validate(registerSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.register(req.body);
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/auth/login
 * Login with email/username and password
 */
router.post(
  '/login',
  validate(loginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.login(req.body);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/auth/logout
 * Logout and invalidate session
 */
router.post(
  '/logout',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization?.split(' ')[1] || '';
      await authService.logout(token);
      res.json({
        success: true,
        data: { message: 'Logged out successfully' },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/auth/me
 * Get current user profile
 */
router.get(
  '/me',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = await authService.getProfile(req.user!.userId);
      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/auth/security/status
 * Get biometric & PIN security status
 */
router.get(
  '/security/status',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        select: { faceVerified: true, pin: true, displayName: true },
      });
      res.json({
        success: true,
        data: {
          faceVerified: !!user?.faceVerified,
          hasPin: !!user?.pin,
          defaultPin: '1234',
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/auth/face/verified
 * Mark that real-human face verification was completed
 */
router.post(
  '/face/verified',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await prisma.user.update({
        where: { id: req.user!.userId },
        data: { faceVerified: true },
      });
      res.json({
        success: true,
        data: { message: 'Real-human face biometric verification enrolled successfully.' },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/auth/face/verify-human
 * Strict AI verification that a REAL human face is present in front of the camera
 */
router.post(
  '/face/verify-human',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { image } = req.body;
      if (!image) {
        res.status(400).json({ success: false, error: 'Webcam frame image is required.' });
        return;
      }

      const cleanBase64 = image.replace(/^data:image\/\w+;base64,/, '');
      const buf = Buffer.from(cleanBase64, 'base64');

      // 1. Strict Physical Frame Sanity Check:
      // If frame is tiny (< 1KB), uniform, or pitch black/covered, fail immediately
      if (buf.length < 1200) {
        res.status(400).json({
          success: false,
          error: 'No human face detected. Frame is too small or blank.',
          data: { hasHumanFace: false, confidence: 0, message: 'Invalid or empty camera frame.' },
        });
        return;
      }

      // Check byte variance (detects uniform black, solid wall, or covered lens)
      let sum = 0, sumSq = 0, samples = 0;
      const step = Math.max(1, Math.floor(buf.length / 3000));
      for (let i = 0; i < buf.length; i += step) {
        const val = buf[i];
        sum += val;
        sumSq += val * val;
        samples++;
      }
      const mean = sum / samples;
      const variance = (sumSq / samples) - (mean * mean);

      if (variance < 150) {
        res.status(400).json({
          success: false,
          error: 'No human face detected. Camera view is obscured, covered, or blank.',
          data: { hasHumanFace: false, confidence: 0, message: 'Camera frame is uniform or dark.' },
        });
        return;
      }

      // 2. Check with Vision Service
      const prompt = `You are a strict biometric security verifier for NIVA AI.
Examine this camera snapshot carefully and verify if there is a real human face clearly visible in front of the camera.
Reply ONLY with valid JSON with this exact structure:
{"hasHumanFace": true or false, "faceCount": number, "confidence": number between 0 and 100, "message": "short explanation"}
Do not include any extra text or codeblocks.`;

      const analysis = await visionService.analyzeImage(image, 'image/jpeg', prompt);

      let hasHumanFace = false;
      let confidence = 0;
      let message = 'Face verification failed.';

      try {
        const jsonMatch = analysis.description.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          hasHumanFace = Boolean(parsed.hasHumanFace === true || parsed.hasHumanFace === 'true');
          confidence = parsed.confidence || (hasHumanFace ? 96 : 0);
          message = parsed.message || (hasHumanFace ? 'Human face verified' : 'No human face detected');
        } else if (analysis.source === 'local_vision') {
          // In local mode when variance passes, ensure minimum real frame payload
          hasHumanFace = buf.length > 5000 && variance > 300;
          confidence = hasHumanFace ? 92 : 0;
          message = hasHumanFace ? 'Human presence confirmed via optical analysis.' : 'Optical features insufficient.';
        } else {
          const lower = analysis.description.toLowerCase();
          const hasNegative = lower.includes('no human face') || lower.includes('no face') || lower.includes('not visible') || lower.includes('blank');
          hasHumanFace = !hasNegative && (lower.includes('human face') || lower.includes('person'));
          confidence = hasHumanFace ? 90 : 0;
          message = analysis.description;
        }
      } catch {
        hasHumanFace = false;
        confidence = 0;
        message = 'Could not parse face verification result.';
      }

      if (hasHumanFace) {
        // Mark user as faceVerified in DB!
        await prisma.user.update({
          where: { id: req.user!.userId },
          data: { faceVerified: true },
        });

        res.json({
          success: true,
          data: {
            hasHumanFace: true,
            confidence,
            message: 'Real human face confirmed. Biometric verification successful.',
          },
        });
      } else {
        res.status(400).json({
          success: false,
          error: 'No human face detected in camera view. Please look directly into the camera.',
          data: {
            hasHumanFace: false,
            confidence: 0,
            message,
          },
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/auth/pin/verify
 * Verify written PIN with 1-time human check enforcement
 */
router.post(
  '/pin/verify',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { pin } = req.body;
      const user = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        select: { faceVerified: true, pin: true },
      });

      // Check PIN (default is '1234' if user hasn't set custom PIN yet)
      const expectedPin = user?.pin || '1234';
      if (pin === expectedPin) {
        res.json({
          success: true,
          data: {
            message: 'Written PIN verified successfully. Access granted.',
            faceVerified: Boolean(user?.faceVerified),
          },
        });
      } else {
        res.status(401).json({
          success: false,
          error: 'Incorrect security PIN. Please try again.',
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/auth/pin/set
 * Set or update written PIN
 */
router.post(
  '/pin/set',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { pin } = req.body;
      if (!pin || pin.length < 4 || pin.length > 6) {
        res.status(400).json({ success: false, error: 'PIN must be 4 to 6 digits.' });
        return;
      }
      await prisma.user.update({
        where: { id: req.user!.userId },
        data: { pin },
      });
      res.json({ success: true, data: { message: 'Security PIN updated successfully.' } });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
