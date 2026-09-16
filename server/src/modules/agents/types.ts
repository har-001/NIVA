// ============================================
// NIVA — Multi-Agent Orchestration Types
// ============================================

export type AgentRole =
  | 'orchestrator'
  | 'researcher'
  | 'coder'
  | 'visionary'
  | 'archivist'
  | 'executor'
  | 'guardian';

export interface AgentProfile {
  id: string;
  role: AgentRole;
  name: string;
  title: string;
  avatar: string;
  description: string;
  systemPrompt: string;
  allowedTools: string[];
  capabilities: string[];
  status: 'idle' | 'working' | 'ready';
}

export type SubTaskStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'waiting_approval';

export interface SubTask {
  id: string;
  title: string;
  description: string;
  assignedRole: AgentRole;
  dependsOn: string[]; // IDs of predecessor subtasks
  status: SubTaskStatus;
  input?: Record<string, any>;
  output?: any;
  toolUsed?: string;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  error?: string;
}

export interface BlackboardEntry {
  key: string;
  authorRole: AgentRole;
  authorAgentName: string;
  data: any;
  timestamp: string;
}

export interface MissionPlan {
  id: string;
  goal: string;
  userId?: string;
  status: 'planned' | 'executing' | 'completed' | 'failed' | 'waiting_approval';
  subtasks: SubTask[];
  blackboard: Record<string, BlackboardEntry>;
  finalSummary?: string;
  verdict?: {
    isSafe: boolean;
    confidence: number;
    notes: string;
  };
  totalDurationMs?: number;
  createdAt: string;
  completedAt?: string;
}

export interface AgentEvent {
  type:
    | 'mission_planned'
    | 'subtask_started'
    | 'subtask_completed'
    | 'subtask_failed'
    | 'blackboard_updated'
    | 'verification_done'
    | 'mission_completed';
  missionId: string;
  subtaskId?: string;
  role?: AgentRole;
  message: string;
  timestamp: string;
  payload?: any;
}
