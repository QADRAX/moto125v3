import pLimit from "p-limit";
import type { ContainerClient } from "@azure/storage-blob";
import type { Job, JobRunResult } from "./types";
import type { Logger } from "../logger";
import { MediaLibrary, StrapiAdminHttp, type Id } from "@moto125/admin-api-client";
import { downloadBlobToTmp, safeUnlink } from "../services/azureBlob";
import { listFilesInFolderOrRoot } from "../services/strapi";

/** In-memory cache of Strapi files per folder for one run. */
type FolderFilesCache = Map<Id | null, Map<string, { size: number; mime?: string }>>;

export function createSyncMediaJob(opts: {
  cron: string;
  enabled: boolean;
  startOnBoot: boolean;
  concurrency: number;
  container: ContainerClient;
  http: StrapiAdminHttp;
  media: MediaLibrary;
  log: Logger;
}): Job {
  const state = { runs: 0, processed: 0, uploaded: 0, skipped: 0, errors: 0 };

  async function ensureFolder(media: MediaLibrary, folderPath: string): Promise<Id | null> {
    if (!folderPath) return null; // root
    const f = await media.ensureFolderPath(folderPath);
    return f.id;
  }

  async function getFolderFilesCacheEntry(
    cache: FolderFilesCache,
    folderId: Id | null,
    http: StrapiAdminHttp,
    media: MediaLibrary
  ) {
    if (cache.has(folderId)) return cache.get(folderId)!;
    const files = await listFilesInFolderOrRoot({ http, media, folderId });
    const map = new Map<string, { size: number; mime?: string }>();
    for (const f of files) map.set(f.name, { size: f.size ?? 0, mime: f.mime });
    cache.set(folderId, map);
    return map;
  }

  const job: Job = {
    id: "sync-media",
    name: "Sync Azure Blob → Strapi",
    cron: opts.cron,
    enabled: opts.enabled,
    startOnBoot: opts.startOnBoot,
    state,

    async run(): Promise<JobRunResult> {
      const limit = pLimit(Math.max(1, opts.concurrency));
      const cache: FolderFilesCache = new Map();

      let processed = 0;
      let uploaded = 0;
      let skipped = 0;
      let errors = 0;

      const tasks: Array<() => Promise<void>> = [];

      for await (const blob of opts.container.listBlobsFlat()) {
        const blobName = blob.name;

        tasks.push(async () => {
          try {
            opts.log.info("📦 Processing blob", { name: blobName });

            // Download to tmp
            const tmp = await downloadBlobToTmp(opts.container, blobName);
            const folderId = await ensureFolder(opts.media, tmp.folderPath);

            // Load folder cache and compare existence (name + size + mime)
            const filesMap = await getFolderFilesCacheEntry(cache, folderId, opts.http, opts.media);
            const existing = filesMap.get(tmp.fileName);
            const same =
              existing &&
              Number(existing.size) === Number(tmp.size) &&
              (existing.mime ? existing.mime === tmp.mime : true);

            if (same) {
              skipped += 1;
              processed += 1;
              opts.log.debug("⏭️ Skip existing", {
                file: tmp.fileName,
                folderId,
                size: tmp.size,
                mime: tmp.mime,
              });
              await safeUnlink(tmp.tmpPath);
              return;
            }

            // Upload to Strapi
            const uploadedFiles = await opts.media.uploadLocalFile(tmp.tmpPath, {
              folderId,
              filename: tmp.fileName,
            });

            // Update cache for this folder
            filesMap.set(tmp.fileName, { size: tmp.size, mime: tmp.mime });

            uploaded += 1;
            processed += 1;
            opts.log.info("📤 Uploaded", {
              file: tmp.fileName,
              folderId,
              strapiId: uploadedFiles?.[0]?.id,
            });

            await safeUnlink(tmp.tmpPath);
          } catch (err: any) {
            errors += 1;
            processed += 1;
            opts.log.error("❌ Failed processing blob", {
              name: blobName,
              error: err?.message ?? String(err),
            });
          }
        });
      }

      await Promise.all(tasks.map((t) => limit(t)));

      state.runs += 1;
      state.processed += processed;
      state.uploaded += uploaded;
      state.skipped += skipped;
      state.errors += errors;

      return { processed, uploaded, skipped, errors };
    },
  };

  return job;
}
