// ============================================
// NIVA — Automation Service (Orchestration & Seeds)
// ============================================

import { WorkflowDefinition, WorkflowExecution } from './types';
import { workflowEngine } from './workflow.engine';
import { schedulerService } from './scheduler.service';
import { logger } from '../../utils/logger';

export class AutomationService {
  private workflows = new Map<string, WorkflowDefinition>();

  constructor() {
    this.seedDefaultWorkflows();
    schedulerService.setWorkflowsProvider(() => this.getAllWorkflows());
  }

  public getAllWorkflows(): WorkflowDefinition[] {
    return Array.from(this.workflows.values());
  }

  public getWorkflowById(id: string): WorkflowDefinition | undefined {
    return this.workflows.get(id);
  }

  public getWorkflowByName(name: string): WorkflowDefinition | undefined {
    const lower = name.toLowerCase().trim();
    return Array.from(this.workflows.values()).find(
      (w) => w.name.toLowerCase().includes(lower) || lower.includes(w.name.toLowerCase())
    );
  }

  public createWorkflow(data: {
    name: string;
    description?: string;
    trigger?: any;
    steps: any[];
    isActive?: boolean;
  }): WorkflowDefinition {
    const id = `wf_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const workflow: WorkflowDefinition = {
      id,
      name: data.name,
      description: data.description || 'Custom user automation workflow',
      trigger: data.trigger || { type: 'manual' },
      steps: data.steps,
      isActive: data.isActive !== undefined ? data.isActive : true,
      createdAt: now,
      updatedAt: now,
    };

    this.workflows.set(id, workflow);
    logger.info(`[AutomationService] Created workflow "${workflow.name}" (${id})`);
    return workflow;
  }

  public toggleWorkflow(id: string, active?: boolean): WorkflowDefinition {
    const wf = this.workflows.get(id);
    if (!wf) throw new Error(`Workflow ${id} not found`);

    wf.isActive = active !== undefined ? active : !wf.isActive;
    wf.updatedAt = new Date().toISOString();
    logger.info(`[AutomationService] Workflow "${wf.name}" isActive toggled to ${wf.isActive}`);
    return wf;
  }

  public deleteWorkflow(id: string): boolean {
    const deleted = this.workflows.delete(id);
    if (deleted) {
      logger.info(`[AutomationService] Deleted workflow ${id}`);
    }
    return deleted;
  }

  public async runWorkflow(
    idOrName: string,
    initialContext?: Record<string, any>
  ): Promise<WorkflowExecution> {
    const wf = this.getWorkflowById(idOrName) || this.getWorkflowByName(idOrName);
    if (!wf) {
      throw new Error(`Workflow "${idOrName}" not found`);
    }

    wf.lastRunAt = new Date().toISOString();
    return workflowEngine.execute(wf, initialContext);
  }

  public getExecutions(): WorkflowExecution[] {
    return workflowEngine.getAllExecutions();
  }

  public async approveExecution(executionId: string): Promise<WorkflowExecution> {
    return workflowEngine.resume(executionId);
  }

  public cancelExecution(executionId: string): WorkflowExecution {
    return workflowEngine.cancel(executionId);
  }

  /**
   * Seed 4 pre-built, robust autonomous workflows
   */
  private seedDefaultWorkflows(): void {
    const seeds: WorkflowDefinition[] = [
      {
        id: 'wf_morning_briefing',
        name: 'Morning Intelligence Briefing',
        description: 'Compiles real-time weather, breaking headlines, and laptop system health into a daily morning executive digest.',
        trigger: {
          type: 'schedule',
          schedule: {
            timeOfDay: '09:00',
            cron: '0 9 * * *',
          },
        },
        steps: [
          {
            id: 'step_date',
            name: 'Check Date & Time',
            tool: 'date_time',
            arguments: {},
          },
          {
            id: 'step_news',
            name: 'Fetch Top Headlines',
            tool: 'fetch_news',
            arguments: { topic: 'Trending', limit: 3 },
          },
          {
            id: 'step_system',
            name: 'Check Laptop Telemetry',
            tool: 'system_info',
            arguments: {},
          },
        ],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'wf_battery_watchdog',
        name: 'Laptop Hardware & Battery Watchdog',
        description: 'Monitors laptop battery percentage, CPU load, and memory usage every 30 minutes to safeguard hardware health.',
        trigger: {
          type: 'schedule',
          schedule: {
            intervalSeconds: 1800, // 30 mins
          },
        },
        steps: [
          {
            id: 'step_check_health',
            name: 'Audit Battery & Hardware Specs',
            tool: 'system_info',
            arguments: {},
          },
        ],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'wf_ai_research_agent',
        name: 'Autonomous AI Topic Research',
        description: 'Conducts live web search for artificial intelligence breakthroughs, inspects top citations, and prepares an executive briefing.',
        trigger: {
          type: 'manual',
        },
        steps: [
          {
            id: 'step_search',
            name: 'Search Web for AI Breakthroughs',
            tool: 'web_search',
            arguments: { query: 'AI and neural models latest breakthroughs', limit: 3 },
          },
        ],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'wf_critical_action_approval',
        name: 'Sensitive Action with User Approval',
        description: 'Demonstrates human-in-the-loop security: reads system status, pauses for explicit user approval before dispatching an email.',
        trigger: {
          type: 'manual',
        },
        steps: [
          {
            id: 'step_audit',
            name: 'Verify System Health',
            tool: 'system_info',
            arguments: {},
          },
          {
            id: 'step_sensitive_email',
            name: 'Dispatch Security Report via Email',
            tool: 'send_email',
            arguments: {
              recipient: 'harshit@niva.ai',
              subject: 'NIVA Automated Security Digest',
              body: 'All systems verified and operational.',
            },
            requiresApproval: true, // Human-in-the-loop gating!
          },
        ],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    for (const s of seeds) {
      this.workflows.set(s.id, s);
    }
    logger.info(`[AutomationService] Seeded ${seeds.length} autonomous workflows`);
  }
}

export const automationService = new AutomationService();
