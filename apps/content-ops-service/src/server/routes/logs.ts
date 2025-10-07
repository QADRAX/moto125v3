import type { Express } from "express";
import { ROUTES } from "@moto125/content-ops-shared";
import type { LogBus } from "../../logging/LogBus";

export function mountLogsRoute(app: Express, bus: LogBus) {
  app.get(ROUTES.LOGS_STREAM, (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    for (const e of bus.snapshot()) res.write(`data: ${JSON.stringify(e)}\n\n`);
    const unsub = bus.subscribe((e) =>
      res.write(`data: ${JSON.stringify(e)}\n\n`)
    );
    req.on("close", () => {
      unsub();
      res.end();
    });
  });
}
