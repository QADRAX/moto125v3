import "server-only";

import type {
  DataMirror,
  DataMirrorInitOptions,
} from "@moto125/data-mirror-core";
import { createDataMirror } from "@moto125/data-mirror";

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
      baseUrl: process.env.STRAPI_API_URL!,
      token: process.env.STRAPI_API_TOKEN,
    },
    snapshotPath: process.env.CACHE_SNAPSHOT_PATH,
    refreshIntervalMs: process.env.CACHE_REFRESH_INTERVAL_MS
      ? Number(process.env.CACHE_REFRESH_INTERVAL_MS)
      : undefined,
    refreshCron: process.env.CACHE_REFRESH_INTERVAL_CRON
      ? process.env.CACHE_REFRESH_INTERVAL_CRON
      : undefined,
    autosave: true,
    forceHydrateOnInit: true,
    workerDebugLogging: true,
  };
}

async function ensureMirror(): Promise<DataMirror> {
  if (!globalRef.instance) {
    globalRef.instance = createDataMirror();

    globalRef.instance.onError((err: any) => {
      console.error("[DataMirror] error:", err);
    });
  }

  if (IS_BUILD) {
    return globalRef.instance!;
  }

  if (!globalRef.initialized) {
    await globalRef.instance!.init(buildInitOptions());
    globalRef.initialized = true;
  }

  if (!globalRef.started) {
    globalRef.instance!.start();
    globalRef.started = true;
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
  await mirror.refresh();
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
