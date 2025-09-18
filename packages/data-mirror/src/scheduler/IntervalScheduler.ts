import type { Scheduler } from "./Scheduler";

export class IntervalScheduler implements Scheduler {
  private timer: NodeJS.Timeout | null = null;
  private executing = false;
  private _isRunning = false;

  constructor(
    private intervalMs: number,
    private readonly task: () => Promise<void> | void
  ) {}

  setIntervalMs(ms: number): void {
    this.intervalMs = ms ?? 0;
    if (this._isRunning) {
      this.stop();
      this.start();
    }
  }

  start(): void {
    if (this._isRunning || this.intervalMs <= 0) return;
    this._isRunning = true;
    this.timer = setInterval(async () => {
      if (this.executing) return;
      this.executing = true;
      try {
        await this.task();
      } finally {
        this.executing = false;
      }
    }, this.intervalMs);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this._isRunning = false;
  }

  dispose(): void {
    this.stop();
  }

  get isRunning(): boolean {
    return this._isRunning;
  }
}
