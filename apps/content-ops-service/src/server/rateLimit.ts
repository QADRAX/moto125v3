import type { RequestHandler } from "express";

export interface RateLimitOptions {
  /** Máximo de solicitudes permitidas por IP dentro de la ventana. */
  capacity: number;
  /** Duración de la ventana (segundos). */
  windowSeconds: number;
  /** Máximo de claves IP a rastrear en memoria. */
  maxTrackedKeys: number;
  /** Intervalo (segundos) entre tareas de poda (purga) del mapa en memoria. */
  pruneIntervalSeconds: number;
}

/**
 * Rate limiter global por IP (ventana fija) con poda y límite de memoria.
 * No define valores por defecto: pásalos desde config.ts.
 */
export function rateLimit(opts: RateLimitOptions): RequestHandler {
  const capacity = opts.capacity;
  const windowMs = opts.windowSeconds * 1000;
  const maxTracked = opts.maxTrackedKeys;
  const pruneEveryMs = opts.pruneIntervalSeconds * 1000;

  type Rec = { count: number; resetAt: number; lastSeenAt: number };
  const store = new Map<string, Rec>();
  let lastPrune = 0;

  function prune(now: number) {
    // Purga por expiración de ventana
    for (const [key, rec] of store) {
      if (rec.resetAt <= now) store.delete(key);
    }
    // Cap de memoria (LRU-like por lastSeenAt)
    if (store.size > maxTracked) {
      const entries = [...store.entries()];
      entries.sort((a, b) => a[1].lastSeenAt - b[1].lastSeenAt);
      const toDrop = store.size - maxTracked;
      for (let i = 0; i < toDrop; i++) store.delete(entries[i][0]);
    }
  }

  return (req, res, next) => {
    const now = Date.now();
    if (now - lastPrune >= pruneEveryMs) {
      prune(now);
      lastPrune = now;
    }

    const ip = req.ip || req.socket.remoteAddress || "unknown";
    let rec = store.get(ip);

    if (!rec || rec.resetAt <= now) {
      rec = { count: 1, resetAt: now + windowMs, lastSeenAt: now };
      store.set(ip, rec);
      res.setHeader("X-RateLimit-Limit", String(capacity));
      res.setHeader(
        "X-RateLimit-Remaining",
        String(Math.max(0, capacity - rec.count))
      );
      return next();
    }

    rec.count += 1;
    rec.lastSeenAt = now;

    if (rec.count > capacity) {
      const retryAfter = Math.max(1, Math.ceil((rec.resetAt - now) / 1000));
      res.setHeader("Retry-After", String(retryAfter));
      res.setHeader("X-RateLimit-Limit", String(capacity));
      res.setHeader("X-RateLimit-Remaining", "0");
      return res.status(429).json({
        ok: false,
        error: "Too Many Requests",
        message: `Rate limit exceeded. Retry after ${retryAfter}s`,
      });
    }

    res.setHeader("X-RateLimit-Limit", String(capacity));
    res.setHeader(
      "X-RateLimit-Remaining",
      String(Math.max(0, capacity - rec.count))
    );
    return next();
  };
}
