import express from "express";
import cors from "cors";
import type { Scheduler } from "../scheduler/Scheduler";
import type { Logger } from "../logger";
import type { LogBus } from "../logging/LogBus";
import { basicAuth, type BasicAuthOptions } from "./auth";
import { rateLimit, type RateLimitOptions } from "./rateLimit";
import {
  ROUTES,
  type GetJobsResponse,
  type PostRunJobResponse,
  type PostRestartResponse,
  type HealthResponse,
} from "@moto125/content-ops-shared";
import { resolveUiDistPath } from "./resolveUiPath";

export interface ServerOptions {
  port: number;
  scheduler: Scheduler;
  log: Logger;
  bus: LogBus;
  auth: BasicAuthOptions;
  rate: RateLimitOptions & { trustProxy: boolean };
  uiStaticDir?: string;
}

export function createServer(opts: ServerOptions) {
  const app = express();

  if (opts.rate.trustProxy) app.set("trust proxy", true);
  app.use(
    rateLimit({
      capacity: opts.rate.capacity,
      windowSeconds: opts.rate.windowSeconds,
      maxTrackedKeys: opts.rate.maxTrackedKeys,
      pruneIntervalSeconds: opts.rate.pruneIntervalSeconds,
    })
  );
  app.use(cors());
  app.use(express.json());

  // Health (público)
  app.get(ROUTES.HEALTH, (_req, res) => {
    const payload: HealthResponse = { ok: true, ts: new Date().toISOString() };
    res.json(payload);
  });

  // Protegido
  app.use(
    basicAuth({
      user: opts.auth.user,
      password: opts.auth.password,
      maxFails: opts.auth.maxFails,
      lockoutSeconds: opts.auth.lockoutSeconds,
      windowSeconds: opts.auth.windowSeconds,
      maxTrackedKeys: opts.auth.maxTrackedKeys,
      pruneIntervalSeconds: opts.auth.pruneIntervalSeconds,
    })
  );

  // Jobs API
  app.get(ROUTES.JOBS, (_req, res) => {
    const payload: GetJobsResponse = { data: opts.scheduler.status() };
    res.json(payload);
  });

  app.post(ROUTES.JOB_RUN(":id"), async (req, res) => {
    const id = req.params.id;
    try {
      await opts.scheduler.execute(id);
      const payload: PostRunJobResponse = { ok: true };
      res.json(payload);
    } catch (err: any) {
      const payload: PostRunJobResponse = {
        ok: false,
        error: err?.message ?? String(err),
      };
      res.status(400).json(payload);
    }
  });

  app.post(ROUTES.SCHEDULER_RESTART, (_req, res) => {
    opts.scheduler.restart();
    const payload: PostRestartResponse = { ok: true };
    res.json(payload);
  });

  // SSE logs
  app.get(ROUTES.LOGS_STREAM, (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    for (const e of opts.bus.snapshot())
      res.write(`data: ${JSON.stringify(e)}\n\n`);
    const unsub = opts.bus.subscribe((e) =>
      res.write(`data: ${JSON.stringify(e)}\n\n`)
    );
    req.on("close", () => {
      unsub();
      res.end();
    });
  });

  // Static UI (si tienes UI build)
  const uiRoot = resolveUiDistPath();
  opts.log.info(`Serving UI from package: ${uiRoot}`);
  app.use("/", express.static(uiRoot));

  const server = app.listen(opts.port, () => {
    opts.log.info(`HTTP server listening on port ${opts.port}`);
  });
  return server;
}
