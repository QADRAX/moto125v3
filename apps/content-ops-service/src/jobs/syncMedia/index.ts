import type { ContainerClient } from "@azure/storage-blob";
import type { Job } from "../types";
import type { Logger } from "../../logger";
import { MediaLibrary, StrapiAdminHttp } from "@moto125/admin-api-client";
import { type JobRunResult } from "@moto125/content-ops-shared";
import { type FolderFilesCache } from "./helpers";
import { createBlobProcessor, type ProcessCounters } from "./processor";

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

  const job: Job = {
    id: "sync-media",
    name: "Sync Azure Blob → Strapi",
    cron: opts.cron,
    enabled: opts.enabled,
    startOnBoot: opts.startOnBoot,
    state,

    async run(): Promise<JobRunResult> {
      const cache: FolderFilesCache = new Map();
      const counters: ProcessCounters = { processed: 0, uploaded: 0, skipped: 0, errors: 0 };

      const processOne = createBlobProcessor({
        container: opts.container,
        http: opts.http,
        media: opts.media,
        log: opts.log,
        cache,
      });

      for await (const blob of opts.container.listBlobsFlat()) {
        await processOne(blob.name, counters);
      }

      state.runs += 1;
      state.processed += counters.processed;
      state.uploaded += counters.uploaded;
      state.skipped += counters.skipped;
      state.errors += counters.errors;

      return { ...counters };
    },
  };

  return job;
}
