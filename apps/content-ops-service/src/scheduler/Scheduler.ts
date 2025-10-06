import { schedule, type ScheduledTask } from "node-cron";
import type { Job, JobRunResult } from "../jobs/types";
import type { Logger } from "../logger";

/**
 * Orchestrates cron scheduling, manual triggers, and job state updates.
 */
export class Scheduler {
  private tasks = new Map<string, ScheduledTask>();
  private jobs = new Map<string, Job>();

  constructor(private log: Logger) {}

  /**
   * Register a job and schedule it if enabled.
   * If the job ID already exists, an error is thrown.
   */
  register(job: Job) {
    if (this.jobs.has(job.id)) {
      throw new Error(`Job "${job.id}" is already registered`);
    }
    this.jobs.set(job.id, job);

    if (job.enabled) {
      const task = schedule(job.cron, () => {
        void this.execute(job.id);
      });
      // node-cron v4: explicit start (no TaskOptions.scheduled)
      task.start();

      this.tasks.set(job.id, task);
      this.log.info(`Scheduled job "${job.id}" with cron "${job.cron}"`);
      job.state.nextRunAt = this.nextRunEstimate(task);
    } else {
      this.log.info(`Job "${job.id}" is disabled`);
    }
  }

  /**
   * Runs all jobs configured to start on boot.
   * Executes sequentially to simplify log reading during startup.
   */
  async runJobsOnBoot() {
    for (const job of this.jobs.values()) {
      if (job.enabled && job.startOnBoot) {
        this.log.info(`Running job "${job.id}" on boot...`);
        await this.execute(job.id);
      }
    }
  }

  /**
   * Execute a given job immediately (manual trigger).
   * Updates job state and logs result/exception.
   */
  async execute(jobId: string) {
    const job = this.jobs.get(jobId);
    if (!job) throw new Error(`Unknown job: ${jobId}`);

    const started = Date.now();
    job.state.lastRunAt = new Date(started).toISOString();
    this.log.info(`Job "${jobId}" started`);

    try {
      const res: JobRunResult = await job.run();
      const ended = Date.now();

      job.state.runs += 1;
      job.state.processed = (job.state.processed ?? 0) + res.processed;
      job.state.uploaded = (job.state.uploaded ?? 0) + res.uploaded;
      job.state.skipped = (job.state.skipped ?? 0) + res.skipped;
      job.state.errors = (job.state.errors ?? 0) + res.errors;
      job.state.lastDurationMs = ended - started;
      job.state.lastError = undefined;

      this.log.info(`Job "${jobId}" finished`, {
        durationMs: job.state.lastDurationMs,
        processed: res.processed,
        uploaded: res.uploaded,
        skipped: res.skipped,
        errors: res.errors,
      });
    } catch (err: any) {
      const ended = Date.now();
      job.state.lastDurationMs = ended - started;
      job.state.lastError = err?.message ?? String(err);
      job.state.errors = (job.state.errors ?? 0) + 1;

      this.log.error(`Job "${jobId}" failed`, { error: job.state.lastError });
    }

    // Update next run estimation if scheduled
    const task = this.tasks.get(jobId);
    if (task) job.state.nextRunAt = this.nextRunEstimate(task);
  }

  /**
   * Stops all cron tasks. Jobs remain registered, only schedules are cleared.
   */
  stopAll() {
    for (const [, task] of this.tasks) {
      try {
        task.stop();
      } catch {
        // node-cron v4 stop() is safe, but keep defensive
      }
    }
    this.tasks.clear();
    this.log.warn("All cron tasks stopped");
  }

  /**
   * Restarts all schedules for currently registered jobs (enabled ones).
   * Useful after config reloads or when triggered via HTTP endpoint.
   */
  restart() {
    this.stopAll();

    for (const job of this.jobs.values()) {
      if (!job.enabled) continue;

      const task = schedule(job.cron, () => {
        void this.execute(job.id);
      });
      task.start();

      this.tasks.set(job.id, task);
      this.log.info(`Rescheduled job "${job.id}" with cron "${job.cron}"`);
      job.state.nextRunAt = this.nextRunEstimate(task);
    }
  }

  /**
   * Returns a brief status for all jobs including their last/next run info.
   */
  status() {
    return [...this.jobs.values()].map((j) => ({
      id: j.id,
      name: j.name,
      cron: j.cron,
      enabled: j.enabled,
      startOnBoot: j.startOnBoot,
      state: j.state,
    }));
  }

  /**
   * node-cron v4 does not expose a "next run" API.
   * Keeping this method for future extension or external estimation.
   */
  private nextRunEstimate(_task: ScheduledTask): string | undefined {
    return undefined;
  }
}
