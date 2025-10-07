import type { JobItem, JobType } from "./jobs";
import type { LogEntry } from "./logs";

/** GET /jobs -> { data: JobItem[] } */
export interface GetJobsResponse {
  data: JobItem[];
}

/** POST /jobs/:id/run -> { ok: true } | { ok: false, error: string } */
export interface PostRunJobResponse {
  ok: boolean;
  error?: string;
}

/** POST /scheduler/restart -> { ok: true } */
export interface PostRestartResponse {
  ok: boolean;
}

/** GET /health -> { ok: true, ts: string, name?: string, version?: string } */
export interface HealthResponse {
  ok: true;
  ts: string;
  name?: string;
  version?: string;
}

/** Server-sent events for /logs/stream emit LogEntry lines as data payloads. */
export type LogsEvent = LogEntry;

/**
 * POST /jobs/sync-media
 * Create/register a sync-media job with runtime configuration.
 */
export interface PostCreateSyncMediaJobRequest {
  /** Unique job id; if omitted, server may generate one. */
  id?: string;
  /** Cron expression for scheduling. */
  cron: string;
  /** Whether the job should be scheduled (enabled). */
  enabled: boolean;
  /** Internal concurrency setting for the processor. */
  concurrency: number;
}

export interface PostCreateJobResponse {
  ok: boolean;
  /** The final id registered in the scheduler. */
  id?: string;
  /** Which job type was created. */
  type?: JobType;
  /** Error message when ok=false. */
  error?: string;
}

/** DELETE /jobs/:id */
export interface DeleteJobResponse {
  ok: boolean;
  id?: string;
  error?: string;
}
