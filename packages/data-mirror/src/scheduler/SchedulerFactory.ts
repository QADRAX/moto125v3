import type { DataMirrorInitOptions } from "@moto125/data-mirror-core";
import type { Scheduler } from "./Scheduler";
import { CronScheduler } from "./CronScheduler";
import { IntervalScheduler } from "./IntervalScheduler";

export function createScheduler(
  opts: Pick<
    DataMirrorInitOptions,
    "refreshIntervalMs" | "refreshCron" | "cronTimezone"
  >,
  task: () => Promise<void> | void
): Scheduler & {
  reconfigure(
    next: Partial<
      Pick<
        DataMirrorInitOptions,
        "refreshIntervalMs" | "refreshCron" | "cronTimezone"
      >
    >
  ): void;
} {
  let current: Scheduler;

  let cron: CronScheduler | undefined;

  let interval: IntervalScheduler | undefined;

  const ensure = () => {
    const useCron = !!(opts.refreshCron && opts.refreshCron.trim());
    if (useCron) {
      if (!cron)
        cron = new CronScheduler(
          opts.refreshCron!.trim(),
          opts.cronTimezone,
          task
        );
      current = cron;
    } else {
      const ms = opts.refreshIntervalMs ?? 0;
      if (!interval) interval = new IntervalScheduler(ms, task);
      else interval.setIntervalMs(ms);
      current = interval;
    }
  };

  ensure();

  const facade: Scheduler & {
    reconfigure: (
      next: Partial<
        Pick<
          DataMirrorInitOptions,
          "refreshIntervalMs" | "refreshCron" | "cronTimezone"
        >
      >
    ) => void;
  } = {
    start: () => current.start(),
    stop: () => current.stop(),
    dispose: () => current.dispose(),
    get isRunning() {
      return current.isRunning;
    },
    reconfigure: (next) => {
      const wasRunning = current.isRunning;
      current.stop();
      opts = { ...opts, ...next };
      const prev = current;
      ensure();

      if (prev !== current) {
        prev.dispose();
      }

      if (
        cron &&
        current === cron &&
        (next.refreshCron !== undefined || next.cronTimezone !== undefined)
      ) {
        cron.setCron(opts.refreshCron, opts.cronTimezone);
      }
      if (
        interval &&
        current === interval &&
        next.refreshIntervalMs !== undefined
      ) {
        interval.setIntervalMs(opts.refreshIntervalMs ?? 0);
      }

      if (wasRunning) current.start();
    },
  };

  return facade;
}
