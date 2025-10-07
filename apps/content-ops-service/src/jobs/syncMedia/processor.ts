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
};

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
      log.info("📦 Processing blob", { name: blobName });

      const tmp = await downloadTmpFromBlob(container, blobName);
      const folderId: Id | null = await ensureFolder(media, tmp.folderPath);

      const filesMap = await getFolderFilesCacheEntry(cache, folderId, http, media);

      const key = sanitizeNameLikeStrapi(tmp.fileName);
      if (filesMap.has(key)) {
        counters.skipped += 1;
        counters.processed += 1;
        log.info("⏭️ Skip existing", { file: key, folderId });
        await cleanupTmp(tmp.tmpPath);
        return;
      }

      const { storedName } = await uploadToStrapi(media, tmp, folderId);

      filesMap.set(sanitizeNameLikeStrapi(storedName), { size: tmp.size, mime: tmp.mime });

      counters.uploaded += 1;
      counters.processed += 1;
      log.info("📤 Uploaded", { file: storedName, folderId });

      await cleanupTmp(tmp.tmpPath);
    } catch (err: any) {
      counters.errors += 1;
      counters.processed += 1;
      log.error("❌ Failed processing blob", { name: blobName, error: err?.message ?? String(err) });
    }
  };
}
