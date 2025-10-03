import {
  type SdkInit,
  type ContentCache,
  type ContentCacheInitOptions,
  type UpdateListener,
  type ContentCacheRootState,
  type ErrorListener,
  type ContentCacheError,
} from "@moto125/content-cache-core";

import { getMirrorState, setState, subscribe } from "./store";
import { SnapshotManager } from "./SnapshotManager";
import { WorkerClient } from "./WorkerClient";
import { ErrorBus } from "./ErrorBus";
import { createScheduler } from "./scheduler/SchedulerFactory";

export class ContentCacheImpl implements ContentCache {
  private sdkInit?: SdkInit;
  private snapshotPath?: string;
  private autosave = false;
  private refreshing = false;

  private readonly worker = new WorkerClient();
  private readonly errors = new ErrorBus();

  private readonly scheduler = createScheduler(
    { refreshIntervalMs: 0, refreshCron: undefined, cronTimezone: undefined },
    () => this.refresh()
  );

  private readonly updateListeners = new Set<UpdateListener>();
  private readonly unsubStore: () => void;

  constructor() {
    this.unsubStore = subscribe((next) => {
      for (const l of this.updateListeners) l(next);
    });
  }

  async init(opts: ContentCacheInitOptions): Promise<void> {
    await this.worker.init();

    if (opts.workerDebugLogging !== undefined) {
      this.worker.setDebugLogging(!!opts.workerDebugLogging);
    }

    this.sdkInit = opts.sdkInit;
    this.snapshotPath = opts.snapshotPath;
    this.autosave = !!opts.autosave;

    this.scheduler.reconfigure({
      refreshCron: opts.refreshCron,
      cronTimezone: opts.cronTimezone,
      refreshIntervalMs: opts.refreshIntervalMs,
    });

    const snapshot = new SnapshotManager(this.worker, this.errors);

    let loadedFromSnapshot = false;
    if (this.snapshotPath) {
      loadedFromSnapshot = await snapshot.tryLoadIntoStore(this.snapshotPath);
    }

    if (!loadedFromSnapshot || opts.forceHydrateOnInit) {
      if (!this.sdkInit) {
        throw new Error(
          "dataMirror.init: no snapshot available and no sdk provided to hydrate."
        );
      }
      await this.refresh();
    }

    this.scheduler.start();
  }

  state(): ContentCacheRootState {
    return getMirrorState();
  }

  onUpdate(listener: UpdateListener): () => void {
    this.updateListeners.add(listener);
    listener(this.state());
    return () => this.updateListeners.delete(listener);
  }

  onError(listener: ErrorListener): () => void {
    return this.errors.onError(listener);
  }

  getErrors(): ReadonlyArray<ContentCacheError> {
    return this.errors.getErrors();
  }

  clearErrors(): void {
    this.errors.clear();
  }

  async refresh(): Promise<void> {
    if (this.refreshing) return;
    if (!this.sdkInit) throw new Error("dataMirror.refresh: sdk not set.");
    this.refreshing = true;
    try {
      const next = await this.worker.hydrate(this.sdkInit);
      setState(next);
      if (this.autosave && this.snapshotPath) {
        const snapshot = new SnapshotManager(this.worker, this.errors);
        await snapshot.save(this.snapshotPath, next);
      }
    } catch (e: any) {
      this.errors.fromUnknown(e, "unknown");
    } finally {
      this.refreshing = false;
    }
  }

  start(): void {
    this.scheduler.start();
  }

  stop(): void {
    this.scheduler.stop();
  }

  async saveSnapshot(): Promise<void> {
    if (!this.snapshotPath) return;
    const current = getMirrorState();
    if (!current) return;

    const snapshot = new SnapshotManager(this.worker, this.errors);
    await snapshot.save(this.snapshotPath, current);
  }

  async loadSnapshot(): Promise<void> {
    if (!this.snapshotPath)
      throw new Error("dataMirror.loadSnapshot: snapshotPath not configured.");

    const snapshot = new SnapshotManager(this.worker, this.errors);
    await snapshot.loadIntoStore(this.snapshotPath);
  }

  configure(
    opts: Partial<Omit<ContentCacheInitOptions, "forceHydrateOnInit">>
  ): void {
    if (opts.sdkInit !== undefined) this.sdkInit = opts.sdkInit;
    if (opts.snapshotPath !== undefined) this.snapshotPath = opts.snapshotPath;
    if (opts.autosave !== undefined) this.autosave = !!opts.autosave;

    if (
      opts.refreshCron !== undefined ||
      opts.refreshIntervalMs !== undefined ||
      opts.cronTimezone !== undefined
    ) {
      this.scheduler.reconfigure({
        refreshCron: opts.refreshCron,
        cronTimezone: opts.cronTimezone,
        refreshIntervalMs: opts.refreshIntervalMs,
      });
    }
  }

  setWorkerDebugLogging(enabled: boolean): void {
    this.worker.setDebugLogging(enabled);
  }

  dispose(): void {
    this.stop();
    this.unsubStore();
    this.updateListeners.clear();
    this.errors.dispose();
    this.worker.dispose();
  }
}
