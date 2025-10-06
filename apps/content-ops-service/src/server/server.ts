import express from 'express';
import cors from 'cors';
import type { Scheduler } from '../scheduler/Scheduler';
import type { Logger } from '../logger';
import type { LogBus } from '../logging/LogBus';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Creates and starts the HTTP server (Express).
 * Endpoints:
 *  - GET  /health                 → service liveness
 *  - GET  /jobs                   → list job status
 *  - POST /jobs/:id/run           → run one job now
 *  - POST /scheduler/restart      → restart cron schedules
 *  - GET  /logs/stream            → SSE stream of logs
 *  - GET  /                       → tiny UI (static)
 */
export function createServer(opts: {
  port: number;
  scheduler: Scheduler;
  log: Logger;
  bus: LogBus;
}) {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

  app.get('/jobs', (_req, res) => {
    res.json({ data: opts.scheduler.status() });
  });

  app.post('/jobs/:id/run', async (req, res) => {
    const id = req.params.id;
    try {
      await opts.scheduler.execute(id);
      res.json({ ok: true });
    } catch (err: any) {
      res.status(400).json({ ok: false, error: err?.message ?? String(err) });
    }
  });

  app.post('/scheduler/restart', (_req, res) => {
    opts.scheduler.restart();
    res.json({ ok: true });
  });

  // Server-Sent Events for logs
  app.get('/logs/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // send current snapshot
    const snapshot = opts.bus.snapshot();
    for (const e of snapshot) {
      res.write(`data: ${JSON.stringify(e)}\n\n`);
    }

    // subscribe to new logs
    const unsub = opts.bus.subscribe((e) => {
      res.write(`data: ${JSON.stringify(e)}\n\n`);
    });

    // cleanup on close
    req.on('close', () => {
      unsub();
      res.end();
    });
  });

  // Tiny static UI (optional)
  app.use('/', express.static(path.join(__dirname, 'static')));

  const server = app.listen(opts.port, () => {
    opts.log.info(`HTTP server listening on port ${opts.port}`);
  });

  return server;
}
