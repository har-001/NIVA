// ============================================
// NIVA — Automation & Workflow Engine Types
// ============================================

export type TriggerType = 'schedule' | 'event' | 'manual';

export interface ScheduleTriggerConfig {
  /**
   * Cron expression (e.g. '0 9 * * *') or interval format (e.g. 'every_1h', 'every_30m', 'daily_09:00')
   */
  cron?: string;
  intervalSeconds?: number;
  timeOfDay?: string; // HH:mm format, e.g. "09:00"
}

export interface EventTriggerConfig {
  eventName: string; // e.g. 'battery_low', 'startup', 'memory_saved'
  condition?: string;
}

export interface WorkflowTrigger {
  type: TriggerType;
  schedule?: ScheduleTriggerConfig;
  event?: EventTriggerConfig;
}

export interface WorkflowStep {
  id: string;
  name: string;
  tool: string;
  arguments: Record<string, any>;
  condition?: string; // Optional JS-like condition expression
  requiresApproval?: boolean; // Pause execution until user explicitly approves
  retryPolicy?: {
    maxRetries: number;
    backoffMs?: number;
  };
}

export interface WorkflowDefinition {
  id: string;
  userId?: string;
  name: string;
  description?: string;
  trigger: WorkflowTrigger;
  steps: WorkflowStep[];
  isActive: boolean;
  lastRunAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type ExecutionStatus =
  | 'pending'
  | 'running'
  | 'waiting_approval'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface StepResult {
  stepId: string;
  stepName: string;
  tool: string;
  status: 'completed' | 'failed' | 'skipped' | 'waiting_approval';
  output?: any;
  error?: string;
  durationMs: number;
  executedAt: string;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowName: string;
  status: ExecutionStatus;
  currentStepIndex: number;
  stepResults: StepResult[];
  context: Record<string, any>; // Accumulated context and variables
  pendingApprovalStep?: {
    stepIndex: number;
    step: WorkflowStep;
  };
  error?: string;
  startedAt: string;
  completedAt?: string;
}
