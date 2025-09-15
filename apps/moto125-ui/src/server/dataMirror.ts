import "server-only";
import type {
  DataMirror,
  DataMirrorInitOptions,
} from "@moto125/data-mirror-core";
import { createDataMirror } from "@moto125/data-mirror";

const DEBUG = process.env.DEBUG_MIRROR === "1";

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
    refreshIntervalMs: 120_000,
    autosave: true,
    forceHydrateOnInit: false,
  };
}

async function ensureMirror(): Promise<DataMirror> {
  if (!globalRef.instance) {
    const mirror = createDataMirror();
    globalRef.instance = mirror;

    mirror.onUpdate((s) => {
      if (!DEBUG) return;
      const count = s?.data?.articles?.length ?? 0;
      console.log(
        `[DataMirror] onUpdate: articles=${count}, generatedAt=${s?.generatedAt ?? "-"}`
      );
    });
    mirror.onError((err: any) => {
      console.error("[DataMirror] error:", err);
    });
  }

  if (!globalRef.initialized && globalRef.instance) {
    const t0 = Date.now();
    await globalRef.instance.init(buildInitOptions());
    globalRef.initialized = true;
    if (DEBUG) console.log(`[DataMirror] init done in ${Date.now() - t0}ms`);

    // Lanzar hidratación sin bloquear la response inicial
    // (si hay snapshot, ya pintas algo; si no, la página muestra "Inicializando…")
    const t1 = Date.now();
    globalRef.instance
      .refresh()
      .then(() => {
        if (DEBUG)
          console.log(`[DataMirror] refresh done in ${Date.now() - t1}ms`);
      })
      .catch((e) => {
        console.error("[DataMirror] refresh error:", e);
      });
  }

  if (!globalRef.started && globalRef.instance) {
    globalRef.instance.start();
    globalRef.started = true;
    if (DEBUG) console.log("[DataMirror] started periodic refresh");
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
registerShutdown();
