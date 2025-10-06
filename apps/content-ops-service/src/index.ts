import 'dotenv/config';
import { loadConfig } from './config';
import { createLogger } from './logger';
import { Scheduler } from './scheduler/Scheduler';
import { createServer } from './server/server';
import { createSyncMediaJob } from './jobs/syncMedia';
import { createAzureContainer } from './services/azureBlob';
import { createStrapiClients } from './services/strapi';

async function main() {
  const cfg = loadConfig();
  const { logger, bus } = createLogger(cfg.LOG_LEVEL, cfg.LOG_BUFFER_SIZE);
  const scheduler = new Scheduler(logger);

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

  scheduler.register(
    createSyncMediaJob({
      cron: cfg.SYNC_MEDIA_CRON,
      enabled: cfg.SYNC_MEDIA_ENABLED,
      startOnBoot: cfg.SYNC_MEDIA_START_ON_BOOT,
      concurrency: cfg.SYNC_MEDIA_CONCURRENCY,
      container,
      http,
      media,
      log: logger,
    })
  );

  createServer({ port: cfg.PORT, scheduler, log: logger, bus });
  await scheduler.runJobsOnBoot();
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Fatal error on startup:', err);
  process.exit(1);
});
