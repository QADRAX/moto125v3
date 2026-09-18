import { createHash } from "node:crypto";

/** JSON estable: ordena claves de objetos de forma recursiva. */
export function stableStringify(value: unknown): string {
  return JSON.stringify(normalize(value));
}

function normalize(value: unknown): unknown {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(normalize);
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  const out: Record<string, unknown> = {};
  for (const k of keys) {
    out[k] = normalize(obj[k]);
  }
  return out;
}

/**
 * Clave de caché: `namespace.method:` + hash de args.
 * Ej.: `articles.list:a1b2c3…`
 */
export function cacheKey(
  namespace: string,
  method: string,
  args: unknown[]
): string {
  const hash = createHash("sha256")
    .update(stableStringify(args))
    .digest("hex")
    .slice(0, 24);
  return `${namespace}.${method}:${hash}`;
}

/** Prefijo de invalidación para un namespace (incluye el punto final). */
export function namespacePrefix(namespace: string): string {
  return `${namespace}.`;
}
