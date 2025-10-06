import type {
  JobRunResult,
  JobState,
} from "@moto125/content-ops-shared";

export interface Job {
  id: string;
  name: string;
  cron: string;
  enabled: boolean;
  startOnBoot: boolean;
  run: () => Promise<JobRunResult>;
  state: JobState;
}
