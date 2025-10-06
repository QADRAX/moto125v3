import express from "express";
import cors from "cors";
import type { Scheduler } from "../scheduler/Scheduler";
import type { Logger } from "../logger";
import type { LogBus } from "../logging/LogBus";
import path from "node:path";
import { basicAuth, type BasicAuthOptions } from "./auth";
import { rateLimit, type RateLimitOptions } from "./rateLimit";

/** Options for createServer */
export interface ServerOptions {
  port: number;
  scheduler: Scheduler;
  log: Logger;
  bus: LogBus;
  auth: BasicAuthOptions;
  rate: RateLimitOptions & { trustProxy: boolean };
}

/**
 * Creates and starts the HTTP server (Express 5).
 * Endpoints:
 *  - GET  /health                 → service liveness (no auth)
 *  - GET  /jobs                   → list job status (auth)
 *  - POST /jobs/:id/run           → run one job now (auth)
 *  - POST /scheduler/restart      → restart cron schedules (auth)
 *  - GET  /logs/stream            → SSE stream of logs (auth)
 *  - GET  /                       → tiny static UI (auth)
 */
export function createServer(opts: ServerOptions) {
  const app = express();

  // Use real client IP when behind a proxy (Nginx/Ingress)
  if (opts.rate.trustProxy) app.set("trust proxy", true);

  // Global rate-limit for EVERYTHING (static, APIs, SSE, etc.)
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

  // Public healthcheck
  app.get("/health", (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

  // Basic auth for all the rest (UI + APIs + SSE)
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
  app.get("/jobs", (_req, res) => {
    res.json({ data: opts.scheduler.status() });
  });

  app.post("/jobs/:id/run", async (req, res) => {
    const id = req.params.id;
    try {
      await opts.scheduler.execute(id);
      res.json({ ok: true });
    } catch (err: any) {
      res.status(400).json({ ok: false, error: err?.message ?? String(err) });
    }
  });

  app.post("/scheduler/restart", (_req, res) => {
    opts.scheduler.restart();
    res.json({ ok: true });
  });

  // SSE logs
  app.get("/logs/stream", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    const snapshot = opts.bus.snapshot();
    for (const e of snapshot) res.write(`data: ${JSON.stringify(e)}\n\n`);

    const unsub = opts.bus.subscribe((e) => res.write(`data: ${JSON.stringify(e)}\n\n`));
    req.on("close", () => {
      unsub();
      res.end();
    });
  });

  // Static UI
  app.use("/", express.static(path.join(__dirname, "static")));

  const server = app.listen(opts.port, () => {
    opts.log.info(`HTTP server listening on port ${opts.port}`);
  });

  return server;
}
