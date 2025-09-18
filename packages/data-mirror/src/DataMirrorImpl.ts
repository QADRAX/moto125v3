import {
  type SdkInit,
  type DataMirror,
  type DataMirrorInitOptions,
  type UpdateListener,
  type MirrorRootState,
  type ErrorListener,
  type MirrorError,
} from "@moto125/data-mirror-core";

import { getMirrorState, setState, subscribe } from "./store";
import { SnapshotManager } from "./SnapshotManager";
import { MirrorWorkerClient } from "./MirrorWorkerClient";
import { MirrorErrorBus } from "./MirrorErrorBus";
import { RefreshScheduler } from "./RefreshScheduler";

export class DataMirrorImpl implements DataMirror {
  private sdkInit?: SdkInit;
  private snapshotPath?: string;
  private autosave = false;
  private refreshing = false;

  private readonly worker = new MirrorWorkerClient();
  private readonly errors = new MirrorErrorBus();
  private readonly scheduler = new RefreshScheduler(() => this.refresh());
  private readonly updateListeners = new Set<UpdateListener>();
  private readonly unsubStore: () => void;

  constructor() {
    this.unsubStore = subscribe((next) => {
      for (const l of this.updateListeners) l(next);
    });
  }

  async init(opts: DataMirrorInitOptions): Promise<void> {
    await this.worker.init();

    if (opts.workerDebugLogging !== undefined) {
      this.worker.setDebugLogging(!!opts.workerDebugLogging);
    }

    this.sdkInit = opts.sdkInit;
    this.snapshotPath = opts.snapshotPath;
    this.autosave = !!opts.autosave;

    this.scheduler.setInterval(opts.refreshIntervalMs ?? 0);

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

  state(): MirrorRootState {
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

  getErrors(): ReadonlyArray<MirrorError> {
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
    opts: Partial<Omit<DataMirrorInitOptions, "forceHydrateOnInit">>
  ): void {
    if (opts.sdkInit !== undefined) this.sdkInit = opts.sdkInit;
    if (opts.snapshotPath !== undefined) this.snapshotPath = opts.snapshotPath;
    if (opts.autosave !== undefined) this.autosave = !!opts.autosave;

    if (opts.refreshIntervalMs !== undefined) {
      this.scheduler.setInterval(opts.refreshIntervalMs);
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
