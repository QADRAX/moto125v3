import type { DiskStore } from "@moto125/sdk-disk-cache";

export const SCAN_ARTICLES_BROKEN_PREFIX = "scan.articles_broken";
export const SCAN_ARTICLES_IMAGE_ISSUES_PREFIX = "scan.articles_image_issues";

export type ScanCacheOpts = {
  publicationState: string;
  pageSize: number;
  maxPages: number;
  force?: boolean;
};

/** @deprecated alias — prefer ScanCacheOpts */
export type BrokenScanCacheOpts = ScanCacheOpts;

export function scanCacheKey(prefix: string, opts: ScanCacheOpts): string {
  return `${prefix}:${opts.publicationState}:s${opts.pageSize}:p${opts.maxPages}`;
}

export function brokenScanCacheKey(opts: ScanCacheOpts): string {
  return scanCacheKey(SCAN_ARTICLES_BROKEN_PREFIX, opts);
}

export function imageIssuesScanCacheKey(opts: ScanCacheOpts): string {
  return scanCacheKey(SCAN_ARTICLES_IMAGE_ISSUES_PREFIX, opts);
}

/**
 * Devuelve el informe cacheado o ejecuta `run` y lo guarda.
 * `force: true` salta la caché.
 */
export async function getOrRunScan<T>(
  store: DiskStore,
  prefix: string,
  opts: ScanCacheOpts,
  run: () => Promise<T>
): Promise<{ result: T; fromCache: boolean }> {
  const key = scanCacheKey(prefix, opts);
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

export async function getOrRunBrokenScan<T>(
  store: DiskStore,
  opts: ScanCacheOpts,
  run: () => Promise<T>
): Promise<{ result: T; fromCache: boolean }> {
  return getOrRunScan(store, SCAN_ARTICLES_BROKEN_PREFIX, opts, run);
}

export async function getOrRunImageIssuesScan<T>(
  store: DiskStore,
  opts: ScanCacheOpts,
  run: () => Promise<T>
): Promise<{ result: T; fromCache: boolean }> {
  return getOrRunScan(store, SCAN_ARTICLES_IMAGE_ISSUES_PREFIX, opts, run);
}
