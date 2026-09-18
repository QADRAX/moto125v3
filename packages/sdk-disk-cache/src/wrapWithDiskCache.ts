import type { Moto125Sdk } from "@moto125/api-client";
import { createDiskStore, type DiskStore } from "./diskStore.js";
import { cacheKey, namespacePrefix } from "./keys.js";

export type WrapWithDiskCacheOptions = {
  /** Store existente; si no, se crea con `dir`. */
  store?: DiskStore;
  dir?: string;
  defaultTtlMs?: number;
  enabled?: boolean;
  /**
   * Prefijos extra a borrar cuando hay write en un namespace.
   * Ej.: `{ articles: ["scan.articles_broken"] }`
   */
  extraInvalidateOn?: Record<string, string[]>;
};

type AnyFn = (...args: unknown[]) => Promise<unknown>;

async function cachedRead(
  store: DiskStore,
  enabled: boolean,
  namespace: string,
  method: string,
  args: unknown[],
  fn: AnyFn
): Promise<unknown> {
  if (!enabled || !store.enabled) {
    return fn(...args);
  }
  const key = cacheKey(namespace, method, args);
  const hit = await store.get(key);
  if (hit !== undefined) return hit;
  const value = await fn(...args);
  await store.set(key, value);
  return value;
}

async function cachedWrite(
  store: DiskStore,
  enabled: boolean,
  namespace: string,
  extraInvalidateOn: Record<string, string[]> | undefined,
  fn: AnyFn,
  args: unknown[]
): Promise<unknown> {
  const value = await fn(...args);
  if (enabled && store.enabled) {
    await store.deleteByPrefix(namespacePrefix(namespace));
    const extras = extraInvalidateOn?.[namespace] ?? [];
    for (const prefix of extras) {
      await store.deleteByPrefix(prefix);
    }
  }
  return value;
}

function wrapResource(
  resource: Record<string, AnyFn>,
  store: DiskStore,
  enabled: boolean,
  namespace: string,
  readMethods: string[],
  writeMethods: string[],
  extraInvalidateOn?: Record<string, string[]>
): Record<string, AnyFn> {
  const out: Record<string, AnyFn> = { ...resource };
  for (const method of readMethods) {
    const original = resource[method];
    if (typeof original !== "function") continue;
    out[method] = (...args: unknown[]) =>
      cachedRead(store, enabled, namespace, method, args, original);
  }
  for (const method of writeMethods) {
    const original = resource[method];
    if (typeof original !== "function") continue;
    out[method] = (...args: unknown[]) =>
      cachedWrite(store, enabled, namespace, extraInvalidateOn, original, args);
  }
  return out;
}

/**
 * Envuelve un `Moto125Sdk` con caché disco-first en lecturas
 * e invalidación por namespace en writes.
 */
export function wrapWithDiskCache(
  sdk: Moto125Sdk,
  options: WrapWithDiskCacheOptions
): Moto125Sdk {
  const enabled = options.enabled !== false;
  const store =
    options.store ??
    createDiskStore({
      dir: options.dir ?? ".moto125-sdk-disk-cache",
      defaultTtlMs: options.defaultTtlMs,
      enabled,
    });
  const extra = options.extraInvalidateOn;

  const articles = wrapResource(
    sdk.articles as unknown as Record<string, AnyFn>,
    store,
    enabled,
    "articles",
    ["list", "getBySlug", "getById"],
    ["create", "update"],
    extra
  );

  const motos = wrapResource(
    sdk.motos as unknown as Record<string, AnyFn>,
    store,
    enabled,
    "motos",
    ["list", "getByMoto125Id", "getById"],
    ["create", "update"],
    extra
  );

  const companies = wrapResource(
    sdk.companies as unknown as Record<string, AnyFn>,
    store,
    enabled,
    "companies",
    ["list", "getById"],
    ["create", "update"],
    extra
  );

  const articleTypes = wrapResource(
    sdk.taxonomies.articleTypes as unknown as Record<string, AnyFn>,
    store,
    enabled,
    "taxonomies.articleTypes",
    ["list"],
    ["create", "update"],
    extra
  );
  const motoTypes = wrapResource(
    sdk.taxonomies.motoTypes as unknown as Record<string, AnyFn>,
    store,
    enabled,
    "taxonomies.motoTypes",
    ["list"],
    ["create", "update"],
    extra
  );
  const motoClasses = wrapResource(
    sdk.taxonomies.motoClasses as unknown as Record<string, AnyFn>,
    store,
    enabled,
    "taxonomies.motoClasses",
    ["list"],
    ["create", "update"],
    extra
  );

  const config = wrapResource(
    sdk.config as unknown as Record<string, AnyFn>,
    store,
    enabled,
    "config",
    ["get"],
    ["update"],
    extra
  );

  const home = wrapResource(
    sdk.pages.home as unknown as Record<string, AnyFn>,
    store,
    enabled,
    "pages.home",
    ["get"],
    ["update"],
    extra
  );
  const ofertas = wrapResource(
    sdk.pages.ofertas as unknown as Record<string, AnyFn>,
    store,
    enabled,
    "pages.ofertas",
    ["get"],
    ["update"],
    extra
  );
  const aboutUs = wrapResource(
    sdk.pages.aboutUs as unknown as Record<string, AnyFn>,
    store,
    enabled,
    "pages.aboutUs",
    ["get"],
    ["update"],
    extra
  );

  return {
    http: sdk.http,
    articles: articles as Moto125Sdk["articles"],
    motos: motos as Moto125Sdk["motos"],
    companies: companies as Moto125Sdk["companies"],
    taxonomies: {
      articleTypes: articleTypes as Moto125Sdk["taxonomies"]["articleTypes"],
      motoTypes: motoTypes as Moto125Sdk["taxonomies"]["motoTypes"],
      motoClasses: motoClasses as Moto125Sdk["taxonomies"]["motoClasses"],
    },
    config: config as Moto125Sdk["config"],
    pages: {
      home: home as Moto125Sdk["pages"]["home"],
      ofertas: ofertas as Moto125Sdk["pages"]["ofertas"],
      aboutUs: aboutUs as Moto125Sdk["pages"]["aboutUs"],
    },
  };
}
