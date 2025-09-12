import type { Moto125Sdk } from "@moto125/api-client";
import type {
  MirrorData,
  MirrorError,
  MirrorState,
  MirrorTimings,
} from "./types";
import { setState } from "./store";
import { fetchAllCollection, safeSingle } from "./strapi";
import { performance } from "node:perf_hooks";
import { saveSnapshot } from "./snapshot";

// hardcoded version marker
const SNAPSHOT_VERSION = "api-client@0.0.2";

function getHttpStatus(e: unknown): number | undefined {
  if (!e || typeof e !== "object") return undefined;
  const any = e as any;
  return any.status ?? any.detail?.status ?? any.response?.status;
}

function toMirrorError(
  source: MirrorError["source"],
  err: unknown
): MirrorError {
  const status = getHttpStatus(err);
  let code: MirrorError["code"] = "UNKNOWN";
  if (typeof status === "number") {
    if (status === 404) code = "HTTP_404";
    else if (status >= 500) code = "HTTP_5XX";
    else if (status >= 400) code = "HTTP_4XX";
  }
  const message =
    (err as any)?.message ??
    (typeof err === "string" ? err : "Unexpected error");

  return {
    time: new Date().toISOString(),
    source,
    code,
    status,
    message,
    detail: (err as any)?.detail ?? undefined,
  };
}

async function timed<T>(
  label: string,
  fn: () => Promise<T>,
  into: Record<string, number>
): Promise<T> {
  const t0 = performance.now();
  try {
    return await fn();
  } finally {
    into[label] = performance.now() - t0;
  }
}

export type HydrateOpts = {
  autosave?: boolean;
  snapshotPath?: string;
};

/**
 * Hydrate everything, but resilient:
 * - Returns partial data + a list of MirrorError.
 * - Never throws due to individual module failures.
 */
export async function hydrateAllResilient(sdk: Moto125Sdk): Promise<{
  data: MirrorData;
  errors: MirrorError[];
  timings: MirrorTimings;
}> {
  const errors: MirrorError[] = [];
  const bySource: Record<string, number> = {};

  const startedAt = new Date().toISOString();
  const tAll0 = performance.now();

  const data: MirrorData = {
    articles: [],
    motos: [],
    companies: [],
    taxonomies: { articleTypes: [], motoTypes: [], motoClasses: [] },
    pages: {},
    config: undefined,
  };

  const jobs: Array<Promise<void>> = [
    (async () => {
      try {
        data.articles = await timed(
          "articles",
          () => fetchAllCollection(sdk.articles.list),
          bySource
        );
      } catch (e) {
        errors.push(toMirrorError("articles", e));
        data.articles = [];
      }
    })(),
    (async () => {
      try {
        data.motos = await timed(
          "motos",
          () => fetchAllCollection(sdk.motos.list),
          bySource
        );
      } catch (e) {
        errors.push(toMirrorError("motos", e));
        data.motos = [];
      }
    })(),
    (async () => {
      try {
        data.companies = await timed(
          "companies",
          () => fetchAllCollection(sdk.companies.list),
          bySource
        );
      } catch (e) {
        errors.push(toMirrorError("companies", e));
        data.companies = [];
      }
    })(),
    (async () => {
      try {
        data.taxonomies.articleTypes = await timed(
          "taxonomies.articleTypes",
          () => fetchAllCollection(sdk.taxonomies.articleTypes.list),
          bySource
        );
      } catch (e) {
        errors.push(toMirrorError("taxonomies.articleTypes", e));
        data.taxonomies.articleTypes = [];
      }
    })(),
    (async () => {
      try {
        data.taxonomies.motoTypes = await timed(
          "taxonomies.motoTypes",
          () => fetchAllCollection(sdk.taxonomies.motoTypes.list),
          bySource
        );
      } catch (e) {
        errors.push(toMirrorError("taxonomies.motoTypes", e));
        data.taxonomies.motoTypes = [];
      }
    })(),
    (async () => {
      try {
        data.taxonomies.motoClasses = await timed(
          "taxonomies.motoClasses",
          () => fetchAllCollection(sdk.taxonomies.motoClasses.list),
          bySource
        );
      } catch (e) {
        errors.push(toMirrorError("taxonomies.motoClasses", e));
        data.taxonomies.motoClasses = [];
      }
    })(),
    (async () => {
      try {
        data.pages.home = await timed(
          "pages.home",
          () => safeSingle((p) => sdk.pages.home.get(p)),
          bySource
        );
      } catch (e) {
        errors.push(toMirrorError("pages.home", e));
        data.pages.home = undefined;
      }
    })(),
    (async () => {
      try {
        data.pages.ofertas = await timed(
          "pages.ofertas",
          () => safeSingle((p) => sdk.pages.ofertas.get(p)),
          bySource
        );
      } catch (e) {
        errors.push(toMirrorError("pages.ofertas", e));
        data.pages.ofertas = undefined;
      }
    })(),
    (async () => {
      try {
        data.pages.aboutUs = await timed(
          "pages.aboutUs",
          () => safeSingle((p) => sdk.pages.aboutUs.get(p)),
          bySource
        );
      } catch (e) {
        errors.push(toMirrorError("pages.aboutUs", e));
        data.pages.aboutUs = undefined;
      }
    })(),
    (async () => {
      try {
        data.config = await timed(
          "config",
          () => safeSingle((p) => sdk.config.get(p)),
          bySource
        );
      } catch (e) {
        errors.push(toMirrorError("config", e));
        data.config = undefined;
      }
    })(),
  ];

  await Promise.all(jobs);

  const totalMs = performance.now() - tAll0;
  const endedAt = new Date().toISOString();

  return {
    data,
    errors,
    timings: {
      hydrate: {
        startedAt,
        endedAt,
        totalMs: Math.round(totalMs),
        bySource: Object.fromEntries(
          Object.entries(bySource).map(([k, v]) => [k, Math.round(v)])
        ),
      },
    },
  };
}

/** Mantiene la API anterior para el mirror service interno */
export async function hydrateAll(
  sdk: Moto125Sdk,
  opts: HydrateOpts = {}
): Promise<{ errors: MirrorError[]; timings: MirrorTimings }> {
  const { data, errors, timings } = await hydrateAllResilient(sdk);

  const next: MirrorState = {
    version: SNAPSHOT_VERSION,
    generatedAt: new Date().toISOString(),
    data,
    timings,
  };

  if (opts.autosave && opts.snapshotPath) {
    const t0 = performance.now();
    try {
      await saveSnapshot(opts.snapshotPath);
    } finally {
      const saveMs = Math.round(performance.now() - t0);
      if (next.timings) {
        next.timings.snapshotSaveMs = saveMs;
      }
    }
  }

  setState(next);

  return { errors, timings: next.timings! };
}
