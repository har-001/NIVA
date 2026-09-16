'use client';

// ============================================
// NIVA — Chat Page (Main Interface with AI Brain, Voice & Vision)
// ============================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { getSocket, disconnectSocket } from '../lib/socket';
import { VoiceOrb, VoiceState } from './VoiceOrb';
import { VoiceGender } from '../lib/voice';
import { VisionModal } from './VisionModal';
import { FaceAuthOverlay } from './FaceAuthOverlay';
import { GestureModal } from './GestureModal';
import { MemoryPanel } from './MemoryPanel';
import { GenerationStudio } from './GenerationStudio';
import { CommunicationHub } from './CommunicationHub';
import { InternetHub } from './InternetHub';
import { WorkflowHub } from './WorkflowHub';
import { PluginHub } from './PluginHub';
import { AgentSquadHub } from './AgentSquadHub';
import styles from './ChatPage.module.css';

interface Message {
  id: string;
  role: string;
  content: string;
  createdAt: string;
  status?: string;
}

interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
  messages?: { content: string; role: string; createdAt: string }[];
}

interface ActiveToolState {
  name: string;
  status: 'executing' | 'done';
  result?: string;
}

function ChatCodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const [openingIde, setOpeningIde] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenIde = async (ide: 'vscode' | 'notepad') => {
    setOpeningIde(ide);
    setStatusMsg(`Opening in ${ide === 'vscode' ? 'VS Code' : 'Notepad'}...`);
    try {
      const res = await api.openInIde({
        code,
        language,
        ide,
      });
      if (res.success) {
        setStatusMsg(`✓ Opened in ${ide === 'vscode' ? 'VS Code' : 'Notepad'}`);
      } else {
        setStatusMsg(res.message || 'Failed to open');
      }
    } catch (err: any) {
      setStatusMsg(`Error: ${err.message}`);
    } finally {
      setOpeningIde(null);
      setTimeout(() => setStatusMsg(null), 3500);
    }
  };

  const langDisplay = language ? language.toUpperCase() : 'CODE';

  return (
    <div className={styles.codeContainer}>
      <div className={styles.codeHeader}>
        <div className={styles.codeLangBadge}>
          <span className={styles.codeLangDot}></span>
          <span>{langDisplay}</span>
        </div>
        <div className={styles.codeActions}>
          {statusMsg && <span className={styles.codeStatusHint}>{statusMsg}</span>}
          <button
            className={styles.codeActionBtn}
            onClick={handleCopy}
            title="Copy Code"
          >
            {copied ? '✓ Copied' : '📋 Copy'}
          </button>
          <button
            className={`${styles.codeActionBtn} ${styles.codeActionBtnPrimary}`}
            onClick={() => handleOpenIde('vscode')}
            disabled={openingIde === 'vscode'}
            title="Open and view code in VS Code on your laptop"
          >
            💻 {openingIde === 'vscode' ? 'Opening...' : 'VS Code'}
          </button>
          <button
            className={styles.codeActionBtn}
            onClick={() => handleOpenIde('notepad')}
            disabled={openingIde === 'notepad'}
            title="Open in Notepad on your laptop"
          >
            📝 {openingIde === 'notepad' ? 'Opening...' : 'Notepad'}
          </button>
        </div>
      </div>
      <pre className={styles.codePre}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

function ChatImageCard({ src, alt }: { src?: string; alt?: string }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const resolvedSrc = src
    ? src.startsWith('http')
      ? src
      : `http://localhost:3001${src.startsWith('/') ? '' : '/'}${src}`
    : '';

  return (
    <div className={styles.chatImageContainer}>
      <div className={styles.chatImageWrapper}>
        <img
          src={resolvedSrc}
          alt={alt || 'Generated Image'}
          className={`${styles.chatImagePreview} ${isLoaded ? styles.chatImageLoaded : ''}`}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          loading="eager"
        />
        {!isLoaded && !hasError && (
          <div className={styles.imageLoadingSkeleton}>
            <span className={styles.skeletonPulse}>Loading AI Artwork...</span>
          </div>
        )}
        {hasError && (
          <div className={styles.imageLoadingSkeleton}>
            <span style={{ color: '#f87171', fontSize: '0.8rem' }}>⚠️ Unable to preview image</span>
          </div>
        )}
      </div>
      <div className={styles.chatImageFooter}>
        <span className={styles.chatImageCaption}>🎨 {alt || 'Generated Artwork'}</span>
        <div className={styles.chatImageActions}>
          <a
            href={resolvedSrc}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.imageBtn}
            title="Open in new window"
          >
            🔍 Full Size
          </a>
          <a
            href={resolvedSrc}
            download={alt || 'niva-artwork.png'}
            className={`${styles.imageBtn} ${styles.imageBtnDownload}`}
            title="Download image"
          >
            💾 Download
          </a>
        </div>
      </div>
    </div>
  );
}

function ChatAudioCard({ src, title }: { src: string; title?: string }) {
  const resolvedSrc = src.startsWith('http')
    ? src
    : `http://localhost:3001${src.startsWith('/') ? '' : '/'}${src}`;

  return (
    <div className={styles.chatAudioCard}>
      <div className={styles.chatAudioHeader}>
        <span className={styles.chatAudioIcon}>🎙️</span>
        <span className={styles.chatAudioTitle}>{title || 'Generated Neural Voice'}</span>
        <a href={resolvedSrc} download className={styles.chatAudioDownload} title="Download Audio">
          ⬇️
        </a>
      </div>
      <audio controls src={resolvedSrc} className={styles.chatAudioElement} preload="metadata" />
    </div>
  );
}

const markdownComponents = {
  img({ src, alt }: any) {
    return <ChatImageCard src={src} alt={alt} />;
  },
  code({ node, inline, className, children, ...props }: any) {
    const match = /language-(\w+)/.exec(className || '');
    const raw = String(children).replace(/\n$/, '');
    if (!inline && (match || raw.includes('\n'))) {
      return <ChatCodeBlock language={match ? match[1] : ''} code={raw} />;
    }
    return (
      <code className={styles.inlineCode} {...props}>
        {children}
      </code>
    );
  },
  a({ href, children, ...props }: any) {
    const url = href || '';
    if (url.endsWith('.mp3') || url.endsWith('.wav') || url.includes('/generated/audio/')) {
      return <ChatAudioCard src={url} title={typeof children === 'string' ? children : undefined} />;
    }
    let domain = '';
    try {
      if (url.startsWith('http')) domain = new URL(url).hostname.replace(/^www\./, '');
    } catch {}

    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className={styles.chatLink} {...props}>
        {domain && (
          <img
            src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
            alt=""
            style={{ width: '13px', height: '13px', verticalAlign: 'middle', marginRight: '4px', borderRadius: '3px' }}
          />
        )}
        {children}
      </a>
    );
  },
};

function ChatDevOpsCard({ data }: { data: any }) {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupSuccessMsg, setBackupSuccessMsg] = useState<string | null>(null);

  const handleBackup = async () => {
    setIsBackingUp(true);
    setBackupSuccessMsg(null);
    try {
      const res = await api.createDatabaseBackup();
      if (res.success && res.data) {
        setBackupSuccessMsg(`✅ Backup created: ${res.data.filename} (${res.data.sizeKb} KB, ${res.data.records} rows)`);
      } else {
        setBackupSuccessMsg('⚠️ Backup completed with notice');
      }
    } catch (e: any) {
      setBackupSuccessMsg(`❌ Backup error: ${e.message}`);
    } finally {
      setIsBackingUp(false);
    }
  };

  const isHealthy = data?.healthy;
  const db = data?.database || {};
  const redis = data?.redis || {};
  const docker = data?.docker || { containers: [] };
  const srv = data?.server || { memory: {} };
  const backups = data?.backups || {};

  return (
    <div className={styles.devopsCard}>
      <div className={styles.devopsHeader}>
        <div className={styles.devopsTitleBlock}>
          <span style={{ fontSize: '1.2rem' }}>🚀</span>
          <div>
            <div className={styles.devopsTitle}>Production Infrastructure Health</div>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Real-time Stack Telemetry</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <span className={`${styles.devopsBadge} ${isHealthy ? styles.devopsBadgeHealthy : ''}`}>
            {isHealthy ? '● All Systems Operational' : '▲ Attention Needed'}
          </span>
          <span className={styles.devopsBadge}>{srv?.environment || 'PROD'}</span>
        </div>
      </div>

      <div className={styles.devopsGrid}>
        {/* Postgres */}
        <div className={styles.devopsTile}>
          <div className={styles.devopsTileHeader}>
            <span>🐘 PostgreSQL</span>
            <span className={`${styles.devopsStatusPill} ${db?.status === 'connected' ? styles.devopsStatusPillConnected : styles.devopsStatusPillDisconnected}`}>
              {db?.status === 'connected' ? `${db?.latencyMs ?? 0}ms` : 'OFFLINE'}
            </span>
          </div>
          <div className={styles.devopsMetricList}>
            <div className={styles.devopsMetricRow}>
              <span>Database</span>
              <span className={styles.devopsMetricVal}>{db?.database || 'niva_db'}</span>
            </div>
            <div className={styles.devopsMetricRow}>
              <span>Users / Convs</span>
              <span className={styles.devopsMetricVal}>{db?.totalUsers || 0} / {db?.totalConversations || 0}</span>
            </div>
            <div className={styles.devopsMetricRow}>
              <span>Memories / Workflows</span>
              <span className={styles.devopsMetricVal}>{db?.totalMemories || 0} / {db?.totalWorkflows || 0}</span>
            </div>
          </div>
        </div>

        {/* Redis */}
        <div className={styles.devopsTile}>
          <div className={styles.devopsTileHeader}>
            <span>⚡ Redis Cache</span>
            <span className={`${styles.devopsStatusPill} ${redis?.status === 'connected' ? styles.devopsStatusPillConnected : styles.devopsStatusPillDisconnected}`}>
              {redis?.status === 'connected' ? `${redis?.latencyMs ?? 0}ms` : 'OFFLINE'}
            </span>
          </div>
          <div className={styles.devopsMetricList}>
            <div className={styles.devopsMetricRow}>
              <span>Status</span>
              <span className={styles.devopsMetricVal}>{redis?.status?.toUpperCase() || 'UNKNOWN'}</span>
            </div>
            <div className={styles.devopsMetricRow}>
              <span>Architecture</span>
              <span className={styles.devopsMetricVal}>{redis?.mode || 'standalone'}</span>
            </div>
            <div className={styles.devopsMetricRow}>
              <span>Response</span>
              <span className={styles.devopsMetricVal}>PONG OK</span>
            </div>
          </div>
        </div>

        {/* Docker Containers */}
        <div className={styles.devopsTile}>
          <div className={styles.devopsTileHeader}>
            <span>🐳 Docker Containers</span>
            <span className={`${styles.devopsStatusPill} ${styles.devopsStatusPillConnected}`}>
              {docker?.containers?.length || 0} Active
            </span>
          </div>
          <div className={styles.devopsMetricList}>
            {docker?.containers && docker.containers.length > 0 ? (
              docker.containers.slice(0, 3).map((c: any, i: number) => (
                <div key={i} className={styles.devopsMetricRow}>
                  <span style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c?.name || 'container'}
                  </span>
                  <span className={styles.devopsMetricVal} style={{ fontSize: '0.68rem', color: c?.isHealthy ? '#4ade80' : '#fbbf24' }}>
                    {c?.isHealthy ? 'Healthy' : 'Running'}
                  </span>
                </div>
              ))
            ) : (
              <div className={styles.devopsMetricRow}>
                <span>Engine</span>
                <span className={styles.devopsMetricVal}>Host Service</span>
              </div>
            )}
          </div>
        </div>

        {/* Host Telemetry */}
        <div className={styles.devopsTile}>
          <div className={styles.devopsTileHeader}>
            <span>🖥️ Server Runtime</span>
            <span className={`${styles.devopsStatusPill} ${styles.devopsStatusPillConnected}`}>
              Port {srv?.port || 3001}
            </span>
          </div>
          <div className={styles.devopsMetricList}>
            <div className={styles.devopsMetricRow}>
              <span>Uptime</span>
              <span className={styles.devopsMetricVal}>{srv?.uptimeFormatted || '0m'}</span>
            </div>
            <div className={styles.devopsMetricRow}>
              <span>RAM (RSS)</span>
              <span className={styles.devopsMetricVal}>{srv?.memory?.rssMb || 0} MB</span>
            </div>
            <div className={styles.devopsMetricRow}>
              <span>Node / OS</span>
              <span className={styles.devopsMetricVal}>{srv?.nodeVersion || 'v20'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.devopsFooter}>
        <div>
          <span>💾 <strong>{backups?.totalBackups || 0}</strong> Backups Stored</span>
          {backups?.latestBackup && (
            <span style={{ marginLeft: '8px', color: '#64748b' }}>
              (Latest: {backups.latestBackup.sizeKb} KB)
            </span>
          )}
        </div>

        <button
          className={styles.devopsBackupBtn}
          onClick={handleBackup}
          disabled={isBackingUp}
        >
          {isBackingUp ? '⏳ Archiving...' : '💾 Backup Database'}
        </button>
      </div>

      {backupSuccessMsg && (
        <div style={{ marginTop: '0.6rem', padding: '6px 10px', background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '6px', fontSize: '0.75rem', color: '#4ade80' }}>
          {backupSuccessMsg}
        </div>
      )}
    </div>
  );
}

function ChatBackupCard({ data }: { data: any }) {
  if (!data) return null;
  return (
    <div className={styles.backupCard}>
      <div className={styles.backupHeader}>
        <div className={styles.backupTitle}>
          <span>💾</span>
          <span>Database Snapshot Captured</span>
        </div>
        <span className={styles.devopsBadge} style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', borderColor: 'rgba(34, 197, 94, 0.35)' }}>
          Verified SHA-256
        </span>
      </div>

      <div className={styles.backupGrid}>
        <div className={styles.backupStatItem}>
          <div>Backup File</div>
          <div className={styles.backupStatVal} style={{ fontSize: '0.74rem', wordBreak: 'break-all' }}>{data?.filename || 'backup.json'}</div>
        </div>
        <div className={styles.backupStatItem}>
          <div>Snapshot Size</div>
          <div className={styles.backupStatVal}>{data?.sizeKb ?? 0} KB</div>
        </div>
        <div className={styles.backupStatItem}>
          <div>Database Records</div>
          <div className={styles.backupStatVal}>{data?.records ?? 0} rows</div>
        </div>
        <div className={styles.backupStatItem}>
          <div>Duration</div>
          <div className={styles.backupStatVal}>{data?.durationMs ?? 0}ms</div>
        </div>
      </div>

      <div className={styles.backupChecksum}>
        SHA-256: {data?.checksum || 'verified'}
      </div>
    </div>
  );
}

function ChatSystemInfoCard({ data }: { data: any }) {
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleOpenApp = async (app: string) => {
    setStatusMsg(`Opening ${app}...`);
    try {
      const res = await api.openApp(app);
      if (res && res.success) {
        setStatusMsg(`✓ Opened ${app}`);
      } else {
        setStatusMsg(res?.message || 'Failed to open');
      }
    } catch (e: any) {
      setStatusMsg(`Error: ${e.message}`);
    } finally {
      setTimeout(() => setStatusMsg(null), 3000);
    }
  };

  const ram = data?.ram || {};
  const percent = ram.percent || (ram.total ? Math.round((parseFloat(ram.used) / parseFloat(ram.total)) * 100) : 0);

  return (
    <div className={styles.systemInfoCard}>
      <div className={styles.systemInfoHeader}>
        <div className={styles.systemInfoTitle}>
          <span style={{ fontSize: '1.2rem' }}>💻</span>
          <div>
            <div className={styles.systemCardHeading}>Laptop System Telemetry</div>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{data?.hostname || 'localhost'} • {data?.os || 'System'}</span>
          </div>
        </div>
        <span className={styles.devopsBadge} style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.3)' }}>
          {data?.battery || 'AC Power'}
        </span>
      </div>

      <div className={styles.systemGrid}>
        <div className={styles.systemMetricTile}>
          <div className={styles.systemMetricLabel}>Processor (CPU)</div>
          <div className={styles.systemMetricVal} style={{ fontSize: '0.78rem' }}>{data?.cpu || 'Multi-Core CPU'}</div>
          <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '2px' }}>Cores: {data?.cpuCores || '8'} Active</div>
        </div>

        <div className={styles.systemMetricTile}>
          <div className={styles.systemMetricLabel}>Memory (RAM)</div>
          <div className={styles.systemMetricVal}>{ram.used || 0} GB / {ram.total || 0} GB</div>
          <div className={styles.ramBarContainer}>
            <div className={styles.ramBarFill} style={{ width: `${percent}%` }} />
          </div>
          <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '2px' }}>{percent}% Utilization</div>
        </div>

        <div className={styles.systemMetricTile}>
          <div className={styles.systemMetricLabel}>System Uptime</div>
          <div className={styles.systemMetricVal}>{data?.uptime || 'Active'}</div>
          <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '2px' }}>Platform: {data?.platform || 'Windows'}</div>
        </div>

        <div className={styles.systemMetricTile}>
          <div className={styles.systemMetricLabel}>Power & Battery</div>
          <div className={styles.systemMetricVal} style={{ fontSize: '0.78rem' }}>{data?.battery || 'Plugged In'}</div>
          <div style={{ fontSize: '0.68rem', color: '#10b981', marginTop: '2px' }}>Optimized Performance</div>
        </div>
      </div>

      <div className={styles.systemFooter}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {statusMsg && <span className={styles.systemStatusHint}>{statusMsg}</span>}
        </div>
        <div className={styles.systemActions}>
          <button className={styles.systemActionBtn} onClick={() => handleOpenApp('taskmgr')} title="Open Task Manager">
            📊 Task Manager
          </button>
          <button className={styles.systemActionBtn} onClick={() => handleOpenApp('settings')} title="Open Windows Settings">
            ⚙️ Settings
          </button>
          <button className={`${styles.systemActionBtn} ${styles.systemActionBtnPrimary}`} onClick={() => handleOpenApp('workspace')} title="Open Workspace Directory">
            📁 Workspace
          </button>
        </div>
      </div>
    </div>
  );
}

function ChatMissionCard({ data }: { data: any }) {
  const [expanded, setExpanded] = useState(false);

  const subtasks: any[] = Array.isArray(data?.subtasks) ? data.subtasks : [];
  const status = data?.status || 'completed';

  const roleAvatars: Record<string, { avatar: string; title: string; color: string }> = {
    orchestrator: { avatar: '🎯', title: 'Lead Commander', color: '#6366f1' },
    researcher: { avatar: '🔬', title: 'Deep Researcher', color: '#06b6d4' },
    coder: { avatar: '💻', title: 'Senior Software Engineer', color: '#10b981' },
    visionary: { avatar: '🎨', title: 'Creative Visionary', color: '#ec4899' },
    archivist: { avatar: '📚', title: 'Knowledge Archivist', color: '#f59e0b' },
    executor: { avatar: '⚙️', title: 'System Automation', color: '#8b5cf6' },
    sentinel: { avatar: '🛡️', title: 'Security Guardian', color: '#ef4444' },
  };

  return (
    <div className={styles.missionCard}>
      <div className={styles.missionHeader}>
        <div className={styles.missionTitle}>
          <span style={{ fontSize: '1.2rem' }}>🤖</span>
          <div>
            <div className={styles.missionHeading}>Multi-Agent Squad Mission</div>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>ID: {data?.missionId || 'mission-live'} • {subtasks.length} Specialist Subtasks</span>
          </div>
        </div>
        <span className={`${styles.devopsBadge} ${status === 'completed' ? styles.devopsBadgeHealthy : ''}`}>
          {status === 'completed' ? '✓ Mission Completed' : '⚡ In Progress'}
        </span>
      </div>

      <div className={styles.missionGoalBox}>
        <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>TARGET OBJECTIVE:</span>
        <div style={{ fontSize: '0.86rem', color: '#f1f5f9', marginTop: '2px', fontWeight: 500 }}>{data?.goal || 'Collaborative Task'}</div>
      </div>

      <div className={styles.missionSquadGrid}>
        {Object.entries(roleAvatars).map(([roleKey, info]) => {
          const isAssigned = subtasks.some((st) => st?.assignedAgent === roleKey);
          return (
            <div
              key={roleKey}
              className={`${styles.agentSquadChip} ${isAssigned ? styles.agentSquadChipActive : ''}`}
              title={`${info.title} (${roleKey})`}
            >
              <span>{info.avatar}</span>
              <span className={styles.agentSquadChipName}>{info.title.split(' ')[0]}</span>
              {isAssigned && <span className={styles.agentActiveDot} />}
            </div>
          );
        })}
      </div>

      <div className={styles.missionSubtaskList}>
        {(expanded ? subtasks : subtasks.slice(0, 3)).map((st: any, idx: number) => {
          const roleInfo = roleAvatars[st?.assignedAgent] || { avatar: '🤖', title: st?.assignedAgent || 'Agent', color: '#38bdf8' };
          return (
            <div key={idx} className={styles.missionSubtaskItem}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>{roleInfo.avatar}</span>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f8fafc' }}>{st?.stepName || `Step ${idx + 1}`}</div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Agent: {roleInfo.title}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {st?.durationMs && <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{st.durationMs}ms</span>}
                <span className={styles.subtaskStatusPill}>
                  {st?.status === 'completed' ? '✓ Done' : st?.status || 'Active'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {subtasks.length > 3 && (
        <button className={styles.missionExpandBtn} onClick={() => setExpanded(!expanded)}>
          {expanded ? '▲ Show Less' : `▼ View All ${subtasks.length} Subtask Steps`}
        </button>
      )}
    </div>
  );
}

function ChatWorkflowCard({ data, isList }: { data: any; isList?: boolean }) {
  const [isRunning, setIsRunning] = useState(false);
  const [runMsg, setRunMsg] = useState<string | null>(null);

  const handleRun = async (id: string) => {
    setIsRunning(true);
    setRunMsg('Executing...');
    try {
      const res = await api.runWorkflow(id);
      if (res && res.success) {
        setRunMsg(`✓ ${res.data?.workflowName || 'Workflow'} completed!`);
      } else {
        setRunMsg('Completed');
      }
    } catch (e: any) {
      setRunMsg(`Error: ${e.message}`);
    } finally {
      setIsRunning(false);
      setTimeout(() => setRunMsg(null), 3500);
    }
  };

  if (isList) {
    const list: any[] = Array.isArray(data) ? data : (Array.isArray(data?.workflows) ? data.workflows : []);
    return (
      <div className={styles.workflowCard}>
        <div className={styles.workflowHeader}>
          <div className={styles.workflowTitle}>
            <span style={{ fontSize: '1.2rem' }}>⚡</span>
            <div>
              <div className={styles.workflowHeading}>Configured Automations & Workflows</div>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{list.length} Autonomous Routines</span>
            </div>
          </div>
        </div>

        <div className={styles.workflowGrid}>
          {list.map((wf: any, idx: number) => (
            <div key={idx} className={styles.workflowItemTile}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f1f5f9' }}>{wf?.name || 'Automation'}</div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>
                    {wf?.steps?.length || 1} step(s) • {wf?.trigger?.type || 'manual'}
                  </div>
                </div>
                <span className={wf?.isActive ? styles.wfActivePill : styles.wfInactivePill}>
                  {wf?.isActive ? 'Active' : 'Off'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button
                  className={styles.workflowRunBtn}
                  onClick={() => handleRun(wf?.id || wf?.name)}
                  disabled={isRunning}
                  title="Run this workflow"
                >
                  ▶ Run
                </button>
              </div>
            </div>
          ))}
        </div>
        {runMsg && <div className={styles.wfStatusNotice}>{runMsg}</div>}
      </div>
    );
  }

  const steps: any[] = Array.isArray(data?.stepResults) ? data.stepResults : [];
  return (
    <div className={styles.workflowCard}>
      <div className={styles.workflowHeader}>
        <div className={styles.workflowTitle}>
          <span style={{ fontSize: '1.2rem' }}>⚡</span>
          <div>
            <div className={styles.workflowHeading}>Workflow: {data?.workflowName || 'Automation'}</div>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>ID: {data?.id || 'wf-exec'} • {steps.length} Steps Executed</span>
          </div>
        </div>
        <span className={`${styles.devopsBadge} ${data?.status === 'completed' ? styles.devopsBadgeHealthy : ''}`}>
          {data?.status === 'completed' ? '✓ Completed' : data?.status || 'Active'}
        </span>
      </div>

      <div className={styles.workflowStepList}>
        {steps.map((sr: any, idx: number) => (
          <div key={idx} className={styles.workflowStepRow}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#38bdf8', fontWeight: 700 }}>{idx + 1}.</span>
              <div>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f8fafc' }}>{sr?.stepName || `Step ${idx + 1}`}</span>
                <span style={{ fontSize: '0.7rem', color: '#64748b', marginLeft: '6px' }}>({sr?.tool || 'tool'})</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{sr?.durationMs ?? 0}ms</span>
              <span className={styles.subtaskStatusPill}>{sr?.status || 'done'}</span>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.workflowFooter}>
        {runMsg && <span className={styles.wfStatusNotice}>{runMsg}</span>}
        <button
          className={styles.workflowRunBtn}
          onClick={() => handleRun(data?.workflowId || data?.workflowName || 'workflow')}
          disabled={isRunning}
        >
          {isRunning ? '⏳ Running...' : '⚡ Re-run Workflow'}
        </button>
      </div>
    </div>
  );
}

function ChatPluginCard({ data }: { data: any }) {
  const initialPlugins = Array.isArray(data) ? data : (Array.isArray(data?.plugins) ? data.plugins : []);
  const [plugins, setPlugins] = useState<any[]>(initialPlugins);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleToggle = async (id: string, currentStatus: string) => {
    setTogglingId(id);
    const newActive = currentStatus !== 'active';
    try {
      const res = await api.togglePlugin(id, newActive);
      if (res && res.success) {
        setPlugins((prev) =>
          prev.map((p) => (p?.id === id ? { ...p, status: newActive ? 'active' : 'disabled' } : p))
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className={styles.pluginCard}>
      <div className={styles.pluginHeader}>
        <div className={styles.pluginTitle}>
          <span style={{ fontSize: '1.2rem' }}>🧩</span>
          <div>
            <div className={styles.pluginHeading}>Installed Extensions & Plugins</div>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{plugins.length} Plugins in Sandboxed Runtime</span>
          </div>
        </div>
      </div>

      <div className={styles.pluginGrid}>
        {plugins.map((p: any) => {
          const isActive = p?.status === 'active';
          return (
            <div key={p?.id || p?.name} className={styles.pluginTile}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.3rem' }}>{p?.icon || '🧩'}</span>
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#f8fafc' }}>{p?.name || 'Plugin'}</div>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                    v{p?.version || '1.0'} • <span style={{ textTransform: 'capitalize' }}>{p?.category || 'utility'}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className={isActive ? styles.pluginActiveBadge : styles.pluginDisabledBadge}>
                  {isActive ? 'Active' : 'Disabled'}
                </span>
                <button
                  className={styles.pluginToggleBtn}
                  onClick={() => handleToggle(p?.id, p?.status)}
                  disabled={togglingId === p?.id}
                >
                  {togglingId === p?.id ? '...' : isActive ? 'Turn Off' : 'Enable'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChatCommunicationCard({ data }: { data: any }) {
  if (!data) return null;
  const isEmail = data?.type === 'email';
  const isCall = data?.type === 'call';

  const handleOpenAction = () => {
    if (data?.actionUrl) {
      window.open(data.actionUrl, '_blank');
    } else if (isEmail && data?.recipient) {
      api.openApp(`mailto:${data.recipient}`);
    }
  };

  return (
    <div className={styles.commCard}>
      <div className={styles.commHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.2rem' }}>{isEmail ? '✉️' : isCall ? '📞' : '💬'}</span>
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f8fafc' }}>
              {isEmail ? 'Email Dispatched' : isCall ? 'AI Call Session Active' : `${(data?.type || 'Message').toUpperCase()} Dispatched`}
            </div>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
              Recipient: {data?.recipient || data?.contactName || 'Contact'}
            </span>
          </div>
        </div>
        <span className={styles.devopsBadge} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
          {data?.status?.toUpperCase() || 'SENT'}
        </span>
      </div>

      {data?.subject && (
        <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: '6px' }}>
          <strong>Subject:</strong> {data.subject}
        </div>
      )}

      {(data?.message || data?.content) && (
        <div className={styles.commMessageBox}>
          "{data.message || data.content}"
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
        <button className={styles.commActionBtn} onClick={handleOpenAction}>
          {isEmail ? '✉️ Open in Windows Mail' : isCall ? '📞 Open Call Console' : `💬 Open ${data?.type?.toUpperCase() || 'App'}`}
        </button>
      </div>
    </div>
  );
}

function BubbleContent({ content }: { content: string }) {
  const safeContent = typeof content === 'string' ? content : '';
  const devopsMatch = safeContent.match(/<!-- DEVOPS_METRICS:\s*([\s\S]*?)\s*-->/);
  const backupMatch = safeContent.match(/<!-- DEVOPS_BACKUP_COMPLETED:\s*([\s\S]*?)\s*-->/);
  const systemMatch = safeContent.match(/<!-- SYSTEM_METRICS:\s*([\s\S]*?)\s*-->/);
  const missionMatch = safeContent.match(/<!-- MISSION_RESULT:\s*([\s\S]*?)\s*-->/);
  const workflowResultMatch = safeContent.match(/<!-- WORKFLOW_RESULT:\s*([\s\S]*?)\s*-->/);
  const workflowListMatch = safeContent.match(/<!-- WORKFLOW_LIST:\s*([\s\S]*?)\s*-->/);
  const pluginMatch = safeContent.match(/<!-- PLUGIN_LIST:\s*([\s\S]*?)\s*-->/);
  const commMatch = safeContent.match(/<!-- COMMUNICATION_RESULT:\s*([\s\S]*?)\s*-->/);

  let devopsData = null;
  if (devopsMatch) { try { devopsData = JSON.parse(devopsMatch[1]); } catch {} }

  let backupData = null;
  if (backupMatch) { try { backupData = JSON.parse(backupMatch[1]); } catch {} }

  let systemData = null;
  if (systemMatch) { try { systemData = JSON.parse(systemMatch[1]); } catch {} }

  let missionData = null;
  if (missionMatch) { try { missionData = JSON.parse(missionMatch[1]); } catch {} }

  let workflowResultData = null;
  if (workflowResultMatch) { try { workflowResultData = JSON.parse(workflowResultMatch[1]); } catch {} }

  let workflowListData = null;
  if (workflowListMatch) { try { workflowListData = JSON.parse(workflowListMatch[1]); } catch {} }

  let pluginListData = null;
  if (pluginMatch) { try { pluginListData = JSON.parse(pluginMatch[1]); } catch {} }

  let commData = null;
  if (commMatch) { try { commData = JSON.parse(commMatch[1]); } catch {} }

  const cleanedContent = safeContent
    .replace(/<!-- DEVOPS_METRICS:[\s\S]*?-->/g, '')
    .replace(/<!-- DEVOPS_BACKUP_COMPLETED:[\s\S]*?-->/g, '')
    .replace(/<!-- SYSTEM_METRICS:[\s\S]*?-->/g, '')
    .replace(/<!-- MISSION_RESULT:[\s\S]*?-->/g, '')
    .replace(/<!-- WORKFLOW_RESULT:[\s\S]*?-->/g, '')
    .replace(/<!-- WORKFLOW_LIST:[\s\S]*?-->/g, '')
    .replace(/<!-- PLUGIN_LIST:[\s\S]*?-->/g, '')
    .replace(/<!-- COMMUNICATION_RESULT:[\s\S]*?-->/g, '')
    .trim();

  return (
    <>
      {cleanedContent && (
        <div className={styles.markdownContent}>
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents as any}>
            {cleanedContent}
          </ReactMarkdown>
        </div>
      )}
      {systemData && <ChatSystemInfoCard data={systemData} />}
      {missionData && <ChatMissionCard data={missionData} />}
      {workflowResultData && <ChatWorkflowCard data={workflowResultData} />}
      {workflowListData && <ChatWorkflowCard data={workflowListData} isList />}
      {pluginListData && <ChatPluginCard data={pluginListData} />}
      {commData && <ChatCommunicationCard data={commData} />}
      {devopsData && <ChatDevOpsCard data={devopsData} />}
      {backupData && <ChatBackupCard data={backupData} />}
    </>
  );
}


export default function ChatPage() {
  const { user, token, logout } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [nivaStatus, setNivaStatus] = useState<VoiceState>('idle');
  const [streamingContent, setStreamingContent] = useState<string>('');
  const [activeTool, setActiveTool] = useState<ActiveToolState | null>(null);
  const [showVoiceOrb, setShowVoiceOrb] = useState<boolean>(false);
  const [showVisionModal, setShowVisionModal] = useState<boolean>(false);
  const [showFaceAuth, setShowFaceAuth] = useState<boolean>(false);
  const [showGestureModal, setShowGestureModal] = useState<boolean>(false);
  const [showMemoryPanel, setShowMemoryPanel] = useState<boolean>(false);
  const [showStudio, setShowStudio] = useState<boolean>(false);
  const [showCommHub, setShowCommHub] = useState<boolean>(false);
  const [showInternetHub, setShowInternetHub] = useState<boolean>(false);
  const [showWorkflowHub, setShowWorkflowHub] = useState<boolean>(false);
  const [showPluginHub, setShowPluginHub] = useState<boolean>(false);
  const [showAgentSquadHub, setShowAgentSquadHub] = useState<boolean>(false);
  const [lastAssistantReply, setLastAssistantReply] = useState<string>('');
  const [voiceGender, setVoiceGender] = useState<VoiceGender>('male');
  const [sidebarNews, setSidebarNews] = useState<any[]>([]);
  const [sidebarNewsLoading, setSidebarNewsLoading] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const loadSidebarNews = useCallback(async () => {
    setSidebarNewsLoading(true);
    try {
      const res = await api.fetchNews('', 4);
      if (res?.data?.items) {
        setSidebarNews(res.data.items);
      }
    } catch (err) {
      console.error('Failed to load sidebar news:', err);
    } finally {
      setSidebarNewsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSidebarNews();
  }, [loadSidebarNews]);

  // Initialize voice gender preference from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('niva_voice_gender') as VoiceGender | null;
      if (saved === 'male' || saved === 'female') {
        setVoiceGender(saved);
      }
    }
  }, []);

  const handleToggleVoiceGender = (newGender?: VoiceGender) => {
    const next = newGender || (voiceGender === 'male' ? 'female' : 'male');
    setVoiceGender(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('niva_voice_gender', next);
    }
  };

  // Check if startup face authentication has run this session
  useEffect(() => {
    if (typeof window !== 'undefined' && !sessionStorage.getItem('niva_face_auth_done')) {
      setShowFaceAuth(true);
    }
  }, []);

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      const res = await api.getConversations();
      const data = res.data as Conversation[];
      setConversations(data || []);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  }, []);

  // Load messages for a conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      const res = await api.getConversation(conversationId);
      const data = res.data as { messages: Message[] };
      setMessages(data.messages || []);
      setStreamingContent('');
      setActiveTool(null);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  }, []);

  // Initialize socket and load data
  useEffect(() => {
    if (!token) return;

    const socket = getSocket(token);
    loadConversations();

    // 1. Full completed message
    socket.on('chat:message', (message: Message) => {
      setMessages((prev) => {
        // If this message id was being streamed, replace with final
        const exists = prev.some((m) => m.id === message.id);
        if (exists) return prev;
        return [...prev, message];
      });
      setStreamingContent('');
      setActiveTool(null);
      if (message.role === 'assistant') {
        setLastAssistantReply(message.content);
        setNivaStatus('idle');
      }
      loadConversations(); // Refresh sidebar
    });

    // 2. Real-time streaming chunk
    socket.on('chat:chunk', (data: { conversationId: string; content: string; accumulated: string }) => {
      setStreamingContent(data.accumulated);
      setNivaStatus('thinking');
    });

    // 3. Tool execution started
    socket.on('chat:tool_call', (data: { tool: { name: string; arguments: any } }) => {
      setActiveTool({
        name: data.tool.name,
        status: 'executing',
      });
    });

    // 4. Tool execution finished
    socket.on('chat:tool_result', (data: { toolResult: { name: string; result: string; isError?: boolean } }) => {
      setActiveTool({
        name: data.toolResult.name,
        status: 'done',
        result: data.toolResult.result,
      });
    });

    // 5. Conversation title updated automatically by NIVA
    socket.on('chat:title_updated', (data: { conversationId: string; title: string }) => {
      setConversations((prev) =>
        prev.map((c) => (c.id === data.conversationId ? { ...c, title: data.title } : c))
      );
    });

    // 6. Thinking / idle status
    socket.on('chat:status', (data: { status: string }) => {
      if (data.status === 'thinking') {
        setIsThinking(true);
        setNivaStatus('thinking');
      } else {
        setIsThinking(false);
        setNivaStatus('idle');
      }
    });

    // 7. Error handling
    socket.on('chat:error', (data: { message: string }) => {
      console.error('Chat error:', data.message);
      setIsThinking(false);
      setNivaStatus('idle');
      setStreamingContent('');
      setActiveTool(null);
    });

    return () => {
      socket.off('chat:message');
      socket.off('chat:chunk');
      socket.off('chat:tool_call');
      socket.off('chat:tool_result');
      socket.off('chat:title_updated');
      socket.off('chat:status');
      socket.off('chat:error');
    };
  }, [token, loadConversations]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent, isThinking, activeTool]);

  // Create new conversation
  const handleNewChat = async () => {
    try {
      const res = await api.createConversation();
      const data = res.data as Conversation;
      setActiveConversation(data.id);
      setMessages([]);
      setStreamingContent('');
      setActiveTool(null);
      await loadConversations();
    } catch (err) {
      console.error('Failed to create conversation:', err);
    }
  };

  // Select conversation
  const handleSelectConversation = async (id: string) => {
    setActiveConversation(id);
    await loadMessages(id);
  };

  // Delete conversation
  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.deleteConversation(id);
      if (activeConversation === id) {
        setActiveConversation(null);
        setMessages([]);
      }
      await loadConversations();
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  // Send message (from text input or voice)
  const handleSend = async (customText?: string) => {
    const textToSend = (customText || inputText).trim();
    if (!textToSend || isThinking) return;

    let conversationId = activeConversation;

    // Create new conversation if none active
    if (!conversationId) {
      try {
        const res = await api.createConversation(textToSend.slice(0, 40));
        const data = res.data as Conversation;
        conversationId = data.id;
        setActiveConversation(conversationId);
        await loadConversations();
      } catch (err) {
        console.error('Failed to create conversation:', err);
        return;
      }
    }

    const lower = textToSend.toLowerCase();
    if (
      lower.includes('female voice') ||
      lower.includes('female aawaz') ||
      lower.includes('ladki ki aawaz') ||
      lower.includes('voice female') ||
      lower.includes('switch to female')
    ) {
      handleToggleVoiceGender('female');
    } else if (
      lower.includes('male voice') ||
      lower.includes('male aawaz') ||
      lower.includes('ladke ki aawaz') ||
      lower.includes('voice male') ||
      lower.includes('switch to male')
    ) {
      handleToggleVoiceGender('male');
    }

    if (!customText) {
      setInputText('');
    }
    setIsThinking(true);
    setNivaStatus('thinking');
    setStreamingContent('');
    setActiveTool(null);

    // Send via socket
    const socket = getSocket(token!);
    socket.emit('chat:send', {
      conversationId,
      content: textToSend,
    });
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
  };

  const getStatusText = () => {
    switch (nivaStatus) {
      case 'thinking': return 'Thinking...';
      case 'speaking': return 'Speaking...';
      case 'listening': return 'Listening...';
      default: return 'Online';
    }
  };

  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.brandRow}>
            <svg viewBox="0 0 40 40" width="32" height="32">
              <defs>
                <linearGradient id="sidebarLogo" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#a78bfa" />
                </linearGradient>
              </defs>
              <circle cx="20" cy="20" r="18" fill="none" stroke="url(#sidebarLogo)" strokeWidth="2" />
              <text x="20" y="26" textAnchor="middle" fill="url(#sidebarLogo)" fontSize="16" fontWeight="700" fontFamily="Inter">N</text>
            </svg>
            <span className={styles.brandName}>NIVA</span>
          </div>
          <button className={`btn btn-ghost btn-icon ${styles.closeSidebar}`} onClick={() => setSidebarOpen(false)}>
            ✕
          </button>
        </div>

        <button className={`btn btn-primary ${styles.newChatBtn}`} onClick={handleNewChat}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          New Chat
        </button>

        <div className={styles.conversationsList}>
          {conversations.length === 0 ? (
            <p className={styles.emptyState}>No conversations yet</p>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={`${styles.conversationItem} ${activeConversation === conv.id ? styles.conversationActive : ''}`}
                onClick={() => handleSelectConversation(conv.id)}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={styles.chatIcon}>
                  <path d="M2 3h12v8H4l-2 2V3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                </svg>
                <span className={styles.conversationTitle}>{conv.title}</span>
                <button
                  className={styles.deleteBtn}
                  onClick={(e) => handleDeleteConversation(conv.id, e)}
                  title="Delete"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Live Breaking News Sidebar Widget */}
        <div className={styles.sidebarNewsWidget}>
          <div className={styles.sidebarNewsHeader}>
            <div className={styles.sidebarNewsTitleRow}>
              <span className={styles.livePulseDot} />
              <span className={styles.sidebarNewsLabel}>Breaking News</span>
              <span className={styles.liveBadge}>LIVE</span>
            </div>
            <button
              className={styles.sidebarNewsRefreshBtn}
              onClick={() => loadSidebarNews()}
              title="Refresh Breaking News"
            >
              🔄
            </button>
          </div>

          <div className={styles.sidebarNewsNotice}>
            ⚡ <strong>Yahan breaking news bhi dikhegi latest</strong>
          </div>

          <div className={styles.sidebarNewsList}>
            {sidebarNewsLoading ? (
              <div className={styles.sidebarNewsLoading}>Loading latest news...</div>
            ) : sidebarNews.length === 0 ? (
              <div className={styles.sidebarNewsEmpty}>No news headlines available</div>
            ) : (
              sidebarNews.slice(0, 4).map((item) => (
                <div key={item.id} className={styles.sidebarNewsItem}>
                  <div className={styles.sidebarNewsMeta}>
                    <span className={styles.sidebarNewsSource}>{item.source}</span>
                    <span className={styles.sidebarNewsTime}>{item.timeAgo}</span>
                  </div>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.sidebarNewsHeadline}
                    title={item.title}
                  >
                    {item.title}
                  </a>
                  <button
                    className={styles.sidebarNewsAskBtn}
                    onClick={() => handleSend(`What is the latest update on this news: "${item.title}"`)}
                    title="Ask NIVA in chat"
                  >
                    💬 Discuss in Chat
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}>
              {user?.displayName?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className={styles.userDetails}>
              <span className={styles.userName}>{user?.displayName || user?.username}</span>
              <span className={styles.userEmail}>{user?.email}</span>
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={logout} title="Logout">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M6 15H3a1 1 0 01-1-1V4a1 1 0 011-1h3M12 12l3-3-3-3M7 9h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className={styles.main}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            {!sidebarOpen && (
              <button className="btn btn-ghost btn-icon" onClick={() => setSidebarOpen(true)}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            )}
            <div className={styles.headerInfo}>
              <h2 className={styles.headerTitle}>NIVA</h2>
              <div className={styles.headerStatus}>
                <span className={`status-dot ${nivaStatus === 'idle' ? 'online' : 'thinking'}`}></span>
                <span>{getStatusText()}</span>
              </div>
            </div>
          </div>

          <div className={styles.headerActions}>
            {/* Quick Voice Gender Switcher Badge Button */}
            <button
              className="btn btn-ghost"
              onClick={() => handleToggleVoiceGender()}
              title={`Voice: ${voiceGender === 'male' ? 'Male (Click to switch to Female)' : 'Female (Click to switch to Male)'}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 12px',
                borderRadius: '20px',
                fontSize: '0.78rem',
                fontWeight: 600,
                background: voiceGender === 'male' ? 'rgba(59, 130, 246, 0.16)' : 'rgba(236, 72, 153, 0.16)',
                color: voiceGender === 'male' ? '#60a5fa' : '#f472b6',
                border: `1px solid ${voiceGender === 'male' ? 'rgba(59, 130, 246, 0.35)' : 'rgba(236, 72, 153, 0.35)'}`,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <span>{voiceGender === 'male' ? '♂ Male Voice' : '♀ Female Voice'}</span>
            </button>

            {/* Google Voice Orb Toggle */}
            <button
              className={`btn btn-ghost btn-icon ${showVoiceOrb ? styles.actionIconBtnActive : ''}`}
              onClick={() => setShowVoiceOrb((prev) => !prev)}
              title={showVoiceOrb ? 'Hide Neural Voice Orb' : 'Show Neural Voice Orb'}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 2v8m0 0a3 3 0 003-3V5a3 3 0 00-6 0v2a3 3 0 003 3zm-5 0a5 5 0 0010 0M9 13v3m-3 0h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* Vision & Face Recognition Modal Toggle */}
            <button
              className={`btn btn-ghost btn-icon ${showVisionModal ? styles.actionIconBtnActive : ''}`}
              onClick={() => setShowVisionModal(true)}
              title="Camera Vision & Face Recognition"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M2 9s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
            </button>

            {/* Hand Gesture Recognition Modal Toggle */}
            <button
              className={`btn btn-ghost btn-icon ${showGestureModal ? styles.actionIconBtnActive : ''}`}
              onClick={() => setShowGestureModal(true)}
              title="Hand Gestures & Air Drawing"
            >
              <span style={{ fontSize: '1.05rem', lineHeight: 1 }}>✋</span>
            </button>

            {/* Multi-Factor Biometric & Written PIN Gateway */}
            <button
              className={`btn btn-ghost btn-icon ${showFaceAuth ? styles.actionIconBtnActive : ''}`}
              onClick={() => setShowFaceAuth(true)}
              title="Security Gateway (Face ID & Written PIN)"
            >
              <span style={{ fontSize: '1.05rem', lineHeight: 1 }}>🛡️</span>
            </button>

            {/* Memory & Document RAG Knowledge Panel */}
            <button
              className={`btn btn-ghost btn-icon ${showMemoryPanel ? styles.actionIconBtnActive : ''}`}
              onClick={() => setShowMemoryPanel(true)}
              title="Memory & Document Knowledge Base (RAG)"
            >
              <span style={{ fontSize: '1.05rem', lineHeight: 1 }}>🧠</span>
            </button>

            {/* AI Generation Studio (Images, Code, Documents, Audio) */}
            <button
              className={`btn btn-ghost btn-icon ${showStudio ? styles.actionIconBtnActive : ''}`}
              onClick={() => setShowStudio(true)}
              title="AI Generation Studio (Images, Code, Documents, Audio)"
            >
              <span style={{ fontSize: '1.05rem', lineHeight: 1 }}>🎨</span>
            </button>

            {/* Communication Hub (Contacts, Messaging, Calls) */}
            <button
              className={`btn btn-ghost btn-icon ${showCommHub ? styles.actionIconBtnActive : ''}`}
              onClick={() => setShowCommHub(true)}
              title="Communication Hub (Contacts, Calls, WhatsApp, Email)"
            >
              <span style={{ fontSize: '1.05rem', lineHeight: 1 }}>📞</span>
            </button>

            {/* Internet Intelligence Hub (Web Search, Reader, News) */}
            <button
              className={`btn btn-ghost btn-icon ${showInternetHub ? styles.actionIconBtnActive : ''}`}
              onClick={() => setShowInternetHub(true)}
              title="Internet Intelligence Hub (Live Search, Reader, News)"
            >
              <span style={{ fontSize: '1.05rem', lineHeight: 1 }}>🌐</span>
            </button>

            {/* Autonomous Workflow & Automation Hub (Phase 12) */}
            <button
              className={`btn btn-ghost btn-icon ${showWorkflowHub ? styles.actionIconBtnActive : ''}`}
              onClick={() => setShowWorkflowHub(true)}
              title="Autonomous Workflows & Proactive Automation (Phase 12)"
            >
              <span style={{ fontSize: '1.05rem', lineHeight: 1 }}>⚡</span>
            </button>

            {/* Plugin Ecosystem & Marketplace (Phase 13) */}
            <button
              className={`btn btn-ghost btn-icon ${showPluginHub ? styles.actionIconBtnActive : ''}`}
              onClick={() => setShowPluginHub(true)}
              title="Plugin Ecosystem & Extensibility Marketplace (Phase 13)"
            >
              <span style={{ fontSize: '1.05rem', lineHeight: 1 }}>🧩</span>
            </button>

            {/* Multi-Agent Squad & Collaborative Orchestration (Phase 14) */}
            <button
              className={`btn btn-ghost btn-icon ${showAgentSquadHub ? styles.actionIconBtnActive : ''}`}
              onClick={() => setShowAgentSquadHub(true)}
              title="Multi-Agent Squad & Collaborative Orchestration (Phase 14)"
            >
              <span style={{ fontSize: '1.05rem', lineHeight: 1 }}>🤖</span>
            </button>

            {/* Production Deployment & DevOps Health (Phase 15) */}
            <button
              className={`btn btn-ghost btn-icon`}
              onClick={() => handleSend('devops status')}
              title="DevOps & Deployment Architecture (PostgreSQL, Redis, Docker, Host)"
            >
              <span style={{ fontSize: '1.05rem', lineHeight: 1 }}>🚀</span>
            </button>
          </div>
        </header>

        {/* Messages Area */}
        <div className={styles.messagesArea}>
          <div className={styles.messagesContainer}>
            {/* Neural Voice Orb Container if toggled */}
            {showVoiceOrb && (
              <VoiceOrb
                state={nivaStatus}
                onTranscriptReady={(transcript) => handleSend(transcript)}
                autoSpeakResponse={true}
                lastAssistantResponse={lastAssistantReply}
                gender={voiceGender}
                onGenderChange={(g) => handleToggleVoiceGender(g)}
              />
            )}

            {messages.length === 0 && !activeConversation && !streamingContent ? (
              <div className={styles.welcomeScreen}>
                <div className={styles.welcomeLogo}>
                  <div className={styles.welcomeGlow}></div>
                  <svg viewBox="0 0 100 100" width="100" height="100">
                    <defs>
                      <linearGradient id="welcomeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="50%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#06b6d4" />
                      </linearGradient>
                    </defs>
                    <circle cx="50" cy="50" r="45" fill="none" stroke="url(#welcomeGrad)" strokeWidth="2" />
                    <circle cx="50" cy="50" r="35" fill="none" stroke="url(#welcomeGrad)" strokeWidth="1" opacity="0.3" />
                    <circle cx="50" cy="50" r="25" fill="none" stroke="url(#welcomeGrad)" strokeWidth="0.5" opacity="0.2" />
                    <text x="50" y="58" textAnchor="middle" fill="url(#welcomeGrad)" fontSize="32" fontWeight="800" fontFamily="Inter">N</text>
                  </svg>
                </div>
                <h2 className={styles.welcomeTitle}>
                  Hello{user?.displayName ? `, ${user.displayName}` : ''}! 👋
                </h2>
                <p className={styles.welcomeSubtitle}>
                  I&apos;m NIVA, your Neural Intelligent Virtual Assistant. Running locally on your laptop and web!
                </p>

                <div className={styles.suggestions}>
                  {[
                    '💻 Show laptop system info',
                    '🤖 Multi-Agent Squad deploy karo',
                    '⚡ Run morning briefing workflow',
                    '🧩 Show installed plugins',
                    '🚀 DevOps & Deployment Status',
                    '💾 Backup Database Snapshot',
                    '📰 Breaking news dikhao',
                    '🎨 Generate futuristic AI artwork',
                    '💻 Write Python fibonacci code',
                    '🌐 Search latest space discoveries',
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      className={styles.suggestionChip}
                      onClick={() => {
                        const cleanText = suggestion.replace(/^[^\s]+ /, '');
                        handleSend(cleanText);
                      }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, idx) => (
                  <div
                    key={msg.id || idx}
                    className={`${styles.message} ${msg.role === 'user' ? styles.messageUser : styles.messageAssistant}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className={styles.messageAvatar}>
                        <svg viewBox="0 0 24 24" width="20" height="20">
                          <defs>
                            <linearGradient id={`msgGrad_${idx}`} x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#6366f1" />
                              <stop offset="100%" stopColor="#a78bfa" />
                            </linearGradient>
                          </defs>
                          <circle cx="12" cy="12" r="10" fill="none" stroke={`url(#msgGrad_${idx})`} strokeWidth="1.5" />
                          <text x="12" y="16" textAnchor="middle" fill={`url(#msgGrad_${idx})`} fontSize="10" fontWeight="700" fontFamily="Inter">N</text>
                        </svg>
                      </div>
                    )}
                    <div className={styles.messageBubble}>
                      <BubbleContent content={msg.content} />
                      <span className={styles.messageTime}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Active Tool Chip */}
                {activeTool && (
                  <div className={`${styles.toolChip} ${activeTool.status === 'executing' ? styles.toolChipExecuting : styles.toolChipSuccess}`}>
                    <span>{activeTool.status === 'executing' ? '⚡ Executing Laptop Tool:' : '✅ Tool Completed:'}</span>
                    <strong>{activeTool.name}</strong>
                  </div>
                )}

                {/* Real-time Streaming Message */}
                {streamingContent && (
                  <div className={`${styles.message} ${styles.messageAssistant}`}>
                    <div className={styles.messageAvatar}>
                      <svg viewBox="0 0 24 24" width="20" height="20">
                        <circle cx="12" cy="12" r="10" fill="none" stroke="#6366f1" strokeWidth="1.5" />
                        <text x="12" y="16" textAnchor="middle" fill="#6366f1" fontSize="10" fontWeight="700" fontFamily="Inter">N</text>
                      </svg>
                    </div>
                    <div className={styles.messageBubble}>
                      <BubbleContent content={streamingContent} />
                    </div>
                  </div>
                )}

                {/* Thinking Dots (only before any stream text arrives) */}
                {isThinking && !streamingContent && !activeTool && (
                  <div className={`${styles.message} ${styles.messageAssistant}`}>
                    <div className={styles.messageAvatar}>
                      <svg viewBox="0 0 24 24" width="20" height="20">
                        <circle cx="12" cy="12" r="10" fill="none" stroke="#6366f1" strokeWidth="1.5" />
                        <text x="12" y="16" textAnchor="middle" fill="#6366f1" fontSize="10" fontWeight="700" fontFamily="Inter">N</text>
                      </svg>
                    </div>
                    <div className={styles.messageBubble}>
                      <div className="thinking-dots">
                        <span></span><span></span><span></span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className={styles.inputArea}>
          <div className={styles.inputWrapper}>
            <textarea
              ref={inputRef}
              className={styles.chatInput}
              placeholder="Ask NIVA anything, open apps, check laptop stats..."
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={isThinking}
            />

            <div className={styles.inputActions}>
              {/* Quick Microphone Button */}
              <button
                className={`${styles.actionIconBtn} ${showVoiceOrb ? styles.actionIconBtnActive : ''}`}
                onClick={() => setShowVoiceOrb((prev) => !prev)}
                title="Neural Voice Orb"
                type="button"
              >
                🎙️
              </button>

              {/* Quick Vision Button */}
              <button
                className={styles.actionIconBtn}
                onClick={() => setShowVisionModal(true)}
                title="Open Camera Vision"
                type="button"
              >
                📸
              </button>
            </div>

            <button
              className={`${styles.sendBtn} ${inputText.trim() ? styles.sendBtnActive : ''}`}
              onClick={() => handleSend()}
              disabled={!inputText.trim() || isThinking}
              type="button"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3 10l14-7-7 14v-7H3z" fill="currentColor"/>
              </svg>
            </button>
          </div>
          <p className={styles.inputHint}>
            NIVA AI Assistant • Web &amp; Laptop System Edition
          </p>
        </div>
      </main>

      {/* Vision & Face Recognition Modal */}
      <VisionModal
        isOpen={showVisionModal}
        onClose={() => setShowVisionModal(false)}
        onAnalysisResult={(desc) => {
          handleSend(`Here is what my camera sees: ${desc}`);
        }}
        token={token}
      />

      {/* Startup Privacy Face Authentication Overlay */}
      {showFaceAuth && (
        <FaceAuthOverlay
          userName={user?.displayName || user?.username || 'Harshit'}
          onAuthenticated={() => {
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('niva_face_auth_done', 'true');
            }
            setShowFaceAuth(false);
          }}
          onClose={() => setShowFaceAuth(false)}
        />
      )}

      {/* Hand Gesture Recognition & Air Drawing Modal */}
      <GestureModal
        isOpen={showGestureModal}
        onClose={() => setShowGestureModal(false)}
        onTriggerAction={(action) => {
          if (action === 'system_screenshot') {
            handleSend('Capture laptop screenshot');
          } else if (action === 'mute_speech') {
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
          }
        }}
      />

      {/* Semantic Memory & Document RAG Knowledge Panel */}
      <MemoryPanel
        isOpen={showMemoryPanel}
        onClose={() => setShowMemoryPanel(false)}
      />

      {/* Multi-modal AI Generation Studio Modal */}
      <GenerationStudio
        isOpen={showStudio}
        onClose={() => setShowStudio(false)}
        onSendToChat={(content) => handleSend(content)}
      />

      {/* Communication Hub (Contacts, Messaging, Calls & Audit) */}
      <CommunicationHub
        isOpen={showCommHub}
        onClose={() => setShowCommHub(false)}
        onSendToChat={(content) => handleSend(content)}
      />

      {/* Internet Intelligence Hub (Live Search, Web Reader, Breaking News) */}
      <InternetHub
        isOpen={showInternetHub}
        onClose={() => setShowInternetHub(false)}
        onAskNiva={(prompt) => handleSend(prompt)}
      />

      {/* Autonomous Workflow & Automation Center Modal (Phase 12) */}
      <WorkflowHub
        isOpen={showWorkflowHub}
        onClose={() => setShowWorkflowHub(false)}
      />

      {/* Plugin Ecosystem & Extensibility Marketplace Modal (Phase 13) */}
      <PluginHub
        isOpen={showPluginHub}
        onClose={() => setShowPluginHub(false)}
        onSendToChat={(prompt) => handleSend(prompt)}
      />

      {/* Multi-Agent Squad & Mission Control Modal (Phase 14) */}
      <AgentSquadHub
        isOpen={showAgentSquadHub}
        onClose={() => setShowAgentSquadHub(false)}
        onSendToChat={(prompt) => handleSend(prompt)}
      />
    </div>
  );
}
