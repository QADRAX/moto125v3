import type { Job } from "../jobs/types";
import type { Logger } from "../logger";
import type { JobType } from "@moto125/content-ops-shared";
import { CronJob } from "cron";

type CronHandle = CronJob;

/**
 * Scheduler that manages Job registration, per-type locking,
 * and optional cron scheduling. A job without `cron` runs only manually.
 */
export class Scheduler {
  private jobsById = new Map<string, Job>();
  private idByType = new Map<JobType, string>();
  private runningTypes = new Set<JobType>();
  private cronById = new Map<string, CronHandle>();

  constructor(private log: Logger) {}

  /** Register a job (1 per type). Schedules cron if job.cron is defined. */
  register(job: Job) {
    if (this.idByType.has(job.type)) {
      throw new Error(`Job type already registered: ${job.type}`);
    }
    if (this.jobsById.has(job.id)) {
      throw new Error(`Job id already registered: ${job.id}`);
    }

    this.jobsById.set(job.id, job);
    this.idByType.set(job.type, job.id);

    if (job.cron) {
      this.schedule(job.id);
      this.log.info(
        `Scheduled job id=${job.id} type=${job.type} cron=${job.cron}`
      );
    } else {
      this.log.info(`Registered manual job id=${job.id} type=${job.type}`);
    }
  }

  /** Returns true if a job with this ID exists. */
  has(id: string): boolean {
    return this.jobsById.has(id);
  }

  /** Returns true if a job of this type exists. */
  hasType(type: JobType): boolean {
    return this.idByType.has(type);
  }

  /** Return a job by id or undefined. */
  get(id: string): Job | undefined {
    return this.jobsById.get(id);
  }

  /** Unregister a job and stop its cron schedule (if any). */
  unregister(id: string): boolean {
    const job = this.jobsById.get(id);
    if (!job) return false;

    this.stopSchedule(id);
    this.jobsById.delete(id);
    this.idByType.delete(job.type);

    this.log.info(`Unregistered job id=${id} type=${job.type}`);
    return true;
  }

  /**
   * Execute a job immediately, with a per-type lock to avoid
   * concurrent executions of the same type.
   */
  async execute(id: string) {
    const job = this.jobsById.get(id);
    if (!job) throw new Error(`Job not found: ${id}`);

    // Lock by type
    if (this.runningTypes.has(job.type)) {
      const err = new Error(`Job type is already running: ${job.type}`);
      (err as any).code = "JOB_TYPE_LOCKED";
      throw err;
    }

    this.runningTypes.add(job.type);
    const start = Date.now();
    try {
      const res = await job.run();

      job.state.lastRunAt = new Date().toISOString();
      job.state.lastDurationMs = Date.now() - start;
      job.state.runs += 1;

      job.state.processed = (job.state.processed ?? 0) + res.processed;
      job.state.uploaded = (job.state.uploaded ?? 0) + res.uploaded;
      job.state.skipped = (job.state.skipped ?? 0) + res.skipped;
      job.state.errors = (job.state.errors ?? 0) + res.errors;

      return res;
    } catch (e: any) {
      job.state.lastRunAt = new Date().toISOString();
      job.state.lastDurationMs = Date.now() - start;
      job.state.lastError = e?.message ?? String(e);
      throw e;
    } finally {
      this.runningTypes.delete(job.type);
      this.refreshNextRunAt(job.id);
    }
  }

  /** Return status summary for all registered jobs. */
  status() {
    return Array.from(this.jobsById.values()).map((j) => ({
      id: j.id,
      name: j.name,
      cron: j.cron, // undefined → manual-only
      state: j.state,
      type: j.type,
    }));
  }

  /**
   * Restart: clears all cron handles and re-schedules
   * those jobs that have a `cron` expression.
   */
  restart() {
    for (const [id, h] of this.cronById) {
      try {
        h.stop();
      } catch {}
      this.cronById.delete(id);
    }

    for (const job of this.jobsById.values()) {
      if (job.cron) this.schedule(job.id);
    }

    this.log.info("Scheduler restarted");
  }

  /**
   * Change the cron expression of a job.
   * If cron is undefined, becomes manual-only.
   */
  reschedule(id: string, cron: string | undefined) {
    const job = this.jobsById.get(id);
    if (!job) throw new Error(`Job not found: ${id}`);

    job.cron = cron;
    this.stopSchedule(id);

    if (job.cron) {
      this.schedule(id);
      this.log.info(`Rescheduled job id=${id} cron=${job.cron}`);
    } else {
      this.log.info(`Job id=${id} set to manual-only (no cron)`);
      job.state.nextRunAt = undefined;
    }
  }

  /** Schedule a job with its cron expression. */
  private schedule(id: string) {
    const job = this.jobsById.get(id);
    if (!job) throw new Error(`Job not found: ${id}`);
    if (!job.cron) return;

    this.stopSchedule(id); // avoid duplicates

    const handle = new CronJob(
      job.cron,
      async () => {
        try {
          await this.execute(id);
        } catch (err: any) {
          const code = (err && (err as any).code) || "";
          if (code === "JOB_TYPE_LOCKED") {
            this.log.warn(
              `Skipped scheduled run (locked) id=${id} type=${job.type}`
            );
            return;
          }
          this.log.error(
            `Error on scheduled run id=${id}: ${err?.message ?? String(err)}`
          );
        }
      },
      null,
      false
    );

    handle.start();
    this.cronById.set(id, handle);
    this.refreshNextRunAt(id);
  }

  /** Stop a cron schedule if it exists. */
  private stopSchedule(id: string) {
    const h = this.cronById.get(id);
    if (h) {
      try {
        h.stop();
      } catch {}
      this.cronById.delete(id);
    }
  }

  /** Update nextRunAt for the job state. */
  private refreshNextRunAt(id: string) {
    const job = this.jobsById.get(id);
    if (!job) return;
    const h = this.cronById.get(id);
    if (!h) {
      job.state.nextRunAt = undefined;
      return;
    }
    try {
      const next = h.nextDate().toJSDate();
      job.state.nextRunAt = next.toISOString();
    } catch {
      job.state.nextRunAt = undefined;
    }
  }
}
