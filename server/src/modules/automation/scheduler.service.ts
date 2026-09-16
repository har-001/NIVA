// ============================================
// NIVA — In-Process Lightweight Task Scheduler
// ============================================

import { WorkflowDefinition } from './types';
import { workflowEngine } from './workflow.engine';
import { logger } from '../../utils/logger';

export class SchedulerService {
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;
  private workflowsProvider: (() => WorkflowDefinition[]) | null = null;

  public setWorkflowsProvider(provider: () => WorkflowDefinition[]): void {
    this.workflowsProvider = provider;
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    logger.info('[SchedulerService] Starting in-process workflow scheduler (30s tick)');

    // Run check every 30 seconds
    this.timer = setInterval(() => this.tick(), 30000);
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
    logger.info('[SchedulerService] Workflow scheduler stopped');
  }

  /**
   * Evaluate schedules and trigger ready workflows
   */
  public async tick(): Promise<void> {
    if (!this.workflowsProvider) return;

    try {
      const activeWorkflows = this.workflowsProvider().filter(
        (w) => w.isActive && w.trigger.type === 'schedule' && w.trigger.schedule
      );

      const now = new Date();

      for (const workflow of activeWorkflows) {
        if (this.shouldTrigger(workflow, now)) {
          logger.info(`[SchedulerService] Triggering scheduled workflow: "${workflow.name}" (${workflow.id})`);
          workflow.lastRunAt = now.toISOString();

          // Execute asynchronously in background
          workflowEngine.execute(workflow).catch((err) => {
            logger.error(`[SchedulerService] Scheduled run failed for "${workflow.name}": ${err.message}`);
          });
        }
      }
    } catch (err: any) {
      logger.error(`[SchedulerService] Error during scheduler tick: ${err.message}`);
    }
  }

  private shouldTrigger(workflow: WorkflowDefinition, now: Date): boolean {
    const schedule = workflow.trigger.schedule;
    if (!schedule) return false;

    const lastRun = workflow.lastRunAt ? new Date(workflow.lastRunAt).getTime() : 0;
    const nowMs = now.getTime();

    // 1. Interval Seconds
    if (schedule.intervalSeconds && schedule.intervalSeconds > 0) {
      if (nowMs - lastRun >= schedule.intervalSeconds * 1000) {
        return true;
      }
    }

    // 2. Specific Time of Day (e.g. "09:00")
    if (schedule.timeOfDay) {
      const [targetHour, targetMinute] = schedule.timeOfDay.split(':').map(Number);
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      if (currentHour === targetHour && currentMinute === targetMinute) {
        // Ensure it doesn't trigger multiple times in the same minute
        const elapsedSinceLast = nowMs - lastRun;
        if (elapsedSinceLast > 65000) {
          return true;
        }
      }
    }

    // 3. Simple Cron Shorthands (Hourly, Daily)
    if (schedule.cron) {
      const cron = schedule.cron.trim();
      // '0 * * * *' -> every hour on the hour
      if (cron === '0 * * * *' && now.getMinutes() === 0 && nowMs - lastRun > 65000) {
        return true;
      }
      // '*/15 * * * *' -> every 15 minutes
      if (cron.startsWith('*/') && nowMs - lastRun > 60000) {
        const interval = parseInt(cron.split(' ')[0].replace('*/', ''), 10);
        if (interval > 0 && now.getMinutes() % interval === 0) {
          return true;
        }
      }
    }

    return false;
  }
}

export const schedulerService = new SchedulerService();
