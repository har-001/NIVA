import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import styles from './AgentSquadHub.module.css';

interface AgentProfile {
  id: string;
  role: string;
  name: string;
  title: string;
  avatar: string;
  description: string;
  systemPrompt: string;
  allowedTools: string[];
  capabilities: string[];
  status: string;
}

interface SubTask {
  id: string;
  title: string;
  description: string;
  assignedRole: string;
  dependsOn: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'waiting_approval';
  durationMs?: number;
  output?: any;
  toolUsed?: string;
}

interface MissionPlan {
  id: string;
  goal: string;
  status: 'planned' | 'executing' | 'completed' | 'failed';
  subtasks: SubTask[];
  finalSummary?: string;
  totalDurationMs?: number;
  createdAt: string;
  verdict?: {
    isSafe: boolean;
    confidence: number;
    notes: string;
  };
}

interface AgentSquadHubProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToChat?: (text: string) => void;
}

export const AgentSquadHub: React.FC<AgentSquadHubProps> = ({ isOpen, onClose, onSendToChat }) => {
  const [activeTab, setActiveTab] = useState<'roster' | 'mission' | 'history'>('roster');
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [missions, setMissions] = useState<MissionPlan[]>([]);
  const [loading, setLoading] = useState(false);

  // Mission Dispatcher Form
  const [goalInput, setGoalInput] = useState(
    'Search latest quantum computing breakthroughs, generate Python simulation code, and audit with sentinel'
  );
  const [activeMission, setActiveMission] = useState<MissionPlan | null>(null);
  const [isDispatching, setIsDispatching] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rolesRes, missionsRes] = await Promise.all([
        api.getAgentRoles().catch(() => null),
        api.getMissions().catch(() => null),
      ]);

      if (rolesRes?.data) {
        setAgents(rolesRes.data);
      }
      if (missionsRes?.data) {
        setMissions(missionsRes.data);
        if (!activeMission && missionsRes.data.length > 0) {
          setActiveMission(missionsRes.data[0]);
        }
      }
    } catch (err: any) {
      console.error('Failed to load agent squad data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const handleDispatch = async () => {
    if (!goalInput.trim()) return;
    try {
      setIsDispatching(true);
      setActiveTab('mission');

      // Step 1: Plan
      const planRes = await api.planMission(goalInput.trim());
      if (planRes?.data) {
        setActiveMission(planRes.data);

        // Step 2: Execute
        const execRes = await api.executeMission(planRes.data.id);
        if (execRes?.data) {
          setActiveMission(execRes.data);
          setMissions((prev) => [execRes.data, ...prev.filter((m) => m.id !== execRes.data.id)]);
        }
      }
    } catch (err: any) {
      console.error('Failed to dispatch mission:', err);
    } finally {
      setIsDispatching(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <div className={styles.titleIcon}>🤖</div>
            <div>
              <div className={styles.title}>
                Multi-Agent Squad &amp; Mission Control
                <span className={styles.badge}>Collaborative DAG Engine</span>
              </div>
              <div className={styles.subtitle}>
                7 specialized sub-agents collaborating through shared Blackboard working memory
              </div>
            </div>
          </div>

          <button className={styles.closeBtn} onClick={onClose} title="Close">
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'roster' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('roster')}
          >
            🤖 Squad Roster
            <span className={styles.tabCount}>{agents.length || 7}</span>
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'mission' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('mission')}
          >
            🚀 Mission Pipeline DAG
            {activeMission && <span className={styles.tabCount}>{activeMission.subtasks.length} steps</span>}
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'history' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('history')}
          >
            📜 Mission History
            <span className={styles.tabCount}>{missions.length}</span>
          </button>
        </div>

        {/* Content Area */}
        <div className={styles.contentArea}>
          {/* TAB 1: SQUAD ROSTER */}
          {activeTab === 'roster' && (
            <div className={styles.squadGrid}>
              {agents.map((ag) => (
                <div key={ag.id} className={styles.agentCard}>
                  <div className={styles.cardHeader}>
                    <div className={styles.agentAvatarGroup}>
                      <div className={styles.agentAvatar}>{ag.avatar}</div>
                      <div>
                        <div className={styles.agentName}>{ag.name}</div>
                        <div className={styles.agentRole}>role: {ag.role}</div>
                      </div>
                    </div>
                    <div className={styles.statusIndicator}>
                      <div className={styles.statusDot} />
                      READY
                    </div>
                  </div>

                  <div className={styles.agentDesc}>{ag.description}</div>

                  <div className={styles.capabilitiesSection}>
                    <span className={styles.sectionLabel}>Capabilities:</span>
                    <div className={styles.pillsRow}>
                      {ag.capabilities.map((cap) => (
                        <span key={cap} className={styles.capabilityPill}>
                          ✨ {cap}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className={styles.capabilitiesSection}>
                    <span className={styles.sectionLabel}>Authorized Tools:</span>
                    <div className={styles.toolsRow}>
                      {ag.allowedTools.map((tool) => (
                        <span key={tool} className={styles.toolPill}>
                          ⚙️ {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: MISSION CONTROL & VISUAL DAG */}
          {activeTab === 'mission' && (
            <div className={styles.missionSection}>
              {/* Dispatch Form */}
              <div className={styles.dispatchForm}>
                <div className={styles.formHeader}>
                  <div className={styles.formTitle}>
                    <span>🎯</span> Launch Multi-Agent Collaborative Mission
                  </div>
                </div>

                <div className={styles.presetsRow}>
                  <button
                    className={styles.presetBtn}
                    onClick={() =>
                      setGoalInput(
                        'Search latest quantum computing breakthroughs, generate Python simulation code, and audit with sentinel'
                      )
                    }
                  >
                    ⚛️ Quantum Computing &amp; Code
                  </button>
                  <button
                    className={styles.presetBtn}
                    onClick={() =>
                      setGoalInput(
                        'Research top AI agent frameworks 2026, generate comparison matrix, and save to memory'
                      )
                    }
                  >
                    🧠 AI Frameworks Research
                  </button>
                  <button
                    className={styles.presetBtn}
                    onClick={() =>
                      setGoalInput(
                        'Analyze Bitcoin and Ethereum price trends, write strategy report, and check system status'
                      )
                    }
                  >
                    🪙 Crypto Trends &amp; Telemetry
                  </button>
                </div>

                <textarea
                  className={styles.goalInput}
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  placeholder="Enter a complex multi-domain objective..."
                />

                <button
                  className={styles.dispatchBtn}
                  onClick={handleDispatch}
                  disabled={isDispatching || !goalInput.trim()}
                >
                  {isDispatching ? '⚡ Executing Mission...' : '🚀 Dispatch Multi-Agent Squad'}
                </button>
              </div>

              {/* Active Pipeline Visualizer */}
              {activeMission && (
                <div className={styles.pipelineContainer}>
                  <div className={styles.pipelineHeader}>
                    <div className={styles.missionMeta}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f1f5f9' }}>
                        Mission: {activeMission.goal}
                      </span>
                      <span
                        className={`${styles.missionStatusBadge} ${
                          activeMission.status === 'completed'
                            ? styles.statusCompleted
                            : styles.statusExecuting
                        }`}
                      >
                        {activeMission.status.toUpperCase()}
                      </span>
                    </div>

                    {activeMission.totalDurationMs && (
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Total: <strong>{activeMission.totalDurationMs}ms</strong>
                      </span>
                    )}
                  </div>

                  {/* DAG Step Nodes */}
                  <div className={styles.dagSteps}>
                    {activeMission.subtasks.map((st, idx) => {
                      const isComplete = st.status === 'completed';
                      const inProgress = st.status === 'in_progress';
                      const roleProfile = agents.find((a) => a.role === st.assignedRole);

                      return (
                        <div
                          key={st.id}
                          className={`${styles.stepNode} ${
                            isComplete
                              ? styles.stepNodeCompleted
                              : inProgress
                              ? styles.stepNodeActive
                              : ''
                          }`}
                        >
                          <div className={styles.nodeLeft}>
                            <div className={styles.nodeIndex}>{idx + 1}</div>
                            <div style={{ fontSize: '1.2rem' }}>{roleProfile?.avatar || '🤖'}</div>
                            <div>
                              <div className={styles.nodeTitle}>{st.title}</div>
                              <div className={styles.nodeRole}>
                                Assigned: <strong>{roleProfile?.name || st.assignedRole}</strong>
                                {st.dependsOn.length > 0 && ` • depends on: [${st.dependsOn.join(', ')}]`}
                              </div>
                            </div>
                          </div>

                          <div className={styles.nodeRight}>
                            {st.durationMs !== undefined && (
                              <span className={styles.durationBadge}>{st.durationMs}ms</span>
                            )}
                            <span
                              className={`${styles.missionStatusBadge} ${
                                isComplete
                                  ? styles.statusCompleted
                                  : inProgress
                                  ? styles.statusExecuting
                                  : ''
                              }`}
                            >
                              {st.status.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Final Synthesized Output */}
                  {activeMission.finalSummary && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <div style={{ fontSize: '0.78rem', color: '#34d399', fontWeight: 600 }}>
                        ✅ Mission Synthesis &amp; Sentinel Audit:
                      </div>
                      <div className={styles.summaryBox}>{activeMission.finalSummary}</div>

                      {onSendToChat && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                          <button
                            className={styles.presetBtn}
                            onClick={() => {
                              onSendToChat(activeMission.finalSummary || '');
                              onClose();
                            }}
                          >
                            💬 Send Result to NIVA Chat
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MISSION HISTORY */}
          {activeTab === 'history' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {missions.map((m) => (
                <div
                  key={m.id}
                  className={styles.stepNode}
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    setActiveMission(m);
                    setActiveTab('mission');
                  }}
                >
                  <div className={styles.nodeLeft}>
                    <div style={{ fontSize: '1.3rem' }}>🎯</div>
                    <div>
                      <div className={styles.nodeTitle}>{m.goal}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        ID: {m.id} • Subtasks: {m.subtasks.length} • {new Date(m.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>

                  <div className={styles.nodeRight}>
                    {m.totalDurationMs && <span className={styles.durationBadge}>{m.totalDurationMs}ms</span>}
                    <span className={`${styles.missionStatusBadge} ${styles.statusCompleted}`}>
                      {m.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
