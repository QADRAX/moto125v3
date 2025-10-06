import crypto from "node:crypto";
import type { RequestHandler } from "express";

/**
 * Constant-time string comparison to mitigate timing attacks.
 */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

/**
 * Basic Auth middleware. Protects routes by requiring Authorization: Basic ...
 * Excludes /health by design (mount conditionally in server).
 */
export function basicAuth(opts: {
  user: string;
  password: string;
}): RequestHandler {
  const expected =
    "Basic " + Buffer.from(`${opts.user}:${opts.password}`).toString("base64");

  return (req, res, next) => {
    // Allow health checks unauthenticated if upstream mounted globally.
    if (req.path === "/health") return next();

    const hdr = req.headers["authorization"];
    if (!hdr || typeof hdr !== "string") {
      res.setHeader("WWW-Authenticate", 'Basic realm="ContentOps"');
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    // Compare in constant time
    if (!safeEqual(hdr, expected)) {
      res.setHeader("WWW-Authenticate", 'Basic realm="ContentOps"');
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    return next();
  };
}
