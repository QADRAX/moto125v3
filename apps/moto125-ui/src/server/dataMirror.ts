import "server-only";

import type {
  DataMirror,
  DataMirrorInitOptions,
} from "@moto125/data-mirror-core";
import { createDataMirror } from "@moto125/data-mirror";

const DEBUG = process.env.DEBUG_MIRROR === "1";
const IS_BUILD = process.env.NEXT_PHASE === "phase-production-build";

declare global {
  var __MOTO125_MIRROR__:
    | { instance: DataMirror | null; started: boolean; initialized: boolean }
    | undefined;
}
const globalRef =
  globalThis.__MOTO125_MIRROR__ ??
  (globalThis.__MOTO125_MIRROR__ = {
    instance: null,
    started: false,
    initialized: false,
  });

function buildInitOptions(): DataMirrorInitOptions {
  return {
    sdkInit: {
      baseUrl: process.env.STRAPI_API_URL!, // se leerá en runtime dentro del contenedor
      token: process.env.STRAPI_API_TOKEN,
    },
    snapshotPath: process.env.CACHE_SNAPSHOT_PATH,
    refreshIntervalMs: process.env.CACHE_REFRESH_INTERVAL_MS
      ? Number(process.env.CACHE_REFRESH_INTERVAL_MS)
      : undefined,
    autosave: true,
    forceHydrateOnInit: false,
  };
}

async function ensureMirror(): Promise<DataMirror> {
  if (!globalRef.instance) {
    globalRef.instance = createDataMirror();

    globalRef.instance.onUpdate((s) => {
      if (!DEBUG) return;
      const a = s?.data?.articles?.length ?? 0;
      const m = s?.data?.motos?.length ?? 0;
      const c = s?.data?.companies?.length ?? 0;
      console.log(
        `[DataMirror] onUpdate: articles=${a} motos=${m} marcas=${c}, generatedAt=${s?.generatedAt ?? "-"}`
      );
    });
    globalRef.instance.onError((err: any) => {
      console.error("[DataMirror] error:", err);
    });
  }

  if (IS_BUILD) {
    if (DEBUG)
      console.log("[DataMirror] Skipping init/start during Next build");
    return globalRef.instance!;
  }

  if (!globalRef.initialized) {
    await globalRef.instance!.init(buildInitOptions());
    globalRef.initialized = true;
  }

  if (!globalRef.started) {
    globalRef.instance!.start();
    globalRef.started = true;
    if (DEBUG) console.log("[DataMirror] started periodic refresh");
    registerShutdown();
  }

  return globalRef.instance!;
}

export async function getDataMirror(): Promise<DataMirror> {
  return ensureMirror();
}

export async function getMirrorState() {
  const mirror = await getDataMirror();
  return mirror.state();
}

export async function refreshMirror() {
  const mirror = await getDataMirror();
  const t0 = Date.now();
  await mirror.refresh();
  if (DEBUG) console.log(`[DataMirror] manual refresh in ${Date.now() - t0}ms`);
}

function registerShutdown() {
  const stop = async () => {
    try {
      if (globalRef.instance) {
        globalRef.instance.stop();
        await globalRef.instance.saveSnapshot().catch(() => {});
        globalRef.instance.dispose();
      }
    } catch (e) {
      console.error("[DataMirror] shutdown error:", e);
    } finally {
      globalRef.instance = null;
      globalRef.started = false;
      globalRef.initialized = false;
    }
  };
  const key = "__MOTO125_SHUTDOWN_REGISTERED__";
  if (!(globalThis as any)[key]) {
    (globalThis as any)[key] = true;
    process.once("SIGINT", stop);
    process.once("SIGTERM", stop);
    process.once("beforeExit", stop);
  }
}
