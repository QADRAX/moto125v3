import type { MirrorState } from "@moto125/content-cache-core";
import { setState } from "./store";
import { MirrorWorkerClient } from "./MirrorWorkerClient";
import { MirrorErrorBus } from "./MirrorErrorBus";

export class SnapshotManager {
  constructor(
    private readonly worker: MirrorWorkerClient,
    private readonly errors: MirrorErrorBus
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

  async save(path: string, state: MirrorState): Promise<void> {
    try {
      await this.worker.saveSnapshot(path, state);
    } catch (e: any) {
      this.errors.fromUnknown(e, "snapshot");
    }
  }
}
