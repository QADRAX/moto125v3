import type { JobType } from "@moto125/content-ops-shared";

export type ReturnTypeCreateJobStore = {
  init: () => Promise<void>;
  upsertConfig: (input: {
    id: string;
    type: JobType;
    name: string;
    cron?: string;
    config: any;
  }) => Promise<any>;
  getConfigByType: (type: JobType) => Promise<
    | {
        id: string;
        type: JobType;
        name: string;
        cron?: string;
        config: any;
      }
    | undefined
  >;
  listConfigs: () => Promise<
    Array<{
      id: string;
      type: JobType;
      name: string;
      cron?: string;
      config: any;
    }>
  >;
  deleteConfigByType: (type: JobType) => Promise<void>;
  appendRun: (input: {
    jobId: string;
    type: JobType;
    startedAt: Date;
    endedAt: Date;
    processed: number;
    uploaded: number;
    skipped: number;
    errors: number;
    ok: boolean;
    error?: string;
  }) => Promise<any>;
  listRuns: (q?: {
    type?: JobType;
    jobId?: string;
    since?: Date;
    until?: Date;
    limit?: number;
    desc?: boolean;
  }) => Promise<any[]>;
};

export type JobSpecificConfigMap = {
  "sync-media": {
    concurrency: number;
  };
};

export type ConfigFor<T extends JobType> = T extends keyof JobSpecificConfigMap
  ? JobSpecificConfigMap[T]
  : Record<string, never>;

export interface JobConfigRecord<T extends JobType = JobType> {
  id: string;
  type: T;
  name: string;
  cron?: string;
  config: ConfigFor<T>;
}

export interface JobConfigEntity {
  partitionKey: "config";
  rowKey: JobType;
  id: string;
  type: JobType;
  name: string;
  cron?: string;
  configJson?: string;
  updatedAt: string;
}

export interface JobRunEntity {
  partitionKey: JobType;
  rowKey: string;
  jobId: string;
  type: JobType;
  startedAt: string;
  endedAt: string;
  durationMs: number;
  processed: number;
  uploaded: number;
  skipped: number;
  errors: number;
  ok: boolean;
  error?: string;
}

export interface JobStoreOptions {
  azureAccount: string;
  azureKey: string;
  configsTable?: string;
  runsTable?: string;
}

export interface ListRunsOptions {
  type?: JobType;
  jobId?: string;
  since?: Date;
  until?: Date;
  limit?: number;
  desc?: boolean;
}
