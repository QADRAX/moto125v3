import type { Logger } from "../../logger";
import type { ContainerClient } from "@azure/storage-blob";
import type { MediaLibrary, StrapiAdminHttp, Id } from "@moto125/admin-api-client";
import {
  cleanupTmp,
  downloadTmpFromBlob,
  ensureFolder,
  getFolderFilesCacheEntry,
  sanitizeNameLikeStrapi,
  uploadToStrapi,
  type FolderFilesCache,
} from "./helpers";

export type ProcessCounters = {
  processed: number;
  uploaded: number;
  skipped: number;
  errors: number;
  total: number;
};

function pctRemaining(c: ProcessCounters): string {
  const remaining = Math.max(c.total - c.processed, 0);
  const pct = c.total > 0 ? (remaining / c.total) * 100 : 0;
  return `${pct.toFixed(2)}%`;
}

export function createBlobProcessor(deps: {
  container: ContainerClient;
  http: StrapiAdminHttp;
  media: MediaLibrary;
  log: Logger;
  cache: FolderFilesCache;
}) {
  const { container, http, media, log, cache } = deps;

  return async function processOne(blobName: string, counters: ProcessCounters) {
    try {
      log.info("📦 Processing blob", {
        name: blobName,
        processed: counters.processed,
        total: counters.total,
        remainingPct: pctRemaining(counters),
      });

      const tmp = await downloadTmpFromBlob(container, blobName);
      const folderId: Id | null = await ensureFolder(media, tmp.folderPath);
      const filesMap = await getFolderFilesCacheEntry(cache, folderId, http, media);

      const key = sanitizeNameLikeStrapi(tmp.fileName);
      if (filesMap.has(key)) {
        counters.skipped += 1;
        counters.processed += 1;
        log.debug("⏭️ Skip existing", {
          file: key,
          folderId,
          processed: counters.processed,
          total: counters.total,
          remainingPct: pctRemaining(counters),
        });
        await cleanupTmp(tmp.tmpPath);
        return;
      }

      const { storedName } = await uploadToStrapi(media, tmp, folderId);
      filesMap.set(sanitizeNameLikeStrapi(storedName), { size: tmp.size, mime: tmp.mime });

      counters.uploaded += 1;
      counters.processed += 1;
      log.info("📤 Uploaded", {
        file: storedName,
        folderId,
        processed: counters.processed,
        total: counters.total,
        remainingPct: pctRemaining(counters),
      });

      await cleanupTmp(tmp.tmpPath);
    } catch (err: any) {
      counters.errors += 1;
      counters.processed += 1;
      log.error("❌ Failed processing blob", {
        name: blobName,
        error: err?.message ?? String(err),
        processed: counters.processed,
        total: counters.total,
        remainingPct: pctRemaining(counters),
      });
    }
  };
}
