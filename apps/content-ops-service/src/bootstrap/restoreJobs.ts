import type { Scheduler } from "../scheduler/Scheduler";
import type { Logger } from "../logger";
import type { ReturnTypeCreateJobStore } from "../services/jobStore/types";
import type { ContainerClient } from "@azure/storage-blob";
import type { MediaLibrary, StrapiAdminHttp } from "@moto125/admin-api-client";
import { createSyncMediaJob } from "../jobs/syncMedia";

/**
 * Rehydrates jobs from Azure Table at startup.
 * Reads persisted configs and registers each known job type in the Scheduler.
 */
export async function restoreJobs(opts: {
  scheduler: Scheduler;
  log: Logger;
  jobStore: ReturnTypeCreateJobStore;
  services: {
    container: ContainerClient;
    http: StrapiAdminHttp;
    media: MediaLibrary;
  };
}) {
  const { scheduler, jobStore, log, services } = opts;

  log.info("Restoring job configs from Azure Table...");

  const configs = await jobStore.listConfigs();

  for (const cfg of configs) {
    try {
      switch (cfg.type) {
        case "sync-media": {
          const concurrency = cfg.config?.concurrency ?? 1;
          const job = createSyncMediaJob({
            id: cfg.id,
            cron: cfg.cron,
            concurrency,
            container: services.container,
            http: services.http,
            media: services.media,
            log,
          });
          (job as any).id = cfg.id;

          if (scheduler.has(cfg.id)) scheduler.unregister(cfg.id);
          scheduler.register(job);

          log.info(
            `Restored job type=${cfg.type} id=${cfg.id} cron=${cfg.cron ?? "manual"}`
          );
          break;
        }
        default:
          log.warn(`Unknown job type in table: ${cfg.type}`);
      }
    } catch (err: any) {
      log.error(
        `Failed to restore job type=${cfg.type}: ${err?.message ?? err}`
      );
    }
  }

  log.info(`Restored ${configs.length} job configs.`);
}
