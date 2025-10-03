export interface Scheduler {
  start(): void;
  stop(): void;
  dispose(): void;
  readonly isRunning: boolean;
}
