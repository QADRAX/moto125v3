import {
  ContentCacheError,
  ContentCacheState,
  ContentCacheWorkerIn,
  ContentCacheWorkerOut,
  SdkInit,
} from "@moto125/content-cache-core";
import { Worker as NodeWorker } from "node:worker_threads";
import * as v8 from "v8";
import { resolveWorkerEntry } from "./resolveWorker";

export class WorkerClient {
  private worker!: NodeWorker;

  /**
   * Initialize the worker thread.
   */
  async init(): Promise<void> {
    const url = await resolveWorkerEntry();
    this.worker = new NodeWorker(url, { execArgv: ["--enable-source-maps"] });
  }

  /**
   * Gracefully dispose worker resources.
   */
  dispose(): void {
    this.worker?.postMessage({ type: "dispose" } satisfies ContentCacheWorkerIn);
    this.worker?.terminate().catch(() => {});
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RPC overloads:
  //  - If `expect` is provided, the returned type is narrowed to that specific
  //    MirrorWorkerOut variant.
  //  - If `expect` is omitted, the full union MirrorWorkerOut is returned so the
  //    caller can branch on m.type (needed for *:error handling).
  // ─────────────────────────────────────────────────────────────────────────────

  private rpc<TType extends ContentCacheWorkerOut["type"]>(
    msg: ContentCacheWorkerIn,
    expect: TType
  ): Promise<Extract<ContentCacheWorkerOut, { type: TType }>>;
  private rpc(msg: ContentCacheWorkerIn): Promise<ContentCacheWorkerOut>;

  private rpc(
    msg: ContentCacheWorkerIn,
    expect?: ContentCacheWorkerOut["type"]
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const onMessage = (m: ContentCacheWorkerOut) => {
        if (m.type === "error") {
          cleanup();
          reject(new Error(m.error));
          return;
        }
        if (!expect || m.type === expect) {
          cleanup();
          resolve(m);
        }
      };
      const onError = (e: any) => {
        cleanup();
        reject(e);
      };
      const cleanup = () => {
        this.worker.off("message", onMessage);
        this.worker.off("error", onError);
      };

      this.worker.on("message", onMessage);
      this.worker.on("error", onError);

      // Use transferable for zero-copy on large buffers
      if (msg.type === "saveSnapshot") {
        const ab = msg.stateBin as ArrayBuffer;
        this.worker.postMessage(msg, [ab]);
      } else {
        this.worker.postMessage(msg);
      }
    });
  }

  /**
   * Hydrate the mirror state via the worker.
   * - Throws AggregateError with `__mirrorErrors` if API returned errors.
   */
  async hydrate(sdkInit: SdkInit): Promise<ContentCacheState> {
    const res = await this.rpc({ type: "hydrate", sdkInit }, "hydrate:done");
    const buf = Buffer.from(new Uint8Array(res.payload.stateBin));
    const state = v8.deserialize(buf) as ContentCacheState & {
      errors?: ContentCacheError[];
    };

    const errs = Array.isArray(state.errors)
      ? state.errors.filter(Boolean)
      : [];
    if (errs.length > 0) {
      const agg = new AggregateError(errs, "Hydration returned errors");
      (agg as any).__mirrorErrors = errs;
      throw agg;
    }
    return state;
  }

  /**
   * Save a snapshot through the worker.
   * - On structured failure, throws AggregateError with `__mirrorErrors`.
   */
  async saveSnapshot(path: string, state: ContentCacheState): Promise<void> {
    const buf: Buffer = v8.serialize(state);
    const ab: ArrayBuffer = buf.buffer.slice(
      buf.byteOffset,
      buf.byteOffset + buf.byteLength
    ) as ArrayBuffer;

    const res = await this.rpc({ type: "saveSnapshot", path, stateBin: ab });

    if (res.type === "saveSnapshot:done") return;

    if (res.type === "saveSnapshot:error") {
      const agg = new AggregateError([res.error], "Snapshot save failed");
      (agg as any).__mirrorErrors = [res.error];
      throw agg;
    }

    throw new Error(`Unexpected worker response: ${res.type}`);
  }

  /**
   * Load a snapshot through the worker.
   * - On structured failure, throws AggregateError with `__mirrorErrors`.
   */
  async loadSnapshot(path: string): Promise<ContentCacheState> {
    const res = await this.rpc({ type: "loadSnapshot", path });

    if (res.type === "loadSnapshot:done") {
      const buf = Buffer.from(new Uint8Array(res.payload.stateBin));
      const state = v8.deserialize(buf) as ContentCacheState;
      if (!state.generatedAt) state.generatedAt = new Date().toISOString();
      return state;
    }

    if (res.type === "loadSnapshot:error") {
      const agg = new AggregateError([res.error], "Snapshot load failed");
      (agg as any).__mirrorErrors = [res.error];
      throw agg;
    }

    throw new Error(`Unexpected worker response: ${res.type}`);
  }

  setDebugLogging(enabled: boolean): void {
    this.worker?.postMessage({ type: "setDebug", enabled } as ContentCacheWorkerIn);
  }
}
