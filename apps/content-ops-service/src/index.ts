import 'dotenv/config';
import { loadConfig } from './config';
import { createLogger } from './logger';
import { Scheduler } from './scheduler/Scheduler';
import { createServer } from './server/server';
import { createSyncMediaJob } from './jobs/syncMedia';

async function main() {
  const cfg = loadConfig();

  const { logger, bus } = createLogger(cfg.LOG_LEVEL, cfg.LOG_BUFFER_SIZE);
  const scheduler = new Scheduler(logger);

  // Register jobs (stub for now)
  scheduler.register(
    createSyncMediaJob({
      cron: cfg.SYNC_MEDIA_CRON,
      enabled: cfg.SYNC_MEDIA_ENABLED,
      startOnBoot: cfg.SYNC_MEDIA_START_ON_BOOT
    })
  );

  // Start HTTP server
  createServer({
    port: cfg.PORT,
    scheduler,
    log: logger,
    bus
  });

  // Optionally run jobs on boot
  await scheduler.runJobsOnBoot();
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Fatal error on startup:', err);
  process.exit(1);
});
