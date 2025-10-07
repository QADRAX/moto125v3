import { ListRunsOptions } from "./types";

export function parseConfigJson(s?: string): unknown {
  if (!s) return {};
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}

export function buildRunsFilter(q: ListRunsOptions): string | undefined {
  const parts: string[] = [];
  if (q.type) parts.push(`PartitionKey eq '${q.type}'`);
  if (q.since) parts.push(`RowKey ge '${q.since.toISOString()}'`);
  if (q.until) parts.push(`RowKey lt '${q.until.toISOString()}'`);
  if (q.jobId) parts.push(`jobId eq '${escapeOData(q.jobId)}'`);
  return parts.length ? parts.join(" and ") : undefined;
}

export function randomId(len = 6): string {
  const alphabet = "0123456789abcdefghijklmnopqrstuvwxyz";
  let s = "";
  for (let i = 0; i < len; i++)
    s += alphabet[(Math.random() * alphabet.length) | 0];
  return s;
}

export function escapeOData(s: string): string {
  return s.replace(/'/g, "''");
}
