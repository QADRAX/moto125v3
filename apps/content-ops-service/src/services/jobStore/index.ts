import { TableClient, TableServiceClient } from "@azure/data-tables";
import type { JobType } from "@moto125/content-ops-shared";
import {
  JobConfigEntity,
  JobConfigRecord,
  JobRunEntity,
  JobStoreOptions,
  ListRunsOptions,
  ReturnTypeCreateJobStore,
} from "./types";
import { buildRunsFilter, parseConfigJson, randomId } from "./helpers";

export function createJobStore(
  opts: JobStoreOptions
): ReturnTypeCreateJobStore {
  const configsTable = opts.configsTable ?? "JobConfigs";
  const runsTable = opts.runsTable ?? "JobRuns";
  const connectionString = `DefaultEndpointsProtocol=https;AccountName=${opts.azureAccount};AccountKey=${opts.azureKey};EndpointSuffix=core.windows.net`;

  const service = TableServiceClient.fromConnectionString(connectionString);
  const configsClient = TableClient.fromConnectionString(
    connectionString,
    configsTable
  );
  const runsClient = TableClient.fromConnectionString(
    connectionString,
    runsTable
  );

  async function init(): Promise<void> {
    await service.createTable(configsTable).catch(() => {});
    await service.createTable(runsTable).catch(() => {});
  }

  async function upsertConfig(
    input: JobConfigRecord<"sync-media">
  ): Promise<JobConfigRecord<"sync-media">>;
  async function upsertConfig(
    input: JobConfigRecord<JobType>
  ): Promise<JobConfigRecord<JobType>>;
  async function upsertConfig(
    input: JobConfigRecord<JobType>
  ): Promise<JobConfigRecord<JobType>> {
    const entity: JobConfigEntity = {
      partitionKey: "config",
      rowKey: input.type,
      id: input.id,
      type: input.type,
      name: input.name,
      cron: input.cron,
      configJson: input.config ? JSON.stringify(input.config) : undefined,
      updatedAt: new Date().toISOString(),
    };
    await configsClient.upsertEntity(entity, "Merge");
    return input;
  }

  async function getConfigByType(
    type: "sync-media"
  ): Promise<JobConfigRecord<"sync-media"> | undefined>;
  async function getConfigByType(
    type: JobType
  ): Promise<JobConfigRecord<JobType> | undefined>;
  async function getConfigByType(
    type: JobType
  ): Promise<JobConfigRecord<JobType> | undefined> {
    try {
      const e = await configsClient.getEntity<JobConfigEntity>("config", type);
      return {
        id: e.id,
        type: e.type,
        name: e.name,
        cron: e.cron,
        config: parseConfigJson(e.configJson) as any,
      };
    } catch (err: any) {
      if (err.statusCode === 404) return undefined;
      throw err;
    }
  }

  async function listConfigs(): Promise<Array<JobConfigRecord<JobType>>> {
    const out: Array<JobConfigRecord<JobType>> = [];
    for await (const e of configsClient.listEntities<JobConfigEntity>({
      queryOptions: { filter: `PartitionKey eq 'config'` },
    })) {
      out.push({
        id: e.id,
        type: e.type,
        name: e.name,
        cron: e.cron,
        config: parseConfigJson(e.configJson) as any,
      });
    }
    return out;
  }

  async function deleteConfigByType(type: JobType): Promise<void> {
    await configsClient.deleteEntity("config", type).catch((e: any) => {
      if (e.statusCode !== 404) throw e;
    });
  }

  async function appendRun(input: {
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
  }): Promise<JobRunEntity> {
    const startedAtISO = input.startedAt.toISOString();
    const rowKey = `${startedAtISO}__${randomId(6)}`;

    const entity: JobRunEntity = {
      partitionKey: input.type,
      rowKey,
      jobId: input.jobId,
      type: input.type,
      startedAt: startedAtISO,
      endedAt: input.endedAt.toISOString(),
      durationMs: +input.endedAt - +input.startedAt,
      processed: input.processed,
      uploaded: input.uploaded,
      skipped: input.skipped,
      errors: input.errors,
      ok: input.ok,
      error: input.error,
    };

    await runsClient.createEntity(entity);
    return entity;
  }

  async function listRuns(q: ListRunsOptions = {}): Promise<JobRunEntity[]> {
    const filter = buildRunsFilter(q);
    const out: JobRunEntity[] = [];
    for await (const e of runsClient.listEntities<JobRunEntity>({
      queryOptions: { filter },
    })) {
      out.push(e as JobRunEntity);
      if (q.limit && out.length >= q.limit) break;
    }
    if (q.desc !== false) out.sort((a, b) => (a.rowKey < b.rowKey ? 1 : -1)); // newest-first
    return out;
  }

  return {
    init,
    upsertConfig,
    getConfigByType,
    listConfigs,
    deleteConfigByType,
    appendRun,
    listRuns,
  };
}
