import type { DiskStore } from "@moto125/sdk-disk-cache";

export const SCAN_ARTICLES_BROKEN_PREFIX = "scan.articles_broken";

export type BrokenScanCacheOpts = {
  publicationState: string;
  pageSize: number;
  maxPages: number;
  force?: boolean;
};

export function brokenScanCacheKey(opts: BrokenScanCacheOpts): string {
  return `${SCAN_ARTICLES_BROKEN_PREFIX}:${opts.publicationState}:s${opts.pageSize}:p${opts.maxPages}`;
}

/**
 * Devuelve el informe cacheado o ejecuta `run` y lo guarda.
 * `force: true` salta la caché.
 */
export async function getOrRunBrokenScan<T>(
  store: DiskStore,
  opts: BrokenScanCacheOpts,
  run: () => Promise<T>
): Promise<{ result: T; fromCache: boolean }> {
  const key = brokenScanCacheKey(opts);
  if (!opts.force && store.enabled) {
    const hit = await store.get<T>(key);
    if (hit !== undefined) {
      return { result: hit, fromCache: true };
    }
  }
  const result = await run();
  if (store.enabled) {
    await store.set(key, result);
  }
  return { result, fromCache: false };
}
