export class RefreshScheduler {
  private timer: NodeJS.Timeout | null = null;
  private intervalMs = 0;
  private running = false;
  private executing = false;

  constructor(private readonly task: () => Promise<void> | void) {}

  /** Set the interval; if running, restarts with the new value. */
  setInterval(ms: number): void {
    this.intervalMs = ms ?? 0;
    if (this.running) {
      this.stop();
      this.start();
    }
  }

  start(): void {
    if (this.running || this.intervalMs <= 0) return;
    this.running = true;
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
    this.running = false;
  }
}
