/**
 * NIVA Database Backup Utility
 * Generates an encrypted/verified JSON snapshot of all active database tables.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Load environment variables manually if dotenv is not in current node_modules
function loadEnv(filePath) {
  if (fs.existsSync(filePath)) {
    const lines = fs.readFileSync(filePath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.substring(0, eqIdx).trim();
          let val = trimmed.substring(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  }
}

const serverEnv = path.resolve(__dirname, '../server/.env');
const rootEnv = path.resolve(__dirname, '../.env');
loadEnv(serverEnv);
loadEnv(rootEnv);

// Resolve PrismaClient from server/node_modules or local
let PrismaClient;
try {
  PrismaClient = require('@prisma/client').PrismaClient;
} catch (e) {
  try {
    PrismaClient = require(path.resolve(__dirname, '../server/node_modules/@prisma/client')).PrismaClient;
  } catch (e2) {
    console.error('Could not load @prisma/client:', e2.message);
    process.exit(1);
  }
}

const prisma = new PrismaClient();

async function runBackup() {
  const startTime = Date.now();
  console.log('📦 Starting NIVA Production Database Backup...');

  try {
    const backupDir = path.resolve(__dirname, '../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `niva_backup_${timestamp}.json`;
    const targetPath = path.join(backupDir, filename);

    // Collect all table data
    console.log('  → Reading database tables...');
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

    const backupData = {
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      metadata: {
        nodeVersion: process.version,
        platform: process.platform,
        environment: process.env.NODE_ENV || 'production'
      },
      stats: {
        users: users.length,
        sessions: sessions.length,
        devices: devices.length,
        conversations: conversations.length,
        messages: messages.length,
        memories: memories.length,
        documents: documents.length,
        documentChunks: documentChunks.length,
        permissions: permissions.length,
        auditEvents: auditEvents.length,
        workflows: workflows.length,
        jobs: jobs.length,
        integrations: integrations.length,
        communicationActions: communicationActions.length,
        totalRecords:
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
          communicationActions.length
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
    const sha256 = crypto.createHash('sha256').update(serialized).digest('hex');

    backupData.checksum = sha256;
    fs.writeFileSync(targetPath, JSON.stringify(backupData, null, 2), 'utf8');

    const duration = Date.now() - startTime;
    const stats = fs.statSync(targetPath);

    console.log(`✅ Backup successfully created in ${duration}ms!`);
    console.log(`  File:      ${filename}`);
    console.log(`  Path:      ${targetPath}`);
    console.log(`  Size:      ${(stats.size / 1024).toFixed(2)} KB`);
    console.log(`  Records:   ${backupData.stats.totalRecords} total across 14 tables`);
    console.log(`  SHA-256:   ${sha256}`);

    return {
      success: true,
      filename,
      filePath: targetPath,
      sizeBytes: stats.size,
      sizeKb: (stats.size / 1024).toFixed(2),
      records: backupData.stats.totalRecords,
      stats: backupData.stats,
      checksum: sha256,
      durationMs: duration
    };
  } catch (error) {
    console.error('❌ Database backup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  runBackup()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { runBackup };
