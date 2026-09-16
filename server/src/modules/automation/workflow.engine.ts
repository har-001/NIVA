// ============================================
// NIVA — Workflow Execution Engine
// ============================================

import {
  WorkflowDefinition,
  WorkflowExecution,
  WorkflowStep,
  StepResult,
} from './types';
import { logger } from '../../utils/logger';

function getToolRegistry() {
  return require('../tools/tool.registry').toolRegistry;
}

export class WorkflowEngine {
  private activeExecutions = new Map<string, WorkflowExecution>();

  public getExecution(id: string): WorkflowExecution | undefined {
    return this.activeExecutions.get(id);
  }

  public getAllExecutions(): WorkflowExecution[] {
    return Array.from(this.activeExecutions.values()).sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
  }

  /**
   * Start or resume execution of a multi-step workflow
   */
  public async execute(
    workflow: WorkflowDefinition,
    initialContext: Record<string, any> = {}
  ): Promise<WorkflowExecution> {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const execution: WorkflowExecution = {
      id: executionId,
      workflowId: workflow.id,
      workflowName: workflow.name,
      status: 'running',
      currentStepIndex: 0,
      stepResults: [],
      context: {
        ...initialContext,
        steps: {},
        workflow: { id: workflow.id, name: workflow.name },
      },
      startedAt: new Date().toISOString(),
    };

    this.activeExecutions.set(executionId, execution);
    return this.runFromStep(workflow, execution, 0);
  }

  /**
   * Resume an execution that was paused waiting for human approval
   */
  public async resume(executionId: string): Promise<WorkflowExecution> {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) {
      throw new Error(`Execution ${executionId} not found`);
    }

    if (execution.status !== 'waiting_approval' || !execution.pendingApprovalStep) {
      throw new Error(`Execution ${executionId} is not waiting for approval`);
    }

    const { stepIndex } = execution.pendingApprovalStep;
    execution.pendingApprovalStep = undefined;
    execution.status = 'running';

    return this.runFromStep(
      {
        id: execution.workflowId,
        name: execution.workflowName,
        trigger: { type: 'manual' },
        steps: execution.context._originalSteps || [],
        isActive: true,
        createdAt: execution.startedAt,
        updatedAt: execution.startedAt,
      },
      execution,
      stepIndex,
      true // isApproved
    );
  }

  /**
   * Cancel an active or paused execution
   */
  public cancel(executionId: string): WorkflowExecution {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) {
      throw new Error(`Execution ${executionId} not found`);
    }

    execution.status = 'cancelled';
    execution.completedAt = new Date().toISOString();
    return execution;
  }

  private async runFromStep(
    workflow: WorkflowDefinition,
    execution: WorkflowExecution,
    startIndex: number,
    isCurrentStepApproved: boolean = false
  ): Promise<WorkflowExecution> {
    execution.context._originalSteps = workflow.steps;
    logger.info(`[WorkflowEngine] Starting execution ${execution.id} for "${workflow.name}" from step ${startIndex}`);

    for (let i = startIndex; i < workflow.steps.length; i++) {
      const step = workflow.steps[i];
      execution.currentStepIndex = i;

      // 1. Check Condition
      if (step.condition && !this.evaluateCondition(step.condition, execution.context)) {
        logger.info(`[WorkflowEngine] Skipping step "${step.name}" (condition evaluated to false)`);
        execution.stepResults.push({
          stepId: step.id,
          stepName: step.name,
          tool: step.tool,
          status: 'skipped',
          durationMs: 0,
          executedAt: new Date().toISOString(),
        });
        continue;
      }

      // 2. Human Approval Check
      if (step.requiresApproval && (!isCurrentStepApproved || i !== startIndex)) {
        logger.warn(`[WorkflowEngine] Step "${step.name}" requires user approval. Pausing execution.`);
        execution.status = 'waiting_approval';
        execution.pendingApprovalStep = { stepIndex: i, step };
        return execution;
      }

      // Reset approval flag for subsequent steps
      isCurrentStepApproved = false;

      // 3. Resolve & Interpolate Step Arguments
      const resolvedArgs = this.interpolateArgs(step.arguments, execution.context);

      // 4. Execute with Retry Policy
      const startTime = Date.now();
      const maxRetries = step.retryPolicy?.maxRetries || 0;
      let attempt = 0;
      let stepSuccess = false;
      let stepOutput: any = null;
      let lastError = '';

      while (attempt <= maxRetries && !stepSuccess) {
        attempt++;
        try {
          logger.info(`[WorkflowEngine] Executing step "${step.name}" (tool: ${step.tool}, attempt ${attempt})`);
          const registry = getToolRegistry();
          const result = await registry.execute(step.tool, resolvedArgs, execution.context);
          if (result.isError) {
            throw new Error(result.result);
          }
          stepOutput = result.result;
          stepSuccess = true;
        } catch (err: any) {
          lastError = err.message || 'Tool execution failed';
          logger.warn(`[WorkflowEngine] Attempt ${attempt} failed for step "${step.name}": ${lastError}`);
          if (attempt <= maxRetries) {
            const delay = step.retryPolicy?.backoffMs || 500 * attempt;
            await new Promise((r) => setTimeout(r, delay));
          }
        }
      }

      const durationMs = Date.now() - startTime;

      if (!stepSuccess) {
        execution.status = 'failed';
        execution.error = `Step "${step.name}" failed after ${attempt} attempts: ${lastError}`;
        execution.completedAt = new Date().toISOString();
        execution.stepResults.push({
          stepId: step.id,
          stepName: step.name,
          tool: step.tool,
          status: 'failed',
          error: lastError,
          durationMs,
          executedAt: new Date().toISOString(),
        });
        return execution;
      }

      // Record Success
      execution.stepResults.push({
        stepId: step.id,
        stepName: step.name,
        tool: step.tool,
        status: 'completed',
        output: stepOutput,
        durationMs,
        executedAt: new Date().toISOString(),
      });

      // Update Context
      execution.context.steps[step.id] = {
        output: stepOutput,
        tool: step.tool,
      };
    }

    execution.status = 'completed';
    execution.completedAt = new Date().toISOString();
    logger.info(`[WorkflowEngine] Workflow "${workflow.name}" completed successfully! (${execution.stepResults.length} steps executed)`);

    return execution;
  }

  /**
   * Evaluate simple JS expressions safely with context variables
   */
  private evaluateCondition(condition: string, context: Record<string, any>): boolean {
    try {
      const clean = condition.trim();
      // Handle simple comparisons: context.battery < 20
      const fn = new Function('context', `try { with(context) { return Boolean(${clean}); } } catch(e) { return false; }`);
      return Boolean(fn(context));
    } catch {
      return true;
    }
  }

  /**
   * Replace templates like {{steps.step_1.output}} with actual context values
   */
  private interpolateArgs(args: Record<string, any>, context: Record<string, any>): Record<string, any> {
    const jsonStr = JSON.stringify(args);
    const replaced = jsonStr.replace(/\{\{([\w\.]+)\}\}/g, (_match, path) => {
      const parts = path.split('.');
      let val: any = context;
      for (const p of parts) {
        if (val && typeof val === 'object' && p in val) {
          val = val[p];
        } else {
          return '';
        }
      }
      return typeof val === 'string' ? val : JSON.stringify(val);
    });

    try {
      return JSON.parse(replaced);
    } catch {
      return args;
    }
  }
}

export const workflowEngine = new WorkflowEngine();
