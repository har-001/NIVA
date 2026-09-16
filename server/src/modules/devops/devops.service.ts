// ============================================
// NIVA — DevOps & Deployment Service
// ============================================

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';
import { prisma } from '../../config/database';
import { getRedis } from '../../config/redis';
import { logger } from '../../utils/logger';

const execAsync = promisify(exec);

export interface ContainerInfo {
  id: string;
  name: string;
  status: string;
  image: string;
  isHealthy: boolean;
}

export interface DatabaseStatus {
  status: 'connected' | 'degraded' | 'disconnected';
  latencyMs: number;
  provider: string;
  database: string;
  totalUsers: number;
  totalConversations: number;
  totalMemories: number;
  totalWorkflows: number;
}

export interface RedisStatus {
  status: 'connected' | 'disconnected';
  latencyMs: number;
  mode: string;
}

export interface ServerMetrics {
  uptimeSeconds: number;
  uptimeFormatted: string;
  nodeVersion: string;
  platform: string;
  environment: string;
  port: number;
  memory: {
    rssMb: number;
    heapTotalMb: number;
    heapUsedMb: number;
  };
}

export interface BackupSummary {
  totalBackups: number;
  latestBackup?: {
    filename: string;
    sizeKb: string;
    createdAt: string;
    records?: number;
  };
}

export interface DevOpsStatusResponse {
  healthy: boolean;
  timestamp: string;
  database: DatabaseStatus;
  redis: RedisStatus;
  docker: {
    available: boolean;
    containers: ContainerInfo[];
  };
  server: ServerMetrics;
  backups: BackupSummary;
}

export interface BackupResult {
  success: boolean;
  filename: string;
  filePath: string;
  sizeBytes: number;
  sizeKb: string;
  records: number;
  checksum: string;
  durationMs: number;
}

export class DevOpsService {
  private backupDir: string;

  constructor() {
    // Check root backups directory
    const rootBackups = path.resolve(process.cwd(), '../backups');
    const localBackups = path.resolve(process.cwd(), 'backups');
    this.backupDir = fs.existsSync(rootBackups) ? rootBackups : localBackups;
    if (!fs.existsSync(this.backupDir)) {
      try {
        fs.mkdirSync(this.backupDir, { recursive: true });
      } catch {
        this.backupDir = localBackups;
        fs.mkdirSync(this.backupDir, { recursive: true });
      }
    }
  }

  /**
   * Probes all system layers: PostgreSQL, Redis, Docker containers, and Node runtime
   */
  async getStatus(): Promise<DevOpsStatusResponse> {
    const timestamp = new Date().toISOString();

    // 1. Check PostgreSQL Database
    let dbStatus: DatabaseStatus = {
      status: 'disconnected',
      latencyMs: -1,
      provider: 'postgresql',
      database: 'niva_db',
      totalUsers: 0,
      totalConversations: 0,
      totalMemories: 0,
      totalWorkflows: 0
    };

    try {
      const t0 = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const latency = Date.now() - t0;

      const [users, convs, mems, wfs] = await Promise.all([
        prisma.user.count().catch(() => 0),
        prisma.conversation.count().catch(() => 0),
        prisma.memory.count().catch(() => 0),
        prisma.workflow.count().catch(() => 0)
      ]);

      dbStatus = {
        status: 'connected',
        latencyMs: latency,
        provider: 'postgresql',
        database: 'niva_db',
        totalUsers: users,
        totalConversations: convs,
        totalMemories: mems,
        totalWorkflows: wfs
      };
    } catch (err: any) {
      logger.error('DevOps: DB check error', err.message);
    }

    // 2. Check Redis
    let redisStatus: RedisStatus = {
      status: 'disconnected',
      latencyMs: -1,
      mode: 'standalone'
    };

    try {
      const redisClient = getRedis();
      const t0 = Date.now();
      const pingRes = await redisClient.ping();
      const latency = Date.now() - t0;

      if (pingRes === 'PONG') {
        redisStatus = {
          status: 'connected',
          latencyMs: latency,
          mode: 'standalone'
        };
      }
    } catch (err: any) {
      logger.warn('DevOps: Redis check error', err.message);
    }

    // 3. Check Docker Containers
    let dockerInfo = {
      available: false,
      containers: [] as ContainerInfo[]
    };

    try {
      const { stdout } = await execAsync('docker ps --format "{{.ID}}|{{.Names}}|{{.Status}}|{{.Image}}"');
      dockerInfo.available = true;
      const lines = stdout.trim().split('\n').filter(Boolean);
      for (const line of lines) {
        const parts = line.split('|');
        if (parts.length >= 4) {
          const statusStr = parts[2].toLowerCase();
          dockerInfo.containers.push({
            id: parts[0],
            name: parts[1],
            status: parts[2],
            image: parts[3],
            isHealthy: statusStr.includes('up') && !statusStr.includes('unhealthy')
          });
        }
      }
    } catch (err: any) {
      // Docker command might fail or not be in path
      dockerInfo.available = false;
      // Fallback container status based on DB & Redis health
      dockerInfo.containers = [
        {
          id: 'niva-postgres',
          name: 'niva-postgres',
          status: dbStatus.status === 'connected' ? 'Up (healthy)' : 'Exited',
          image: 'postgres:16-alpine',
          isHealthy: dbStatus.status === 'connected'
        },
        {
          id: 'niva-redis',
          name: 'niva-redis',
          status: redisStatus.status === 'connected' ? 'Up (healthy)' : 'Exited',
          image: 'redis:7-alpine',
          isHealthy: redisStatus.status === 'connected'
        }
      ];
    }

    // 4. Server Process & System Telemetry
    const uptimeSec = Math.floor(process.uptime());
    const hours = Math.floor(uptimeSec / 3600);
    const mins = Math.floor((uptimeSec % 3600) / 60);
    const secs = uptimeSec % 60;
    const uptimeFormatted = `${hours > 0 ? `${hours}h ` : ''}${mins}m ${secs}s`;

    const mem = process.memoryUsage();
    const serverMetrics: ServerMetrics = {
      uptimeSeconds: uptimeSec,
      uptimeFormatted,
      nodeVersion: process.version,
      platform: process.platform,
      environment: process.env.NODE_ENV || 'development',
      port: Number(process.env.PORT || 3001),
      memory: {
        rssMb: Math.round(mem.rss / (1024 * 1024) * 10) / 10,
        heapTotalMb: Math.round(mem.heapTotal / (1024 * 1024) * 10) / 10,
        heapUsedMb: Math.round(mem.heapUsed / (1024 * 1024) * 10) / 10
      }
    };

    // 5. Check Backups
    const backupSummary: BackupSummary = {
      totalBackups: 0
    };

    try {
      if (fs.existsSync(this.backupDir)) {
        const files = fs.readdirSync(this.backupDir).filter(f => f.endsWith('.json'));
        backupSummary.totalBackups = files.length;
        if (files.length > 0) {
          files.sort((a, b) => {
            const statA = fs.statSync(path.join(this.backupDir, a));
            const statB = fs.statSync(path.join(this.backupDir, b));
            return statB.mtimeMs - statA.mtimeMs;
          });
          const latestFile = files[0];
          const stat = fs.statSync(path.join(this.backupDir, latestFile));
          backupSummary.latestBackup = {
            filename: latestFile,
            sizeKb: (stat.size / 1024).toFixed(2),
            createdAt: stat.mtime.toISOString()
          };
        }
      }
    } catch (err: any) {
      logger.warn('DevOps: Backup check error', err.message);
    }

    const healthy = dbStatus.status === 'connected' && redisStatus.status === 'connected';

    return {
      healthy,
      timestamp,
      database: dbStatus,
      redis: redisStatus,
      docker: dockerInfo,
      server: serverMetrics,
      backups: backupSummary
    };
  }

  /**
   * Creates an immediate live snapshot of the database
   */
  async createBackup(): Promise<BackupResult> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `niva_backup_${timestamp}.json`;
    const targetPath = path.join(this.backupDir, filename);

    const [
      users,
      sessions,
      devices,
      conversations,
      messages,
      memories,
      documents,
      documentChunks,
      permissions,
      auditEvents,
      workflows,
      jobs,
      integrations,
      communicationActions
    ] = await Promise.all([
      prisma.user.findMany().catch(() => []),
      prisma.session.findMany().catch(() => []),
      prisma.device.findMany().catch(() => []),
      prisma.conversation.findMany().catch(() => []),
      prisma.message.findMany().catch(() => []),
      prisma.memory.findMany().catch(() => []),
      prisma.document.findMany().catch(() => []),
      prisma.documentChunk.findMany().catch(() => []),
      prisma.permission.findMany().catch(() => []),
      prisma.auditEvent.findMany().catch(() => []),
      prisma.workflow.findMany().catch(() => []),
      prisma.job.findMany().catch(() => []),
      prisma.integration.findMany().catch(() => []),
      prisma.communicationAction.findMany().catch(() => [])
    ]);

    const totalRecords =
      users.length +
      sessions.length +
      devices.length +
      conversations.length +
      messages.length +
      memories.length +
      documents.length +
      documentChunks.length +
      permissions.length +
      auditEvents.length +
      workflows.length +
      jobs.length +
      integrations.length +
      communicationActions.length;

    const backupData: any = {
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      metadata: {
        nodeVersion: process.version,
        platform: process.platform,
        environment: process.env.NODE_ENV || 'production'
      },
      stats: {
        users: users.length,
        conversations: conversations.length,
        messages: messages.length,
        memories: memories.length,
        workflows: workflows.length,
        totalRecords
      },
      tables: {
        users,
        sessions,
        devices,
        conversations,
        messages,
        memories,
        documents,
        documentChunks,
        permissions,
        auditEvents,
        workflows,
        jobs,
        integrations,
        communicationActions
      }
    };

    const serialized = JSON.stringify(backupData, null, 2);
    const checksum = crypto.createHash('sha256').update(serialized).digest('hex');
    backupData.checksum = checksum;

    fs.writeFileSync(targetPath, JSON.stringify(backupData, null, 2), 'utf8');

    const durationMs = Date.now() - startTime;
    const stat = fs.statSync(targetPath);

    logger.info(`DevOps: Backup generated ${filename} (${(stat.size / 1024).toFixed(2)} KB, ${totalRecords} records)`);

    return {
      success: true,
      filename,
      filePath: targetPath,
      sizeBytes: stat.size,
      sizeKb: (stat.size / 1024).toFixed(2),
      records: totalRecords,
      checksum,
      durationMs
    };
  }
}

export const devopsService = new DevOpsService();
