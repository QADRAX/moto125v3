import type { ContentCacheState } from "@moto125/content-cache-core";
import { setState } from "./store";
import { WorkerClient } from "./WorkerClient";
import { ErrorBus } from "./ErrorBus";

export class SnapshotManager {
  constructor(
    private readonly worker: WorkerClient,
    private readonly errors: ErrorBus
  ) {}

  async tryLoadIntoStore(path: string): Promise<boolean> {
    try {
      const loaded = await this.worker.loadSnapshot(path);
      setState(loaded);
      return true;
    } catch (e: any) {
      this.errors.fromUnknown(e, "snapshot");
      return false;
    }
  }

  async loadIntoStore(path: string): Promise<void> {
    try {
      const loaded = await this.worker.loadSnapshot(path);
      setState(loaded);
    } catch (e: any) {
      this.errors.fromUnknown(e, "snapshot");
    }
  }

  async save(path: string, state: ContentCacheState): Promise<void> {
    try {
      await this.worker.saveSnapshot(path, state);
    } catch (e: any) {
      this.errors.fromUnknown(e, "snapshot");
    }
  }
}
