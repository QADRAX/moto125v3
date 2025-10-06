/**
 * A scheduled job with lifecycle and metrics.
 */
export interface Job {
  /** Unique ID for routes and logs. */
  id: string;
  /** Human-friendly name. */
  name: string;
  /** Cron expression. */
  cron: string;
  /** Whether the job is enabled. */
  enabled: boolean;
  /** If true, job runs once at service startup. */
  startOnBoot: boolean;

  /** Main logic of the job. */
  run: () => Promise<JobRunResult>;

  /** Latest runtime status/metrics (updated by scheduler). */
  state: JobState;
}

/** Mutable state persisted in memory by the scheduler. */
export interface JobState {
  lastRunAt?: string;
  lastDurationMs?: number;
  lastError?: string;
  runs: number;
  uploaded?: number;
  skipped?: number;
  processed?: number;
  errors?: number;
  nextRunAt?: string;
}

/** Result returned by job implementations after a run. */
export interface JobRunResult {
  processed: number;
  uploaded: number;
  skipped: number;
  errors: number;
}
