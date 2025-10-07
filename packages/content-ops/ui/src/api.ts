import {
  ROUTES,
  type GetJobsResponse,
  type PostRunJobResponse,
  type PostRestartResponse,
  type PostCreateSyncMediaJobRequest,
  type PostCreateJobResponse,
  type DeleteJobResponse,
} from "@moto125/content-ops-shared";

type ReqOpts = {
  method?: "GET" | "POST" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
  headers?: Record<string, string>;
};

async function requestJSON<T>(path: string, opts: ReqOpts = {}): Promise<T> {
  const res = await fetch(path, {
    method: opts.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(opts.headers ?? {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
  });

  const isJson =
    res.headers.get("content-type")?.includes("application/json") ?? false;

  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`;
    if (isJson) {
      try {
        const data = (await res.json()) as { error?: string };
        if (data?.error) detail += ` — ${data.error}`;
      } catch {
        /* ignore */
      }
    } else {
      try {
        detail += ` — ${await res.text()}`;
      } catch {
        /* ignore */
      }
    }
    throw new Error(detail);
  }

  return isJson ? ((await res.json()) as T) : (undefined as unknown as T);
}

export const API = {
  LOGS_STREAM: ROUTES.LOGS_STREAM,

  // Jobs
  async getJobs(signal?: AbortSignal) {
    return requestJSON<GetJobsResponse>(ROUTES.JOBS, { signal });
  },

  async runJob(id: string, signal?: AbortSignal) {
    return requestJSON<PostRunJobResponse>(ROUTES.JOB_RUN(id), {
      method: "POST",
      signal,
    });
  },

  async deleteJob(id: string, signal?: AbortSignal) {
    return requestJSON<DeleteJobResponse>(ROUTES.JOB_DELETE(id), {
      method: "DELETE",
      signal,
    });
  },

  async restartScheduler(signal?: AbortSignal) {
    return requestJSON<PostRestartResponse>(ROUTES.SCHEDULER_RESTART, {
      method: "POST",
      signal,
    });
  },

  async createSyncMediaJob(
    payload: Omit<PostCreateSyncMediaJobRequest, "enabled">, // el backend ya no usa enabled
    signal?: AbortSignal
  ) {
    return requestJSON<PostCreateJobResponse>(ROUTES.JOBS_SYNC_MEDIA, {
      method: "POST",
      body: payload,
      signal,
    });
  },
};

export const getJSON = requestJSON;
export const postJSON = <T = unknown>(path: string, body?: unknown) =>
  requestJSON<T>(path, { method: "POST", body });
