import { ContentCacheError } from "./types";
import * as v8 from "v8";

export function getHttpStatus(e: unknown): number | undefined {
  if (!e || typeof e !== "object") return undefined;
  const any = e as any;
  return any.status ?? any.detail?.status ?? any.response?.status;
}

export function toMirrorError(
  source: ContentCacheError["source"],
  err: unknown
): ContentCacheError {
  const status = getHttpStatus(err);
  let code: ContentCacheError["code"] = "UNKNOWN";
  if (typeof status === "number") {
    if (status === 404) code = "HTTP_404";
    else if (status >= 500) code = "HTTP_5XX";
    else if (status >= 400) code = "HTTP_4XX";
  }
  const message =
    (err as any)?.message ??
    (typeof err === "string" ? err : "Unexpected error");

  return {
    time: new Date().toISOString(),
    source,
    code,
    status,
    message,
    detail: (err as any)?.detail ?? undefined,
  };
}

export async function timed<T>(
  label: string,
  fn: () => Promise<T>,
  into: Record<string, number>
): Promise<T> {
  const t0 = performance.now();
  try {
    return await fn();
  } finally {
    into[label] = performance.now() - t0;
  }
}

export function toBuffer(obj: unknown): ArrayBuffer {
  const buf: Buffer = v8.serialize(obj);
  return buf.buffer.slice(
    buf.byteOffset,
    buf.byteOffset + buf.byteLength
  ) as ArrayBuffer;
}

export function deserialize<T>(ab: ArrayBuffer): T {
  const buf = Buffer.from(new Uint8Array(ab));
  return v8.deserialize(buf) as T;
}

export function serializeToAB(state: unknown): ArrayBuffer {
  const buf: Buffer = v8.serialize(state);
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}