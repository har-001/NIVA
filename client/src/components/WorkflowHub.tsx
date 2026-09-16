import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import styles from './WorkflowHub.module.css';

interface WorkflowStep {
  id: string;
  name: string;
  tool: string;
  arguments?: Record<string, any>;
  requiresApproval?: boolean;
}

interface WorkflowTrigger {
  type: 'schedule' | 'manual';
  schedule?: {
    cron?: string;
    intervalSeconds?: number;
    timeOfDay?: string;
  };
}

interface WorkflowItem {
  id: string;
  name: string;
  description: string;
  trigger: WorkflowTrigger;
  steps: WorkflowStep[];
  isActive: boolean;
  lastRunAt?: string;
}

interface StepResult {
  stepId: string;
  tool: string;
  status: 'completed' | 'failed' | 'skipped';
  output?: string;
  error?: string;
  durationMs: number;
}

interface ExecutionItem {
  id: string;
  workflowId: string;
  workflowName: string;
  status: 'pending' | 'running' | 'waiting_approval' | 'completed' | 'failed' | 'cancelled';
  currentStepIndex: number;
  stepResults: StepResult[];
  startedAt: string;
  completedAt?: string;
}

interface WorkflowHubProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WorkflowHub: React.FC<WorkflowHubProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'workflows' | 'history' | 'create'>('workflows');
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [executions, setExecutions] = useState<ExecutionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [runningWfId, setRunningWfId] = useState<string | null>(null);
  const [expandedExecId, setExpandedExecId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state for creating custom workflow
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formTriggerType, setFormTriggerType] = useState<'manual' | 'interval' | 'daily'>('manual');
  const [formIntervalSec, setFormIntervalSec] = useState(300);
  const [formDailyTime, setFormDailyTime] = useState('09:00');
  const [formSteps, setFormSteps] = useState<WorkflowStep[]>([
    { id: 'step_1', name: 'Check System Status', tool: 'system_info', arguments: {} },
  ]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [wfRes, execRes] = await Promise.all([
        api.getWorkflows(),
        api.getWorkflowExecutions(),
      ]);

      if (wfRes?.data) setWorkflows(wfRes.data);
      if (execRes?.data) setExecutions(execRes.data);
    } catch (err: any) {
      console.error('Failed to load automation data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      const interval = setInterval(loadData, 10000); // 10s auto-refresh
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggle = async (id: string, currentStatus: boolean) => {
    try {
      await api.toggleWorkflow(id, !currentStatus);
      setWorkflows((prev) =>
        prev.map((w) => (w.id === id ? { ...w, isActive: !currentStatus } : w))
      );
      setFeedbackMsg({ type: 'success', text: `Workflow ${!currentStatus ? 'activated' : 'paused'}` });
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to toggle workflow' });
    }
  };

  const handleRunWorkflow = async (id: string, name: string) => {
    try {
      setRunningWfId(id);
      setFeedbackMsg(null);
      const res = await api.runWorkflow(id);
      if (res?.data) {
        setExecutions((prev) => [res.data, ...prev]);
        setFeedbackMsg({
          type: 'success',
          text: `Workflow "${name}" started! Status: ${res.data.status.toUpperCase()}`,
        });
        if (res.data.status === 'waiting_approval') {
          setActiveTab('history');
          setExpandedExecId(res.data.id);
        }
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Workflow run failed' });
    } finally {
      setRunningWfId(null);
      loadData();
    }
  };

  const handleApprove = async (execId: string) => {
    try {
      const res = await api.approveWorkflowExecution(execId);
      if (res?.data) {
        setExecutions((prev) =>
          prev.map((e) => (e.id === execId ? res.data : e))
        );
        setFeedbackMsg({ type: 'success', text: 'Step approved! Workflow resumed.' });
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Approval failed' });
    }
  };

  const handleCancel = async (execId: string) => {
    try {
      const res = await api.cancelWorkflowExecution(execId);
      if (res?.data) {
        setExecutions((prev) =>
          prev.map((e) => (e.id === execId ? res.data : e))
        );
        setFeedbackMsg({ type: 'success', text: 'Workflow cancelled.' });
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Cancel failed' });
    }
  };

  const handleAddStep = () => {
    const nextIdx = formSteps.length + 1;
    setFormSteps([
      ...formSteps,
      {
        id: `step_${nextIdx}`,
        name: `Step ${nextIdx}`,
        tool: 'date_time',
        arguments: {},
        requiresApproval: false,
      },
    ]);
  };

  const handleRemoveStep = (idx: number) => {
    if (formSteps.length <= 1) return;
    setFormSteps(formSteps.filter((_, i) => i !== idx));
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    let trigger: WorkflowTrigger = { type: 'manual' };
    if (formTriggerType === 'interval') {
      trigger = {
        type: 'schedule',
        schedule: { intervalSeconds: Number(formIntervalSec) },
      };
    } else if (formTriggerType === 'daily') {
      trigger = {
        type: 'schedule',
        schedule: { timeOfDay: formDailyTime },
      };
    }

    try {
      setLoading(true);
      const res = await api.createWorkflow({
        name: formName,
        description: formDesc,
        trigger,
        steps: formSteps,
        isActive: true,
      });

      if (res?.data) {
        setWorkflows((prev) => [...prev, res.data]);
        setFeedbackMsg({ type: 'success', text: `Created workflow "${res.data.name}"!` });
        setActiveTab('workflows');
        setFormName('');
        setFormDesc('');
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to create workflow' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <div className={styles.titleIcon}>⚡</div>
            <div>
              <div className={styles.title}>
                Automation & Workflows
                <span className={styles.badge}>Autonomous Engine</span>
              </div>
              <div className={styles.schedulerStatus}>
                <span className={styles.pulseDot}></span>
                <span>In-Process Scheduler: <strong>ACTIVE</strong> (Evaluates every 30s)</span>
              </div>
            </div>
          </div>

          <div className={styles.headerActions}>
            <button className={styles.closeBtn} onClick={onClose} title="Close">
              ✕
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'workflows' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('workflows')}
          >
            ⚡ Active Workflows
            <span className={styles.tabCount}>{workflows.length}</span>
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'history' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('history')}
          >
            📜 Execution History
            <span className={styles.tabCount}>{executions.length}</span>
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'create' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('create')}
          >
            ➕ Create Custom Automation
          </button>
        </div>

        {/* Feedback Alert */}
        {feedbackMsg && (
          <div
            style={{
              padding: '0.65rem 1.75rem',
              fontSize: '0.84rem',
              background:
                feedbackMsg.type === 'success'
                  ? 'rgba(16, 185, 129, 0.15)'
                  : 'rgba(239, 68, 68, 0.15)',
              borderBottom: `1px solid ${
                feedbackMsg.type === 'success'
                  ? 'rgba(16, 185, 129, 0.3)'
                  : 'rgba(239, 68, 68, 0.3)'
              }`,
              color: feedbackMsg.type === 'success' ? '#10b981' : '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>{feedbackMsg.text}</span>
            <button
              onClick={() => setFeedbackMsg(null)}
              style={{
                background: 'none',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Body Content */}
        <div className={styles.body}>
          {/* TAB 1: WORKFLOWS */}
          {activeTab === 'workflows' && (
            <div className={styles.workflowsGrid}>
              {workflows.map((wf) => (
                <div key={wf.id} className={styles.workflowCard}>
                  <div className={styles.cardTop}>
                    <div>
                      <div className={styles.cardTitle}>{wf.name}</div>
                      <div className={styles.cardDesc}>{wf.description}</div>
                    </div>
                    <div
                      className={`${styles.toggleSwitch} ${wf.isActive ? styles.active : ''}`}
                      onClick={() => handleToggle(wf.id, wf.isActive)}
                      title={wf.isActive ? 'Active — Click to pause' : 'Paused — Click to activate'}
                    >
                      <div className={styles.toggleSlider} />
                    </div>
                  </div>

                  <div className={styles.triggerMeta}>
                    <span className={styles.triggerTag}>
                      {wf.trigger.type === 'schedule'
                        ? wf.trigger.schedule?.cron
                          ? `Cron: ${wf.trigger.schedule.cron}`
                          : wf.trigger.schedule?.intervalSeconds
                          ? `Interval: Every ${Math.round(wf.trigger.schedule.intervalSeconds / 60)} min`
                          : `Daily: ${wf.trigger.schedule?.timeOfDay || '09:00'}`
                        : 'On-Demand Manual'}
                    </span>
                    <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                      {wf.steps.length} Steps
                    </span>
                  </div>

                  <div className={styles.stepPills}>
                    {wf.steps.map((s, idx) => (
                      <span key={s.id || idx} className={styles.stepPill}>
                        ⚙️ {s.name}
                        {s.requiresApproval && (
                          <span style={{ color: '#f59e0b', fontSize: '0.65rem' }}>⚠️ Approval</span>
                        )}
                      </span>
                    ))}
                  </div>

                  <div className={styles.cardFooter}>
                    <span className={styles.lastRun}>
                      {wf.lastRunAt
                        ? `Last run: ${new Date(wf.lastRunAt).toLocaleTimeString()}`
                        : 'Never executed'}
                    </span>
                    <button
                      className={styles.runBtn}
                      disabled={runningWfId === wf.id}
                      onClick={() => handleRunWorkflow(wf.id, wf.name)}
                    >
                      {runningWfId === wf.id ? 'Running...' : '▶ Run Now'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: EXECUTION HISTORY */}
          {activeTab === 'history' && (
            <div className={styles.executionList}>
              {executions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                  No execution logs recorded yet. Trigger a workflow to see live audit logs!
                </div>
              ) : (
                executions.map((exec) => {
                  const isExpanded = expandedExecId === exec.id;
                  const isWaitingApproval = exec.status === 'waiting_approval';

                  return (
                    <div key={exec.id} className={styles.executionCard}>
                      <div
                        className={styles.executionHeader}
                        onClick={() => setExpandedExecId(isExpanded ? null : exec.id)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span
                            className={`${styles.execStatusBadge} ${
                              exec.status === 'completed'
                                ? styles.statusCompleted
                                : exec.status === 'running'
                                ? styles.statusRunning
                                : exec.status === 'waiting_approval'
                                ? styles.statusApproval
                                : styles.statusFailed
                            }`}
                          >
                            {exec.status === 'waiting_approval' ? '⚠️ Waiting Approval' : exec.status}
                          </span>
                          <span style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.95rem' }}>
                            {exec.workflowName}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            ({exec.id})
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                            {new Date(exec.startedAt).toLocaleTimeString()}
                          </span>
                          <span style={{ color: '#64748b' }}>{isExpanded ? '▲' : '▼'}</span>
                        </div>
                      </div>

                      {/* Approval Alert Banner */}
                      {isWaitingApproval && (
                        <div className={styles.approvalBanner}>
                          <div className={styles.approvalText}>
                            <span>⚠️</span>
                            <span>
                              <strong>Action Gated:</strong> Step {exec.currentStepIndex + 1} requires human authorization before execution.
                            </span>
                          </div>
                          <div className={styles.approvalActions}>
                            <button
                              className={styles.approveBtn}
                              onClick={() => handleApprove(exec.id)}
                            >
                              ✔ Approve & Proceed
                            </button>
                            <button
                              className={styles.cancelBtn}
                              onClick={() => handleCancel(exec.id)}
                            >
                              ✖ Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Step Execution Details */}
                      {isExpanded && (
                        <div className={styles.stepDetailList}>
                          {exec.stepResults.map((step, idx) => (
                            <div key={step.stepId || idx} className={styles.stepItem}>
                              <div className={styles.stepHeader}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <span style={{ color: step.status === 'completed' ? '#10b981' : '#ef4444' }}>
                                    {step.status === 'completed' ? '✔' : '✖'}
                                  </span>
                                  <strong>Step {idx + 1}: {step.stepId}</strong>
                                  <span style={{ color: '#00e5ff', fontSize: '0.72rem' }}>
                                    [{step.tool}]
                                  </span>
                                </div>
                                <span style={{ color: '#64748b', fontSize: '0.72rem' }}>
                                  {step.durationMs}ms
                                </span>
                              </div>
                              {step.output && (
                                <div className={styles.stepSnippet}>
                                  {step.output.length > 300
                                    ? step.output.substring(0, 300) + '...'
                                    : step.output}
                                </div>
                              )}
                              {step.error && (
                                <div style={{ color: '#ef4444', fontSize: '0.74rem', marginTop: '0.25rem' }}>
                                  Error: {step.error}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 3: CREATE CUSTOM WORKFLOW */}
          {activeTab === 'create' && (
            <form className={styles.formContainer} onSubmit={handleCreateSubmit}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Workflow Name</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g. Laptop Battery Watchdog"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Description</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="Brief summary of what this automated workflow accomplishes"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Trigger Execution</label>
                <select
                  className={styles.select}
                  value={formTriggerType}
                  onChange={(e: any) => setFormTriggerType(e.target.value)}
                >
                  <option value="manual">Manual (On-Demand only)</option>
                  <option value="interval">Interval Timer (Every X Seconds)</option>
                  <option value="daily">Daily Schedule (Time of Day)</option>
                </select>
              </div>

              {formTriggerType === 'interval' && (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Interval Seconds (e.g. 1800 for 30m)</label>
                  <input
                    type="number"
                    className={styles.input}
                    value={formIntervalSec}
                    onChange={(e) => setFormIntervalSec(Number(e.target.value))}
                    min={30}
                  />
                </div>
              )}

              {formTriggerType === 'daily' && (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Time of Day (HH:MM)</label>
                  <input
                    type="time"
                    className={styles.input}
                    value={formDailyTime}
                    onChange={(e) => setFormDailyTime(e.target.value)}
                  />
                </div>
              )}

              {/* Step Builder */}
              <div className={styles.formGroup}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className={styles.formLabel}>Pipeline Steps ({formSteps.length})</label>
                  <button
                    type="button"
                    onClick={handleAddStep}
                    style={{
                      background: 'rgba(0, 229, 255, 0.15)',
                      border: '1px solid rgba(0, 229, 255, 0.3)',
                      color: '#00e5ff',
                      borderRadius: '6px',
                      padding: '0.25rem 0.65rem',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                    }}
                  >
                    + Add Step
                  </button>
                </div>

                {formSteps.map((step, idx) => (
                  <div
                    key={step.id || idx}
                    style={{
                      background: 'rgba(0,0,0,0.25)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      padding: '0.85rem',
                      borderRadius: '8px',
                      marginTop: '0.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f1f5f9' }}>
                        Step #{idx + 1}
                      </span>
                      {formSteps.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveStep(idx)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                          }}
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      className={styles.input}
                      placeholder="Step Name"
                      value={step.name}
                      onChange={(e) => {
                        const updated = [...formSteps];
                        updated[idx].name = e.target.value;
                        setFormSteps(updated);
                      }}
                      required
                    />

                    <select
                      className={styles.select}
                      value={step.tool}
                      onChange={(e) => {
                        const updated = [...formSteps];
                        updated[idx].tool = e.target.value;
                        setFormSteps(updated);
                      }}
                    >
                      <option value="system_info">system_info (Laptop Specs & Battery)</option>
                      <option value="date_time">date_time (Current Date & Time)</option>
                      <option value="fetch_news">fetch_news (Breaking Headlines)</option>
                      <option value="web_search">web_search (Live Web Knowledge)</option>
                      <option value="browse_webpage">browse_webpage (Web Article Extractor)</option>
                      <option value="send_email">send_email (Dispatch Email)</option>
                      <option value="send_message">send_message (Send WhatsApp/Telegram)</option>
                      <option value="generate_code">generate_code (Synthesize Code)</option>
                      <option value="generate_image">generate_image (Create Image)</option>
                    </select>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: '#f59e0b', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={step.requiresApproval || false}
                        onChange={(e) => {
                          const updated = [...formSteps];
                          updated[idx].requiresApproval = e.target.checked;
                          setFormSteps(updated);
                        }}
                      />
                      ⚠️ Require Human Authorization before executing this step
                    </label>
                  </div>
                ))}
              </div>

              <button type="submit" className={styles.primaryBtn} disabled={loading}>
                {loading ? 'Saving...' : '⚡ Save & Register Autonomous Workflow'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
