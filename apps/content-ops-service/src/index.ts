import "dotenv/config";

import { loadConfig } from "./config";
import { createLogger } from "./logger";
import { Scheduler } from "./scheduler/Scheduler";
import { createServer } from "./server";
import { createAzureContainer } from "./services/azureBlob";
import { createStrapiClients } from "./services/strapi";

import { createJobStore } from "./services/jobStore";
import { restoreJobs } from "./bootstrap/restoreJobs";

async function main() {
  const cfg = loadConfig();

  // Logger + Scheduler
  const { logger, bus } = createLogger(cfg.LOG_LEVEL, cfg.LOG_BUFFER_SIZE);
  const scheduler = new Scheduler(logger);

  // Servicios externos
  const container = createAzureContainer({
    account: cfg.AZURE_ACCOUNT,
    key: cfg.AZURE_KEY,
    container: cfg.AZURE_CONTAINER,
  });

  const { http, media } = await createStrapiClients({
    baseURL: cfg.STRAPI_ADMIN_BASE_URL,
    token: cfg.STRAPI_ADMIN_TOKEN,
    email: cfg.STRAPI_ADMIN_EMAIL,
    password: cfg.STRAPI_ADMIN_PASSWORD,
  });

  // JobStore (Azure Table Storage) — misma cuenta que Blob
  const jobStore = createJobStore({
    azureAccount: cfg.AZURE_ACCOUNT,
    azureKey: cfg.AZURE_KEY,
  });
  await jobStore.init();

  // Rehidratar jobs desde tablas (monta cron/manual según `cron` guardado)
  await restoreJobs({
    scheduler,
    log: logger,
    jobStore,
    services: { container, http, media },
  });

  // Arrancar HTTP server
  createServer({
    port: cfg.PORT,
    scheduler,
    log: logger,
    bus,
    auth: {
      user: cfg.BASIC_AUTH_USER,
      password: cfg.BASIC_AUTH_PASSWORD,
      maxFails: cfg.SEC_AUTH_MAX_FAILS,
      lockoutSeconds: cfg.SEC_AUTH_LOCKOUT_SECONDS,
      windowSeconds: cfg.SEC_WINDOW_SECONDS,
      maxTrackedKeys: cfg.SEC_MAX_TRACKED_KEYS,
      pruneIntervalSeconds: cfg.SEC_PRUNE_INTERVAL_SECONDS,
    },
    rate: {
      capacity: cfg.SEC_RATE_CAPACITY,
      windowSeconds: cfg.SEC_WINDOW_SECONDS,
      maxTrackedKeys: cfg.SEC_MAX_TRACKED_KEYS,
      pruneIntervalSeconds: cfg.SEC_PRUNE_INTERVAL_SECONDS,
      trustProxy: cfg.SEC_TRUST_PROXY,
    },
    services: { container, http, media, jobStore },
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Fatal error on startup:", err);
  process.exit(1);
});
