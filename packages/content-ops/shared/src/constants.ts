/** HTTP header constants used by server & UI */
export const HEADERS = {
  RATE_LIMIT_LIMIT: "X-RateLimit-Limit",
  RATE_LIMIT_REMAINING: "X-RateLimit-Remaining",
  RETRY_AFTER: "Retry-After"
} as const;

/** Common API routes (single source of truth) */
export const ROUTES = {
  HEALTH: "/health",
  JOBS: "/jobs",
  JOB_RUN: (id: string) => `/jobs/${encodeURIComponent(id)}/run`,
  JOBS_SYNC_MEDIA: "/jobs/sync-media",
  JOB_DELETE: (id: string) => `/jobs/${encodeURIComponent(id)}`,
  SCHEDULER_RESTART: "/scheduler/restart",
  LOGS_STREAM: "/logs/stream",
} as const;
