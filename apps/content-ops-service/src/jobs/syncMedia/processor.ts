import type { Logger } from "../../logger";
import type { ContainerClient } from "@azure/storage-blob";
import type { MediaLibrary, StrapiAdminHttp, Id } from "@moto125/admin-api-client";
import {
  cleanupTmp,
  downloadTmpFromBlob,
  ensureFolder,
  getFolderFilesCacheEntry,
  isSameFile,
  uploadToStrapi,
  type FolderFilesCache,
} from "./helpers";

export type ProcessCounters = {
  processed: number;
  uploaded: number;
  skipped: number;
  errors: number;
};

/** Procesa un blob (descargar, comprobar cache, crear carpeta, subir o saltar). */
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

      const existing = filesMap.get(tmp.fileName);
      if (existing) {
        counters.skipped += 1;
        counters.processed += 1;
        log.info("⏭️ Skip existing", { file: tmp.fileName, folderId, size: tmp.size, mime: tmp.mime });
        await cleanupTmp(tmp.tmpPath);
        return;
      }

      await uploadToStrapi(media, tmp, folderId);
      filesMap.set(tmp.fileName, { size: tmp.size, mime: tmp.mime });

      counters.uploaded += 1;
      counters.processed += 1;
      log.info("📤 Uploaded", { file: tmp.fileName, folderId });

      await cleanupTmp(tmp.tmpPath);
    } catch (err: any) {
      counters.errors += 1;
      counters.processed += 1;
      log.error("❌ Failed processing blob", { name: blobName, error: err?.message ?? String(err) });
    }
  };
}