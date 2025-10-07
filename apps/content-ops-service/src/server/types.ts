import type { Scheduler } from "../scheduler/Scheduler";
import type { Logger } from "../logger";
import type { LogBus } from "../logging/LogBus";
import type { BasicAuthOptions } from "./auth";
import type { RateLimitOptions } from "./rateLimit";
import type { ContainerClient } from "@azure/storage-blob";
import type { MediaLibrary, StrapiAdminHttp } from "@moto125/admin-api-client";
import type { ReturnTypeCreateJobStore } from "../services/jobStore/types";

export interface ServerOptions {
  port: number;
  scheduler: Scheduler;
  log: Logger;
  bus: LogBus;
  auth: BasicAuthOptions;
  rate: RateLimitOptions & { trustProxy: boolean };
  uiStaticDir?: string;
  services: {
    container: ContainerClient;
    http: StrapiAdminHttp;
    media: MediaLibrary;
    jobStore: ReturnTypeCreateJobStore;
  };
}
