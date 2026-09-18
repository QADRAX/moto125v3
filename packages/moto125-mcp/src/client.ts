import { createMoto125Api, type Moto125Sdk } from "@moto125/api-client";
import { MediaLibrary, StrapiAdminHttp } from "@moto125/admin-api-client";
import {
  createDiskStore,
  wrapWithDiskCache,
  type DiskStore,
} from "@moto125/sdk-disk-cache";
import { homedir } from "node:os";
import { join } from "node:path";
import { SCAN_ARTICLES_BROKEN_PREFIX } from "./brokenScanCache.js";
import { loadAdminEnv, loadContentEnv } from "./config.js";

let sdk: Moto125Sdk | null = null;
let media: MediaLibrary | null = null;
let diskStore: DiskStore | null = null;

function cacheEnabled(): boolean {
  return process.env.MOTO125_MCP_CACHE !== "0";
}

function defaultCacheDir(): string {
  return (
    process.env.MOTO125_MCP_CACHE_DIR ??
    join(homedir(), ".moto125", "mcp-sdk-disk-cache")
  );
}

function defaultTtlMs(): number {
  const raw = process.env.MOTO125_MCP_CACHE_TTL_MS;
  if (raw == null || raw === "") return 300_000;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 300_000;
}

/** Store disco compartido (SDK wrap + scans auxiliares). */
export function getDiskStore(): DiskStore {
  if (diskStore) return diskStore;
  diskStore = createDiskStore({
    dir: defaultCacheDir(),
    defaultTtlMs: defaultTtlMs(),
    enabled: cacheEnabled(),
  });
  return diskStore;
}

/**
 * SDK de contenido. Defaults alineados con migraciones editoriales:
 * preview (borradores visibles) + locale es (sitio en español).
 * Lecturas envueltas con `@moto125/sdk-disk-cache` (salvo CACHE=0).
 */
export function getSdk(): Moto125Sdk {
  if (sdk) return sdk;
  const { baseUrl, token } = loadContentEnv();
  const raw = createMoto125Api({
    baseUrl,
    token,
    queryDefaults: {
      publicationState: "preview",
      locale: "es",
    },
  });
  const store = getDiskStore();
  sdk = wrapWithDiskCache(raw, {
    store,
    enabled: cacheEnabled(),
    extraInvalidateOn: {
      articles: [SCAN_ARTICLES_BROKEN_PREFIX],
    },
  });
  return sdk;
}

/** Media Library (Admin API). Lazy: solo si se usan tools de media. Sin caché disco. */
export function getMediaLibrary(): MediaLibrary {
  if (media) return media;
  const env = loadAdminEnv();
  const http = new StrapiAdminHttp({
    baseURL: env.baseUrl,
    token: env.token,
    email: env.email,
    password: env.password,
  });
  media = new MediaLibrary(http);
  return media;
}
