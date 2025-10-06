import { ROUTES } from "@moto125/content-ops-shared";

export async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}
export async function postJSON<T = any>(path: string, body?: any): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

export const API = {
  JOBS: ROUTES.JOBS,
  JOB_RUN: (id: string) => ROUTES.JOB_RUN(id),
  RESTART: ROUTES.SCHEDULER_RESTART,
  LOGS: ROUTES.LOGS_STREAM,
};
