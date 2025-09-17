import {
  SdkInit,
  type DataMirror,
  type DataMirrorInitOptions,
  type ErrorListener,
  type MirrorError,
  type MirrorRootState,
  type UpdateListener,
} from "@moto125/data-mirror-core";

import { getMirrorState, setState, subscribe } from "./store";
import { MirrorWorkerClient } from "./MirrorWorkerClient";

export function createDataMirror(): DataMirror {
  let sdkInit: SdkInit | undefined;
  let snapshotPath: string | undefined;
  let autosave = false;
  let intervalMs = 0;
  let timer: NodeJS.Timeout | null = null;
  let refreshing = false;

  const updateListeners = new Set<UpdateListener>();
  const errorListeners = new Set<ErrorListener>();
  const lastErrors: MirrorError[] = [];

  const worker = new MirrorWorkerClient();

  const unsubStore = subscribe((next) => {
    for (const l of updateListeners) l(next);
  });

  function emitError(err: MirrorError) {
    lastErrors.push(err);
    for (const l of errorListeners) l(err);
  }

  async function init(opts: DataMirrorInitOptions): Promise<void> {
    await worker.init();

    sdkInit = opts.sdkInit;
    snapshotPath = opts.snapshotPath;
    autosave = !!opts.autosave;
    intervalMs = opts.refreshIntervalMs ?? 0;

    let loadedFromSnapshot = false;
    if (snapshotPath) {
      try {
        const loaded = await worker.loadSnapshot(snapshotPath);
        setState(loaded);
        loadedFromSnapshot = true;
      } catch (e: any) {
        const apiErrors: MirrorError[] | undefined = e?.__mirrorErrors;
        if (Array.isArray(apiErrors) && apiErrors.length > 0) {
          for (const err of apiErrors) emitError(err);
        } else {
          emitError({
            time: new Date().toISOString(),
            source: "snapshot",
            code: "UNKNOWN",
            status: undefined,
            message: e?.message ?? String(e),
            detail: e?.stack ?? undefined,
          });
        }
      }
    }

    if (!loadedFromSnapshot || opts.forceHydrateOnInit) {
      if (!sdkInit) {
        throw new Error(
          "dataMirror.init: no snapshot available and no sdk provided to hydrate."
        );
      }
      await refresh();
    }

    if (intervalMs > 0) start();
  }

  function state(): MirrorRootState {
    return getMirrorState();
  }

  function onUpdate(listener: UpdateListener): () => void {
    updateListeners.add(listener);
    listener(state()); // push inicial
    return () => updateListeners.delete(listener);
  }

  function onError(listener: ErrorListener): () => void {
    errorListeners.add(listener);
    return () => errorListeners.delete(listener);
  }

  function getErrors(): ReadonlyArray<MirrorError> {
    return lastErrors;
  }

  function clearErrors(): void {
    lastErrors.length = 0;
  }

  async function refresh(): Promise<void> {
    if (refreshing) return;
    if (!sdkInit) throw new Error("dataMirror.refresh: sdk not set.");
    refreshing = true;

    try {
      const next = await worker.hydrate(sdkInit);
      setState(next);
      if (autosave && snapshotPath) {
        await worker.saveSnapshot(snapshotPath, next);
      }
    } catch (e: any) {
      const apiErrors: MirrorError[] | undefined = e?.__mirrorErrors;
      if (Array.isArray(apiErrors) && apiErrors.length > 0) {
        for (const err of apiErrors) emitError(err);
      } else {
        emitError({
          time: new Date().toISOString(),
          source: "unknown",
          code: "UNKNOWN",
          status: undefined,
          message: e?.message ?? String(e),
          detail: e?.stack ?? undefined,
        });
      }
    } finally {
      refreshing = false;
    }
  }

  function start(): void {
    if (timer || intervalMs <= 0) return;
    timer = setInterval(() => {
      void refresh();
    }, intervalMs);
  }

  function stop(): void {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  async function saveSnapshot(): Promise<void> {
    if (!snapshotPath) return;
    const current = getMirrorState();
    if (!current) return;
    try {
      await worker.saveSnapshot(snapshotPath, current);
    } catch (e: any) {
      const apiErrors: MirrorError[] | undefined = e?.__mirrorErrors;
      if (Array.isArray(apiErrors) && apiErrors.length > 0) {
        for (const err of apiErrors) emitError(err);
        return; // already emitted
      }
      emitError({
        time: new Date().toISOString(),
        source: "snapshot",
        code: "UNKNOWN",
        status: undefined,
        message: e?.message ?? String(e),
        detail: e?.stack ?? undefined,
      });
    }
  }

  async function loadSnapshot(): Promise<void> {
    if (!snapshotPath)
      throw new Error("dataMirror.loadSnapshot: snapshotPath not configured.");
    try {
      const loaded = await worker.loadSnapshot(snapshotPath);
      setState(loaded);
    } catch (e: any) {
      const apiErrors: MirrorError[] | undefined = e?.__mirrorErrors;
      if (Array.isArray(apiErrors) && apiErrors.length > 0) {
        for (const err of apiErrors) emitError(err);
      } else {
        emitError({
          time: new Date().toISOString(),
          source: "snapshot",
          code: "UNKNOWN",
          status: undefined,
          message: e?.message ?? String(e),
          detail: e?.stack ?? undefined,
        });
      }
    }
  }

  function configure(
    opts: Partial<Omit<DataMirrorInitOptions, "forceHydrateOnInit">>
  ): void {
    sdkInit = opts.sdkInit;
    if (opts.snapshotPath !== undefined) snapshotPath = opts.snapshotPath;
    if (opts.autosave !== undefined) autosave = !!opts.autosave;

    if (opts.refreshIntervalMs !== undefined) {
      intervalMs = opts.refreshIntervalMs;
      stop();
      if (intervalMs > 0) start();
    }
  }

  function dispose(): void {
    stop();
    unsubStore();
    updateListeners.clear();
    errorListeners.clear();
    lastErrors.length = 0;
    worker.dispose();
  }

  return {
    init,
    state,
    onUpdate,
    onError,
    getErrors,
    clearErrors,
    refresh,
    start,
    stop,
    saveSnapshot,
    loadSnapshot,
    configure,
    dispose,
  };
}

export async function createAndStartDataMirror(opts: DataMirrorInitOptions) {
  const dm = createDataMirror();
  await dm.init(opts);
  return dm;
}
