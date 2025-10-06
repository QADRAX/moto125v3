import { LogEntry } from '@moto125/content-ops-shared';
import { EventEmitter } from 'node:events';

/**
 * In-memory log bus with ring buffer and event emitter for SSE subscribers.
 */
export class LogBus {
  private buffer: LogEntry[] = [];
  private maxSize: number;
  private ee = new EventEmitter();

  constructor(maxSize: number) {
    this.maxSize = Math.max(10, maxSize);
  }

  /** Returns a copy of current ring buffer (oldest → newest). */
  snapshot(): LogEntry[] {
    return [...this.buffer];
  }

  /** Subscribe to log events. Returns an unsubscribe function. */
  subscribe(listener: (e: LogEntry) => void): () => void {
    this.ee.on('log', listener);
    return () => this.ee.off('log', listener);
  }

  /** Push a new log entry into the buffer and notify listeners. */
  push(entry: LogEntry) {
    if (this.buffer.length >= this.maxSize) this.buffer.shift();
    this.buffer.push(entry);
    this.ee.emit('log', entry);
  }
}
