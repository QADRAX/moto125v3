import crypto from "node:crypto";
import type { RequestHandler } from "express";

export interface BasicAuthOptions {
  /** Usuario esperado. */
  user: string;
  /** Password esperado. */
  password: string;
  /** Fallos permitidos dentro de la ventana antes del bloqueo. */
  maxFails: number;
  /** Duración del bloqueo (segundos). */
  lockoutSeconds: number;
  /** Duración de la ventana de contabilización de fallos (segundos). */
  windowSeconds: number;
  /** Máximo de claves (IP) a rastrear en memoria. */
  maxTrackedKeys: number;
  /** Intervalo (segundos) entre tareas de poda (purga) del mapa en memoria. */
  pruneIntervalSeconds: number;
}

/** Comparación en tiempo constante para evitar filtrado por timing. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

/**
 * Middleware de Basic Auth con lockout y límites de memoria.
 * No tiene defaults; pásalo todo desde config.ts.
 * Nota: este middleware NO excluye rutas (p. ej., /health). Monta antes de él
 * las rutas públicas si quieres que queden sin proteger.
 */
export function basicAuth(opts: BasicAuthOptions): RequestHandler {
  const expectedHeader =
    "Basic " + Buffer.from(`${opts.user}:${opts.password}`).toString("base64");
  const windowMs = opts.windowSeconds * 1000;
  const lockMs = opts.lockoutSeconds * 1000;
  const ttlMs = windowMs + lockMs; // vida máxima de un registro sin actividad
  const maxTracked = opts.maxTrackedKeys;
  const pruneEveryMs = opts.pruneIntervalSeconds * 1000;

  type Rec = {
    fails: number;
    firstFailAt: number;
    lastSeenAt: number;
    lockedUntil?: number;
  };

  const store = new Map<string, Rec>(); // key = IP
  let lastPrune = 0;

  function prune(now: number) {
    // TTL: si pasó la ventana+lock desde el último evento relevante, eliminar
    for (const [key, rec] of store) {
      const ref =
        rec.lockedUntil !== undefined ? rec.lockedUntil : rec.firstFailAt;
      if (ref + ttlMs <= now) store.delete(key);
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

    const hdr =
      typeof req.headers.authorization === "string"
        ? req.headers.authorization
        : "";
    const ok = safeEqual(hdr, expectedHeader);

    // ¿bloqueado?
    if (rec && rec.lockedUntil !== undefined && rec.lockedUntil > now) {
      const wait = Math.ceil((rec.lockedUntil - now) / 1000);
      res.setHeader("Retry-After", String(wait));
      return res
        .status(429)
        .json({ ok: false, error: "Locked", message: `Try again in ${wait}s` });
    }

    if (ok) {
      if (rec) store.delete(ip); // reset al éxito
      return next();
    }

    // No autorizado → contabilizar fallo
    if (!rec || now - rec.firstFailAt > windowMs) {
      rec = {
        fails: 1,
        firstFailAt: now,
        lastSeenAt: now,
        lockedUntil: undefined,
      };
    } else {
      rec.fails += 1;
      rec.lastSeenAt = now;
    }

    if (rec.fails >= opts.maxFails) {
      rec.lockedUntil = now + lockMs;
      rec.fails = 0; // reset tras bloquear
      store.set(ip, rec);
      res.setHeader("Retry-After", String(opts.lockoutSeconds));
      return res
        .status(429)
        .json({
          ok: false,
          error: "Locked",
          message: `Locked for ${opts.lockoutSeconds}s`,
        });
    }

    store.set(ip, rec);
    res.setHeader("WWW-Authenticate", 'Basic realm="Restricted Area"');
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  };
}
