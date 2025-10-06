import type { JobItem } from "./jobs";
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
