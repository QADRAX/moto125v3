import crypto from "node:crypto";
import type { RequestHandler } from "express";

/** Constant-time string comparison to mitigate timing attacks. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

type Tracker = {
  fails: number;
  firstFailAt: number;
  lockUntil?: number;
};

const attempts = new Map<string, Tracker>();

/**
 * Basic Auth middleware with lockout after N failed attempts.
 * Returns 401 for normal unauthorized; returns 429 when locked (with Retry-After).
 * Keys the tracker by "ip|username" to avoid cross-impact between users on same IP.
 */
export function basicAuth(opts: {
  user: string;
  password: string;
  maxFails: number;
  lockoutSeconds: number;
  windowSeconds: number;
}): RequestHandler {
  const expected =
    "Basic " + Buffer.from(`${opts.user}:${opts.password}`).toString("base64");

  return (req, res, next) => {
    // Keep /health public
    if (req.path === "/health") return next();

    // Parse presented username (if present) to key attempts accurately
    const hdr =
      typeof req.headers["authorization"] === "string"
        ? req.headers["authorization"]
        : "";
    let presentedUser = "";
    if (hdr.startsWith("Basic ")) {
      try {
        const raw = Buffer.from(hdr.slice(6), "base64").toString("utf8");
        presentedUser = raw.split(":")[0] ?? "";
      } catch {
        /* ignore */
      }
    }
    const key = `${req.ip || req.socket.remoteAddress || "unknown"}|${presentedUser || "?"}`;

    const now = Date.now();
    const rec = attempts.get(key);

    // If locked, return 429 with Retry-After
    if (rec?.lockUntil && now < rec.lockUntil) {
      const secsLeft = Math.max(1, Math.ceil((rec.lockUntil - now) / 1000));
      res.setHeader("Retry-After", String(secsLeft));
      return res
        .status(429)
        .json({
          ok: false,
          error: `Too many attempts. Retry after ${secsLeft}s`,
        });
    }

    // No/invalid header -> count as fail
    if (!hdr || !safeEqual(hdr, expected)) {
      const windowMs = opts.windowSeconds * 1000;
      const lockMs = opts.lockoutSeconds * 1000;
      const nowRec: Tracker = rec ?? { fails: 0, firstFailAt: now };

      // Reset window if expired
      if (now - nowRec.firstFailAt > windowMs) {
        nowRec.fails = 0;
        nowRec.firstFailAt = now;
        nowRec.lockUntil = undefined;
      }

      nowRec.fails += 1;

      // Lock if threshold reached
      if (nowRec.fails >= opts.maxFails) {
        nowRec.lockUntil = now + lockMs;
        attempts.set(key, nowRec);
        res.setHeader("Retry-After", String(Math.ceil(lockMs / 1000)));
        return res
          .status(429)
          .json({ ok: false, error: "Too many attempts. Try again later." });
      }

      attempts.set(key, nowRec);
      res.setHeader("WWW-Authenticate", 'Basic realm="ContentOps"');
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    // Success -> clear tracker for this key
    attempts.delete(key);
    return next();
  };
}
