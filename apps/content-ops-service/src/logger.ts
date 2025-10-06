import { LogBus, LogEntry, LogLevel } from "./logging/LogBus";

const LEVELS_ORDER: LogLevel[] = ["trace", "debug", "info", "warn", "error"];

/** Simple logger that writes to console and publishes into LogBus. */
export class Logger {
  constructor(
    private level: LogLevel,
    private bus: LogBus
  ) {}

  private shouldLog(level: LogLevel): boolean {
    return LEVELS_ORDER.indexOf(level) >= LEVELS_ORDER.indexOf(this.level);
  }

  private emit(level: LogLevel, msg: string, ctx?: Record<string, unknown>) {
    const e: LogEntry = { ts: new Date().toISOString(), level, msg, ctx };
    // Console output
    const line = ctx
      ? `${e.ts} [${level.toUpperCase()}] ${msg} ${JSON.stringify(ctx)}`
      : `${e.ts} [${level.toUpperCase()}] ${msg}`;
    switch (level) {
      case "trace":
      case "debug":
      case "info":
        if (this.shouldLog(level)) console.log(line);
        break;
      case "warn":
        if (this.shouldLog(level)) console.warn(line);
        break;
      case "error":
        if (this.shouldLog(level)) console.error(line);
        break;
    }
    // SSE bus
    this.bus.push(e);
  }

  trace(msg: string, ctx?: Record<string, unknown>) {
    this.emit("trace", msg, ctx);
  }
  debug(msg: string, ctx?: Record<string, unknown>) {
    this.emit("debug", msg, ctx);
  }
  info(msg: string, ctx?: Record<string, unknown>) {
    this.emit("info", msg, ctx);
  }
  warn(msg: string, ctx?: Record<string, unknown>) {
    this.emit("warn", msg, ctx);
  }
  error(msg: string, ctx?: Record<string, unknown>) {
    this.emit("error", msg, ctx);
  }
}

/** Factory to create shared logger+bus instances. */
export function createLogger(level: LogLevel, bufferSize: number) {
  const bus = new LogBus(bufferSize);
  const logger = new Logger(level, bus);
  return { logger, bus };
}
