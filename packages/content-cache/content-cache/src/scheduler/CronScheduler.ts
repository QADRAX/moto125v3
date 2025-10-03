import cronParser from "cron-parser";
import type { Scheduler } from "./Scheduler";

export class CronScheduler implements Scheduler {
  private timeout: NodeJS.Timeout | null = null;
  private executing = false;
  private _isRunning = false;

  constructor(
    private expr: string,
    private tz: string | undefined,
    private readonly task: () => Promise<void> | void
  ) {}

  setCron(expr: string | undefined, tz?: string): void {
    this.expr = (expr || "").trim();
    this.tz = tz;
    if (this._isRunning) {
      this.stop();
      this.start();
    }
  }

  start(): void {
    if (this._isRunning || !this.expr) return;
    this._isRunning = true;
    this.scheduleNext();
  }

  stop(): void {
    if (this.timeout) clearTimeout(this.timeout);
    this.timeout = null;
    this._isRunning = false;
  }

  dispose(): void {
    this.stop();
  }

  get isRunning(): boolean {
    return this._isRunning;
  }

  private scheduleNext(): void {
    if (!this.expr || !this._isRunning) return;

    let next: Date;
    try {
      const it = cronParser.parse(this.expr, this.tz ? { tz: this.tz } : undefined);
      next = it.next().toDate();
    } catch {
      this.stop();
      return;
    }

    const delay = Math.max(0, next.getTime() - Date.now());
    this.timeout = setTimeout(async () => {
      if (this.executing) {
        this.scheduleNext();
        return;
      }
      this.executing = true;
      try {
        await this.task();
      } finally {
        this.executing = false;
      }
      this.scheduleNext();
    }, delay);
  }
}
