export type JobType = "sync-media";

/** Live, mutable job state reported by the server. */
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

export interface JobBase {
  id: string;
  type: JobType;
  name: string;
  cron?: string;
  state: JobState;
}

export interface JobItem extends JobBase {}

/** Result of a job run (single execution). */
export interface JobRunResult {
  processed: number;
  uploaded: number;
  skipped: number;
  errors: number;
}
