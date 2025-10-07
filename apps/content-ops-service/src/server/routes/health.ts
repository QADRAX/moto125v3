import type { Express } from "express";
import { ROUTES, type HealthResponse } from "@moto125/content-ops-shared";

export function mountHealthRoute(app: Express) {
  app.get(ROUTES.HEALTH, (_req, res) => {
    const payload: HealthResponse = { ok: true, ts: new Date().toISOString() };
    res.json(payload);
  });
}
