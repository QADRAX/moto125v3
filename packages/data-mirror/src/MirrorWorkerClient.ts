import {
  MirrorError,
  MirrorState,
  MirrorWorkerIn,
  MirrorWorkerOut,
  SdkInit,
} from "@moto125/data-mirror-core";
import { Worker as NodeWorker } from "node:worker_threads";
import * as v8 from "v8";
import { resolveWorkerEntry } from "./resolveWorker";

export class MirrorWorkerClient {
  private worker!: NodeWorker;

  async init() {
    const url = await resolveWorkerEntry();
    this.worker = new NodeWorker(url, { execArgv: ["--enable-source-maps"] });
  }

  dispose() {
    this.worker?.postMessage({ type: "dispose" } satisfies MirrorWorkerIn);
    this.worker?.terminate().catch(() => {});
  }

  private rpc<TOut extends MirrorWorkerOut>(
    msg: MirrorWorkerIn,
    expect?: TOut["type"]
  ): Promise<TOut> {
    return new Promise((resolve, reject) => {
      const onMessage = (m: MirrorWorkerOut) => {
        if (m.type === "error") {
          cleanup();
          reject(new Error(m.error));
          return;
        }
        if (!expect || m.type === expect) {
          cleanup();
          resolve(m as TOut);
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

      if (msg.type === "saveSnapshot") {
        // transferible para zero-copy
        const ab = msg.stateBin as ArrayBuffer;
        this.worker.postMessage(msg, [ab]);
      } else {
        this.worker.postMessage(msg);
      }
    });
  }

  async hydrate(sdkInit: SdkInit) {
    const res = await this.rpc<{
      type: "hydrate:done";
      payload: { stateBin: ArrayBuffer; size: number };
    }>({ type: "hydrate", sdkInit }, "hydrate:done");
    const buf = Buffer.from(new Uint8Array(res.payload.stateBin));
    const state = v8.deserialize(buf) as MirrorState & { errors?: MirrorError[] };;
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

  async saveSnapshot(path: string, state: MirrorState): Promise<void> {
    const buf: Buffer = v8.serialize(state);
    const ab: ArrayBuffer = buf.buffer.slice(
      buf.byteOffset,
      buf.byteOffset + buf.byteLength
    ) as ArrayBuffer;
    await this.rpc(
      { type: "saveSnapshot", path, stateBin: ab },
      "saveSnapshot:done"
    );
  }

  async loadSnapshot(path: string): Promise<MirrorState> {
    const res = await this.rpc<{
      type: "loadSnapshot:done";
      payload: { stateBin: ArrayBuffer; size: number };
    }>({ type: "loadSnapshot", path }, "loadSnapshot:done");
    const buf = Buffer.from(new Uint8Array(res.payload.stateBin));
    const state = v8.deserialize(buf) as MirrorState;
    if (!state.generatedAt) state.generatedAt = new Date().toISOString();
    return state;
  }
}
