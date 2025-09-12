import type { Moto125Sdk } from "@moto125/api-client";
import { hydrateAll } from "./hydrate";
import { loadSnapshot, saveSnapshot } from "./snapshot";
import { getMirrorState, setState, subscribe } from "./store";
import type {
  DataMirror,
  DataMirrorInitOptions,
  ErrorListener,
  MirrorError,
  MirrorRootState,
  UpdateListener,
} from "./types";

export function createDataMirror(): DataMirror {
  let sdk: Moto125Sdk | undefined;
  let snapshotPath: string | undefined;
  let autosave = false;
  let intervalMs = 0;
  let timer: NodeJS.Timeout | null = null;
  let refreshing = false;

  const updateListeners = new Set<UpdateListener>();
  const errorListeners = new Set<ErrorListener>();
  const lastErrors: MirrorError[] = [];

  const unsubStore = subscribe((next) => {
    for (const l of updateListeners) l(next);
  });

  function emitError(err: MirrorError) {
    lastErrors.push(err);
    for (const l of errorListeners) l(err);
  }

  async function init(opts: DataMirrorInitOptions): Promise<void> {
    sdk = opts.sdk;
    snapshotPath = opts.snapshotPath;
    autosave = !!opts.autosave;
    intervalMs = opts.refreshIntervalMs ?? 0;

    let loadedFromSnapshot = false;
    if (snapshotPath) {
      try {
        await loadSnapshot(snapshotPath);
        loadedFromSnapshot = true;
      } catch (e) {
        // snapshot ausente o inválido -> seguimos a hidratar
      }
    }

    if (!loadedFromSnapshot || opts.forceHydrateOnInit) {
      if (!sdk) {
        throw new Error(
          "dataMirror.init: no snapshot available and no sdk provided to hydrate."
        );
      }
      await refresh(); // refresca y emite errores si los hay
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
    if (!sdk) throw new Error("dataMirror.refresh: sdk not set.");
    refreshing = true;

    try {
      await hydrateAll(sdk, {
        autosave,
        snapshotPath,
      });
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

  async function save(): Promise<void> {
    if (!snapshotPath) return;
    await saveSnapshot(snapshotPath);
  }

  async function load(): Promise<void> {
    if (!snapshotPath) {
      throw new Error("dataMirror.loadSnapshot: snapshotPath not configured.");
    }
    await loadSnapshot(snapshotPath);
  }

  function configure(
    opts: Partial<Omit<DataMirrorInitOptions, "forceHydrateOnInit">>
  ): void {
    if (opts.sdk !== undefined) sdk = opts.sdk;
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
    saveSnapshot: save,
    loadSnapshot: load,
    configure,
    dispose,
  };
}

export async function createAndStartDataMirror(opts: DataMirrorInitOptions) {
  const dm = createDataMirror();
  await dm.init(opts);
  return dm;
}
