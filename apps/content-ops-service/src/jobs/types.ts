import type {
  JobBase,
  JobRunResult,
} from "@moto125/content-ops-shared";

export interface Job extends JobBase {
  run(): Promise<JobRunResult>;
}