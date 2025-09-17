import { parentPort } from "node:worker_threads";
import * as v8 from "v8";
import {
  hydrateAllResilient,
  loadSnapshot,
  saveSnapshot,
  MirrorState,
  MirrorWorkerIn,
  MirrorWorkerOut,
} from "@moto125/data-mirror-core";
import { createMoto125Api } from "@moto125/api-client";

function toBuffer(obj: unknown): ArrayBuffer {
  const buf: Buffer = v8.serialize(obj);
  return buf.buffer.slice(
    buf.byteOffset,
    buf.byteOffset + buf.byteLength
  ) as ArrayBuffer;
}

async function handle(msg: MirrorWorkerIn): Promise<MirrorWorkerOut | void> {
  switch (msg.type) {
    case "hydrate": {
      const sdk = createMoto125Api({
        baseUrl: msg.sdkInit.baseUrl,
        token: msg.sdkInit.token,
      });
      const { data, errors, timings } = await hydrateAllResilient(sdk);
      const state = {
        version: "api-client@0.0.2",
        generatedAt: new Date().toISOString(),
        data,
        timings,
        errors,
      };
      const stateBin = toBuffer(state);
      return {
        type: "hydrate:done",
        payload: { stateBin, size: stateBin.byteLength },
      };
    }

    case "saveSnapshot": {
      try {
        const view = new Uint8Array(msg.stateBin);
        const buf = Buffer.from(view);
        const stateObj = v8.deserialize(buf) as MirrorState;
        await saveSnapshot(msg.path, stateObj);
        return { type: "saveSnapshot:done" };
      } catch (e: any) {
        const err = {
          time: new Date().toISOString(),
          source: "snapshot" as const,
          code: "UNKNOWN" as const,
          status: undefined,
          message: e?.message ?? String(e),
          detail: e?.stack ?? e,
        };
        return { type: "saveSnapshot:error", error: err };
      }
    }

    case "loadSnapshot": {
      try {
        const json = await loadSnapshot(msg.path);
        const stateBin = toBuffer(json);
        return {
          type: "loadSnapshot:done",
          payload: { stateBin, size: stateBin.byteLength },
        };
      } catch (e: any) {
        const err = {
          time: new Date().toISOString(),
          source: "snapshot" as const,
          code: "UNKNOWN" as const,
          status: undefined,
          message: e?.message ?? String(e),
          detail: e?.stack ?? e,
        };
        return { type: "loadSnapshot:error", error: err };
      }
    }
    case "dispose":
      return;
  }
}

parentPort?.on("message", async (msg: MirrorWorkerIn) => {
  try {
    const out = await handle(msg);
    if (!out) return;
    const transfers =
      out.type === "hydrate:done" || out.type === "loadSnapshot:done"
        ? [out.payload.stateBin]
        : [];
    parentPort!.postMessage(out, transfers);
  } catch (e: any) {
    const err: MirrorWorkerOut = {
      type: "error",
      error: e?.stack || String(e),
    };
    parentPort!.postMessage(err);
  }
});
