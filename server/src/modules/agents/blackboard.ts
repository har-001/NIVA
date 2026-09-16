// ============================================
// NIVA — Inter-Agent Blackboard Working Memory
// ============================================

import { AgentRole, BlackboardEntry } from './types';

export class AgentBlackboard {
  private entries: Map<string, BlackboardEntry> = new Map();

  constructor(initialData?: Record<string, any>) {
    if (initialData) {
      for (const [key, value] of Object.entries(initialData)) {
        this.set(key, value, 'orchestrator', 'NIVA Lead');
      }
    }
  }

  set(key: string, data: any, role: AgentRole, agentName: string): void {
    this.entries.set(key, {
      key,
      authorRole: role,
      authorAgentName: agentName,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  get<T = any>(key: string): T | undefined {
    return this.entries.get(key)?.data;
  }

  has(key: string): boolean {
    return this.entries.has(key);
  }

  getEntry(key: string): BlackboardEntry | undefined {
    return this.entries.get(key);
  }

  getAllEntries(): Record<string, BlackboardEntry> {
    const result: Record<string, BlackboardEntry> = {};
    for (const [k, v] of this.entries.entries()) {
      result[k] = v;
    }
    return result;
  }

  getRecentContextSummary(): string {
    const lines: string[] = [];
    for (const [k, v] of this.entries.entries()) {
      const preview =
        typeof v.data === 'string'
          ? v.data.slice(0, 160)
          : JSON.stringify(v.data).slice(0, 160);
      lines.push(`- [${v.authorRole}] ${k}: ${preview}`);
    }
    return lines.join('\n');
  }

  clear(): void {
    this.entries.clear();
  }
}
