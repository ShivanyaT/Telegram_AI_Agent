/**
 * SCHEDULER MODULE - Cron jobs and task scheduling
 * Saved as src/scheduler.ts
 * 
 * Handles:
 * - Cron job registration and execution
 * - Heartbeat tracking (last execution times)
 * - Daily memory consolidation
 * - Scheduled reminders
 * - Recurring tasks
 */

import cron from 'node-cron';
import { v4 as uuidv4 } from 'uuid';
import { CronJob, HeartbeatState, BotError, ErrorCode } from './types';
import fs from 'fs/promises';
import path from 'path';

/**
 * Scheduler - Manages cron jobs and scheduled tasks
 */
export class Scheduler {
  private jobs: Map<string, cron.ScheduledTask> = new Map();
  private heartbeatFilePath: string;
  private heartbeatState: Map<string, HeartbeatState> = new Map();

  constructor(stateDir: string) {
    this.heartbeatFilePath = path.join(stateDir, 'heartbeat-state.json');
  }

  /**
   * Initialize scheduler - load heartbeat state
   */
  async initialize(): Promise<void> {
    try {
      // Create state directory if it doesn't exist
      const stateDir = path.dirname(this.heartbeatFilePath);
      await fs.mkdir(stateDir, { recursive: true });

      // Load heartbeat state if it exists
      try {
        const content = await fs.readFile(this.heartbeatFilePath, 'utf-8');
        const state = JSON.parse(content);

        for (const [jobId, heartbeat] of Object.entries(state)) {
          this.heartbeatState.set(jobId, heartbeat as HeartbeatState);
        }

        console.log(`[Scheduler] Loaded ${this.heartbeatState.size} heartbeat states`);
      } catch {
        // No existing heartbeat file, that's okay
      }
    } catch (error) {
      throw new BotError(
        ErrorCode.AGENT_EXECUTION_ERROR,
        `Failed to initialize scheduler: ${error}`
      );
    }
  }

  /**
   * Register a new cron job
   *
   * @param name - Job name
   * @param cronExpression - Cron expression (e.g., "0 9 * * *" for daily at 9am)
   * @param handler - Function to call when job runs
   */
  async registerJob(
    name: string,
    cronExpression: string,
    handler: () => Promise<void>
  ): Promise<string> {
    const jobId = uuidv4();

    try {
      // Validate cron expression
      if (!cron.validate(cronExpression)) {
        throw new Error(`Invalid cron expression: ${cronExpression}`);
      }

      console.log(`[Scheduler] Registering job: ${name}`);
      console.log(`[Scheduler] Cron: ${cronExpression}`);

      // Schedule the job
      const task = cron.schedule(cronExpression, async () => {
        try {
          console.log(`[Scheduler] Executing: ${name}`);
          await handler();

          // Update heartbeat
          this.updateHeartbeat(jobId, true);
        } catch (error) {
          console.error(`[Scheduler] Job failed: ${name}`, error);
          this.updateHeartbeat(jobId, false);
        }
      });

      // Store the job
      this.jobs.set(jobId, task);

      // Initialize heartbeat
      this.heartbeatState.set(jobId, {
        jobId,
        lastExecutedAt: new Date(),
        nextScheduledAt: this.getNextExecution(cronExpression),
        failureCount: 0,
        successCount: 0,
      });

      // Save heartbeat state
      await this.saveHeartbeat();

      console.log(`[Scheduler] Job registered with ID: ${jobId}`);
      return jobId;
    } catch (error) {
      throw new BotError(
        ErrorCode.AGENT_EXECUTION_ERROR,
        `Failed to register job: ${error}`
      );
    }
  }

  /**
   * Unregister a cron job
   */
  async unregisterJob(jobId: string): Promise<void> {
    const task = this.jobs.get(jobId);
    if (task) {
      task.stop();
      this.jobs.delete(jobId);
      this.heartbeatState.delete(jobId);
      await this.saveHeartbeat();
      console.log(`[Scheduler] Unregistered job: ${jobId}`);
    }
  }

  /**
   * Get all registered jobs
   */
  getJobs(): CronJob[] {
    const result: CronJob[] = [];

    for (const [jobId, heartbeat] of this.heartbeatState) {
      result.push({
        id: jobId,
        name: jobId,
        cronExpression: '(unknown)',
        handler: '(function)',
        lastRun: heartbeat.lastExecutedAt,
        active: this.jobs.has(jobId),
      });
    }

    return result;
  }

  /**
   * Get heartbeat status for a job
   */
  getHeartbeat(jobId: string): HeartbeatState | undefined {
    return this.heartbeatState.get(jobId);
  }

  /**
   * Stop all jobs (cleanup)
   */
  stopAll(): void {
    console.log('[Scheduler] Stopping all jobs...');

    for (const task of this.jobs.values()) {
      task.stop();
    }

    this.jobs.clear();
    console.log('[Scheduler] All jobs stopped');
  }

  /**
   * Update heartbeat for a job (call when job executes)
   */
  private updateHeartbeat(jobId: string, success: boolean): void {
    const heartbeat = this.heartbeatState.get(jobId);
    if (!heartbeat) return;

    heartbeat.lastExecutedAt = new Date();

    if (success) {
      heartbeat.successCount++;
    } else {
      heartbeat.failureCount++;
    }

    // Calculate next execution (simplified)
    heartbeat.nextScheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  }

  /**
   * Save heartbeat state to file
   */
  private async saveHeartbeat(): Promise<void> {
    try {
      const state: Record<string, HeartbeatState> = {};

      for (const [jobId, heartbeat] of this.heartbeatState) {
        state[jobId] = heartbeat;
      }

      await fs.writeFile(
        this.heartbeatFilePath,
        JSON.stringify(state, null, 2)
      );
    } catch (error) {
      console.error('[Scheduler] Failed to save heartbeat:', error);
    }
  }

  /**
   * Calculate next execution time for a cron expression
   * Simplified version - in production use a library like cron-parser
   */
  private getNextExecution(cronExpression: string): Date {
    // Placeholder - returns tomorrow for daily jobs
    return new Date(Date.now() + 24 * 60 * 60 * 1000);
  }
}

/**
 * Example job handlers
 */
export const JobHandlers = {
  /**
   * Send reminder to user
   */
  sendReminder: async (message: string): Promise<void> => {
    console.log(`[Job] Sending reminder: ${message}`);
    // TODO: Actually send message via Telegram
  },

  /**
   * Consolidate daily memory
   */
  consolidateMemory: async (memoryManager: any): Promise<void> => {
    console.log('[Job] Consolidating daily memory...');
    // TODO: Call memoryManager.consolidateDailyMemory()
  },

  /**
   * Post scheduled message to group
   */
  postToGroup: async (
    groupId: string,
    message: string
  ): Promise<void> => {
    console.log(`[Job] Posting to ${groupId}: ${message}`);
    // TODO: Actually post via Telegram
  },

  /**
   * Index group messages (RAG)
   */
  indexMessages: async (
    groupId: string,
    ragManager: any
  ): Promise<void> => {
    console.log(`[Job] Indexing messages for ${groupId}...`);
    // TODO: Fetch messages and index them
  },
};

export default Scheduler;
