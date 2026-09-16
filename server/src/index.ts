// ============================================
// NIVA — Main Server Entry Point
// ============================================

import express from 'express';
import path from 'path';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { connectDatabase, disconnectDatabase } from './config/database';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Routes
import authRoutes from './modules/auth/auth.routes';
import chatRoutes from './modules/chat/chat.routes';
import visionRoutes from './modules/ai/vision.routes';
import memoryRoutes from './modules/memory/memory.routes';
import documentRoutes from './modules/memory/document.routes';
import generationRoutes from './modules/generation/generation.routes';
import { communicationRoutes } from './modules/communication/communication.routes';
import internetRoutes from './modules/internet/internet.routes';
import automationRoutes from './modules/automation/automation.routes';
import { schedulerService } from './modules/automation/scheduler.service';
import pluginRoutes from './modules/plugins/plugin.routes';
import agentRoutes from './modules/agents/agent.routes';
import devopsRoutes from './modules/devops/devops.routes';

// Socket handlers
import { setupChatSocket } from './modules/chat/chat.socket';

async function bootstrap(): Promise<void> {
  // --- Express App ---
  const app = express();
  const httpServer = createServer(app);

  const allowedOrigins = [
    config.clientUrl,
    'http://localhost:3000',
    'http://localhost:3002',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3002',
  ];

  const corsOriginCheck = (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) => {
    if (!origin || allowedOrigins.includes(origin) || (config.isDev && origin.startsWith('http://localhost:'))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  };

  // --- Socket.IO ---
  const io = new SocketServer(httpServer, {
    cors: {
      origin: corsOriginCheck,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // --- Global Middleware ---
  app.use(cors({
    origin: corsOriginCheck,
    credentials: true,
  }));

  app.use(helmet({
    contentSecurityPolicy: config.isDev ? false : undefined,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: config.rateLimitWindowMs,
    max: config.rateLimitMaxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: { message: 'Too many requests, please try again later', statusCode: 429 },
    },
  });
  app.use('/api/', limiter);

  // --- Health Check ---
  app.get('/api/v1/health', (_req, res) => {
    res.json({
      success: true,
      data: {
        status: 'healthy',
        service: 'niva-server',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      },
    });
  });

  // --- Static Uploads & Generated Assets ---
  app.use(
    '/generated',
    (_req, res, next) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      next();
    },
    express.static(path.join(process.cwd(), 'uploads', 'generated'))
  );

  // --- API Routes ---
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/chat', chatRoutes);
  app.use('/api/v1/vision', visionRoutes);
  app.use('/api/v1/memory', memoryRoutes);
  app.use('/api/v1/documents', documentRoutes);
  app.use('/api/v1/generate', generationRoutes);
  app.use('/api/v1/communication', communicationRoutes);
  app.use('/api/v1/internet', internetRoutes);
  app.use('/api/v1/automation', automationRoutes);
  app.use('/api/v1/plugins', pluginRoutes);
  app.use('/api/v1/agents', agentRoutes);
  app.use('/api/v1/devops', devopsRoutes);

  // --- Start Automation Scheduler ---
  schedulerService.start();

  // --- Socket Handlers ---
  setupChatSocket(io);

  // --- Error Handling ---
  app.use(notFoundHandler);
  app.use(errorHandler);

  // --- Database Connection ---
  try {
    await connectDatabase();
  } catch (dbError) {
    logger.warn('⚠️ Database connection warning: PostgreSQL is offline or warming up. Server remains active.');
  }

  // --- Start Server ---
  httpServer.listen(config.port, () => {
    logger.info(`
╔═══════════════════════════════════════════╗
║                                           ║
║    🧠 NIVA Server v1.0.0                  ║
║    Neural Intelligent Virtual Assistant    ║
║                                           ║
║    Port: ${config.port}                            ║
║    Mode: ${config.nodeEnv.padEnd(30)}║
║    Client: ${config.clientUrl.padEnd(28)}║
║                                           ║
╚═══════════════════════════════════════════╝
    `);
  });

  // --- Graceful Shutdown ---
  const shutdown = async (signal: string) => {
    logger.info(`\n${signal} received. Shutting down gracefully...`);
    httpServer.close(async () => {
      await disconnectDatabase();
      logger.info('Server closed');
      process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      logger.error('Forced shutdown due to timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});
