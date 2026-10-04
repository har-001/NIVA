// ============================================
// NIVA — Payments & Commerce API Routes
// ============================================

import { Router, Request, Response } from 'express';
import { paymentsService } from './payments.service';
import { authBruteForceLimiter } from '../../middleware/security.middleware';
import { logger } from '../../utils/logger';

const router = Router();

/**
 * GET /api/v1/payments/plans
 * List all active subscription plans
 */
router.get('/plans', (_req: Request, res: Response): void => {
  const plans = paymentsService.getPlans();
  res.json({
    success: true,
    data: plans,
  });
});

/**
 * GET /api/v1/payments/status
 * Get current user subscription
 */
router.get('/status', (req: Request, res: Response): void => {
  const userId = (req as any).user?.id || 'usr-master-current';
  const sub = paymentsService.getUserSubscription(userId);
  res.json({
    success: true,
    data: sub,
  });
});

/**
 * POST /api/v1/payments/create-order
 * Create a new payment order for Razorpay, Stripe or UPI
 */
router.post('/create-order', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id || 'usr-master-current';
    const { planId, currency, provider } = req.body;

    if (!planId) {
      res.status(400).json({ success: false, error: 'planId is required' });
      return;
    }

    const order = await paymentsService.createOrder(userId, planId, currency || 'INR', provider || 'razorpay');
    res.json({
      success: true,
      data: order,
    });
  } catch (err: any) {
    logger.error('Failed to create payment order:', err);
    res.status(500).json({ success: false, error: err.message || 'Payment order creation failed' });
  }
});

/**
 * POST /api/v1/payments/verify
 * Cryptographically verify payment signature & activate subscription
 */
router.post('/verify', authBruteForceLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id || 'usr-master-current';
    const { orderId, paymentId, signature, planId } = req.body;

    if (!orderId || !paymentId || !signature || !planId) {
      res.status(400).json({
        success: false,
        error: 'orderId, paymentId, signature and planId are required for cryptographic verification',
      });
      return;
    }

    const result = await paymentsService.verifyPayment(userId, {
      orderId,
      paymentId,
      signature,
      planId,
    });

    res.json({
      success: true,
      message: 'Payment verified successfully and plan activated.',
      data: result.transaction,
    });
  } catch (err: any) {
    logger.warn('Payment verification rejection:', err.message);
    res.status(400).json({ success: false, error: err.message || 'Payment verification failed' });
  }
});

/**
 * GET /api/v1/payments/history
 * Transaction and invoice history
 */
router.get('/history', (req: Request, res: Response): void => {
  const userId = (req as any).user?.id || 'usr-master-current';
  const transactions = paymentsService.getTransactions(userId);
  res.json({
    success: true,
    data: transactions,
  });
});

export const paymentsRoutes = router;
