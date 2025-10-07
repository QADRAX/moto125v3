import type { ContainerClient } from "@azure/storage-blob";
import type { Job } from "../types";
import type { Logger } from "../../logger";
import { MediaLibrary, StrapiAdminHttp } from "@moto125/admin-api-client";
import { type JobRunResult } from "@moto125/content-ops-shared";
import { type FolderFilesCache } from "./helpers";
import { createBlobProcessor, type ProcessCounters } from "./processor";

export function createSyncMediaJob(opts: {
  cron?: string;
  concurrency: number;
  container: ContainerClient;
  http: StrapiAdminHttp;
  media: MediaLibrary;
  log: Logger;
}): Job {
  const state = { runs: 0, processed: 0, uploaded: 0, skipped: 0, errors: 0 };

  const job: Job = {
    id: "sync-media",
    type: "sync-media",
    name: "Sync Azure Blob → Strapi",
    cron: opts.cron,
    state,

    async run(): Promise<JobRunResult> {
      const cache: FolderFilesCache = new Map();

      const counters: ProcessCounters = {
        processed: 0,
        uploaded: 0,
        skipped: 0,
        errors: 0,
        total: 0,
      };

      let total = 0;
      for await (const _ of opts.container.listBlobsFlat()) total += 1;
      counters.total = total;

      const processOne = createBlobProcessor({
        container: opts.container,
        http: opts.http,
        media: opts.media,
        log: opts.log,
        cache,
      });

      const inflight = new Set<Promise<void>>();
      const max = Math.max(1, opts.concurrency || 1);

      for await (const blob of opts.container.listBlobsFlat()) {
        const p = (async () => {
          await processOne(blob.name, counters);
        })();
        inflight.add(p);
        p.finally(() => inflight.delete(p));
        if (inflight.size >= max) await Promise.race(inflight);
      }
      await Promise.all(inflight);

      return {
        processed: counters.processed,
        uploaded: counters.uploaded,
        skipped: counters.skipped,
        errors: counters.errors,
      };
    },
  };

  return job;
}
