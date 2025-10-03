import { parentPort } from "node:worker_threads";
import * as v8 from "v8";
import {
  hydrateAllResilient,
  loadSnapshot,
  saveSnapshot,
  MirrorState,
  MirrorWorkerIn,
  MirrorWorkerOut,
} from "@moto125/content-cache-core";
import { createMoto125Api } from "@moto125/api-client";

let DEBUG = false;

function toBuffer(obj: unknown): ArrayBuffer {
  const buf: Buffer = v8.serialize(obj);
  return buf.buffer.slice(
    buf.byteOffset,
    buf.byteOffset + buf.byteLength
  ) as ArrayBuffer;
}

type Row = { key: string; value: unknown; timing: unknown };

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const u = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    u.length - 1
  );
  const v = bytes / Math.pow(1024, i);
  return `${v.toFixed(v >= 100 ? 0 : v >= 10 ? 1 : 2)} ${u[i]}`;
}

function sep(label: string): Row {
  return { key: `── ${label} ──`, value: "", timing: "" };
}

function getSrcMs(state: MirrorState, srcKey: string): number | string {
  return state.timings?.hydrate?.bySource?.[srcKey] ?? "-";
}

function logStateSummary(
  state: MirrorState,
  rawSizeBytes?: number
) {
  if (!DEBUG) return;

  const d = state.data;
  const sizeBytes =
    rawSizeBytes ?? Buffer.byteLength(JSON.stringify(state), "utf8");
  const sizeHuman = formatBytes(sizeBytes);

  const rows: Row[] = [];

  // meta
  rows.push({ key: "version", value: state.version ?? "-", timing: "-" });
  rows.push({
    key: "generatedAt",
    value: state.generatedAt ?? "-",
    timing: "-",
  });
  rows.push({ key: "sizeBytes", value: sizeBytes, timing: "-" });
  rows.push({ key: "sizeHuman", value: sizeHuman, timing: "-" });

  // contenido (con timing por fuente)
  rows.push(sep("content"));
  rows.push({
    key: "content.articles",
    value: d?.articles?.length ?? 0,
    timing: getSrcMs(state, "articles"),
  });
  rows.push({
    key: "content.motos",
    value: d?.motos?.length ?? 0,
    timing: getSrcMs(state, "motos"),
  });
  rows.push({
    key: "content.companies",
    value: d?.companies?.length ?? 0,
    timing: getSrcMs(state, "companies"),
  });

  // taxonomías
  rows.push({
    key: "taxonomies.articleTypes",
    value: d?.taxonomies?.articleTypes?.length ?? 0,
    timing: getSrcMs(state, "taxonomies.articleTypes"),
  });
  rows.push({
    key: "taxonomies.motoTypes",
    value: d?.taxonomies?.motoTypes?.length ?? 0,
    timing: getSrcMs(state, "taxonomies.motoTypes"),
  });
  rows.push({
    key: "taxonomies.motoClasses",
    value: d?.taxonomies?.motoClasses?.length ?? 0,
    timing: getSrcMs(state, "taxonomies.motoClasses"),
  });

  // páginas / config
  rows.push({
    key: "pages.home",
    value: !!d?.pages?.home,
    timing: getSrcMs(state, "pages.home"),
  });
  rows.push({
    key: "pages.ofertas",
    value: !!d?.pages?.ofertas,
    timing: getSrcMs(state, "pages.ofertas"),
  });
  rows.push({
    key: "pages.aboutUs",
    value: !!d?.pages?.aboutUs,
    timing: getSrcMs(state, "pages.aboutUs"),
  });
  rows.push({
    key: "config",
    value: !!d?.config,
    timing: getSrcMs(state, "config"),
  });

  // timings globales
  rows.push(sep("timings"));
  rows.push({
    key: "timing.hydrate.startedAt",
    value: "-",
    timing: state.timings?.hydrate?.startedAt ?? "-",
  });
  rows.push({
    key: "timing.hydrate.endedAt",
    value: "-",
    timing: state.timings?.hydrate?.endedAt ?? "-",
  });
  rows.push({
    key: "timing.hydrate.totalMs",
    value: "-",
    timing: state.timings?.hydrate?.totalMs ?? "-",
  });

  console.table(rows, ["key", "value", "timing"]);
}

function logSnapshotIO(
  op: "load" | "save",
  pathStr: string,
  sizeBytes: number
) {
  if (!DEBUG) return;
  console.table([
    {
      op,
      path: pathStr,
      sizeBytes,
      sizeHuman: formatBytes(sizeBytes),
    },
  ]);
}

async function handle(msg: MirrorWorkerIn): Promise<MirrorWorkerOut | void> {
  switch (msg.type) {
    case "setDebug": {
      DEBUG = !!msg.enabled;
      if (DEBUG) console.log("[DM-Worker] Debug logging ENABLED");
      else console.log("[DM-Worker] Debug logging DISABLED");
      return;
    }

    case "hydrate": {
      const sdk = createMoto125Api({
        baseUrl: msg.sdkInit.baseUrl,
        token: msg.sdkInit.token,
      });
      const { data, errors, timings } = await hydrateAllResilient(sdk);
      const state: MirrorState & { errors?: any[] } = {
        version: "api-client@0.0.2",
        generatedAt: new Date().toISOString(),
        data,
        timings,
        errors,
      };
      const stateBin = toBuffer(state);
      if (DEBUG) {
        logStateSummary(state, stateBin.byteLength);
      }
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
        if (DEBUG) {
          const approxBytes = Buffer.byteLength(
            JSON.stringify(stateObj),
            "utf8"
          );
          logSnapshotIO("save", msg.path, approxBytes);
        }
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
        if (DEBUG) logSnapshotIO("load", msg.path, stateBin.byteLength);
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
