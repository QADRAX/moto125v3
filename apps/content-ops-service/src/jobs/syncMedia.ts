import type { Job, JobRunResult } from './types';

/**
 * Stub implementation. In next step we'll implement:
 * - Azure Blob listing
 * - ensure folder path in Strapi (MediaLibrary)
 * - check if file exists (name+size+mime) and skip/upload accordingly
 */
export function createSyncMediaJob(opts: {
  cron: string;
  enabled: boolean;
  startOnBoot: boolean;
}) : Job {
  const state = {
    runs: 0,
    processed: 0,
    uploaded: 0,
    skipped: 0,
    errors: 0
  };

  const job: Job = {
    id: 'sync-media',
    name: 'Sync Azure Blob → Strapi',
    cron: opts.cron,
    enabled: opts.enabled,
    startOnBoot: opts.startOnBoot,
    state,

    async run(): Promise<JobRunResult> {
      const simulated: JobRunResult = {
        processed: 3,
        uploaded: 2,
        skipped: 1,
        errors: 0
      };
      return simulated;
    }
  };

  return job;
}
