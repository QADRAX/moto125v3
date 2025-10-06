export type LogLevel = "trace" | "debug" | "info" | "warn" | "error";

export interface LogEntry {
  ts: string;
  level: LogLevel;
  msg: string;
  ctx?: Record<string, unknown>;
}
