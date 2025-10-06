import express from "express";
import cors from "cors";
import type { Scheduler } from "../scheduler/Scheduler";
import type { Logger } from "../logger";
import type { LogBus } from "../logging/LogBus";
import path from "node:path";
import { basicAuth } from "./auth";

export function createServer(opts: {
  port: number;
  scheduler: Scheduler;
  log: Logger;
  bus: LogBus;
  auth: { user: string; password: string };
}) {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Health (no auth)
  app.get("/health", (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

  // Basic auth for everything else (UI, logs, APIs)
  app.use(basicAuth(opts.auth));

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

  // SSE logs (protegido por Basic Auth)
  app.get("/logs/stream", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    const snapshot = opts.bus.snapshot();
    for (const e of snapshot) {
      res.write(`data: ${JSON.stringify(e)}\n\n`);
    }

    const unsub = opts.bus.subscribe((e) => {
      res.write(`data: ${JSON.stringify(e)}\n\n`);
    });

    req.on("close", () => {
      unsub();
      res.end();
    });
  });

  // Static UI (protegido por Basic Auth)
  app.use("/", express.static(path.join(__dirname, "static")));

  const server = app.listen(opts.port, () => {
    opts.log.info(`HTTP server listening on port ${opts.port}`);
  });

  return server;
}
