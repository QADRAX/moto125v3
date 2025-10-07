import type { Express } from "express";
import {
  ROUTES,
  type GetJobsResponse,
  type PostRunJobResponse,
  type PostRestartResponse,
  type PostCreateSyncMediaJobRequest,
  type PostCreateJobResponse,
  type DeleteJobResponse,
} from "@moto125/content-ops-shared";
import { createSyncMediaJob } from "../../jobs/syncMedia";
import type { ServerOptions } from "../types";

export function mountJobsRoutes(app: Express, opts: ServerOptions) {
  // List jobs
  app.get(ROUTES.JOBS, (_req, res) => {
    const payload: GetJobsResponse = { data: opts.scheduler.status() };
    res.json(payload);
  });

  // Create/register sync-media (unique by type; cron optional => manual-only)
  app.post(ROUTES.JOBS_SYNC_MEDIA, async (req, res) => {
    const body = req.body as PostCreateSyncMediaJobRequest;

    // payload: { id?: string; cron?: string; concurrency: number }
    if (!body || typeof body.concurrency !== "number" || body.concurrency < 1) {
      const payload: PostCreateJobResponse = {
        ok: false,
        error: "Invalid payload. Required: { concurrency: number>=1, id?: string, cron?: string }",
      };
      return res.status(400).json(payload);
    }

    // Enforce one job per type
    if (opts.scheduler.hasType("sync-media")) {
      const payload: PostCreateJobResponse = { ok: false, error: "Job type already registered: sync-media" };
      return res.status(409).json(payload);
    }

    const id = (body.id ?? `sync-media-${Date.now()}`).trim();
    const cron = typeof body.cron === "string" && body.cron.trim() ? body.cron.trim() : undefined;

    const job = createSyncMediaJob({
      cron,
      concurrency: body.concurrency,
      container: opts.services.container,
      http: opts.services.http,
      media: opts.services.media,
      log: opts.log,
    });
    (job as any).id = id;

    // Register in Scheduler (schedules cron if present)
    opts.scheduler.register(job);

    // Persist config (cron = común; concurrency = específica del tipo)
    await opts.services.jobStore.upsertConfig({
      id,
      type: "sync-media",
      name: job.name,
      cron,
      config: { concurrency: body.concurrency },
    });

    const payload: PostCreateJobResponse = { ok: true, id, type: "sync-media" };
    return res.json(payload);
  });

  // Delete / unregister
  app.delete(ROUTES.JOB_DELETE(":id"), async (req, res) => {
    const id = req.params.id;
    const job = opts.scheduler.get(id); // añadimos get() en el Scheduler
    if (!job) {
      const payload: DeleteJobResponse = { ok: false, error: `Job not found: ${id}` };
      return res.status(404).json(payload);
    }

    const removed = opts.scheduler.unregister(id);
    if (!removed) {
      const payload: DeleteJobResponse = { ok: false, error: `Unable to remove job: ${id}` };
      return res.status(400).json(payload);
    }

    // Delete persisted config by type
    await opts.services.jobStore.deleteConfigByType(job.type);

    const payload: DeleteJobResponse = { ok: true, id };
    return res.json(payload);
  });

  // Run now (manual trigger). Also log run into JobStore.
  app.post(ROUTES.JOB_RUN(":id"), async (req, res) => {
    const id = req.params.id;
    const job = opts.scheduler.get(id);
    if (!job) {
      const payload: PostRunJobResponse = { ok: false, error: `Job not found: ${id}` };
      return res.status(404).json(payload);
    }

    const startedAt = new Date();
    try {
      const result = await opts.scheduler.execute(id);
      const endedAt = new Date();

      await opts.services.jobStore.appendRun({
        jobId: id,
        type: job.type,
        startedAt,
        endedAt,
        processed: result.processed,
        uploaded: result.uploaded,
        skipped: result.skipped,
        errors: result.errors,
        ok: result.errors === 0,
      });

      const payload: PostRunJobResponse = { ok: true };
      return res.json(payload);
    } catch (err: any) {
      const endedAt = new Date();

      // Try to record failure as well
      try {
        await opts.services.jobStore.appendRun({
          jobId: id,
          type: job.type,
          startedAt,
          endedAt,
          processed: job.state.processed ?? 0,
          uploaded: job.state.uploaded ?? 0,
          skipped: job.state.skipped ?? 0,
          errors: (job.state.errors ?? 0) + 1,
          ok: false,
          error: err?.message ?? String(err),
        });
      } catch {} // no romper la respuesta por fallo de logging

      const code = (err && (err as any).code) || "";
      const status = code === "JOB_TYPE_LOCKED" ? 409 : 400;
      const payload: PostRunJobResponse = { ok: false, error: err?.message ?? String(err) };
      return res.status(status).json(payload);
    }
  });

  // Restart scheduler (rebuild cron handles)
  app.post(ROUTES.SCHEDULER_RESTART, (_req, res) => {
    opts.scheduler.restart();
    const payload: PostRestartResponse = { ok: true };
    res.json(payload);
  });
}
