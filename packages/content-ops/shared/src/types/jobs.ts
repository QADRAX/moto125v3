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

/** Job info exposed to the UI. */
export interface JobItem {
  id: string;
  name: string;
  cron: string;
  enabled: boolean;
  startOnBoot: boolean;
  state: JobState;
}

/** Result of a job run (single execution). */
export interface JobRunResult {
  processed: number;
  uploaded: number;
  skipped: number;
  errors: number;
}
