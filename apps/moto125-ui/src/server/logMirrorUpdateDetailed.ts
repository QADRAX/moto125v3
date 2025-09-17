import type { MirrorRootState } from "@moto125/data-mirror-core";

/**
 * Produces a human-readable relative time like "2m ago" or "just now".
 */
function formatRelativeTime(iso: string | undefined): string {
  if (!iso) return "-";
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffMs = Math.max(0, now - then);

  const sec = Math.floor(diffMs / 1000);
  if (sec < 5) return "just now";
  if (sec < 60) return `${sec}s ago`;

  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;

  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;

  const years = Math.floor(months / 12);
  return `${years}y ago`;
}

/**
 * Human-friendly bytes formatter (e.g., "1.23 MB").
 */
function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(val >= 100 ? 0 : val >= 10 ? 1 : 2)} ${units[i]}`;
}

/**
 * Roughly estimates the serialized size of the state in bytes.
 * Uses JSON serialization for portability (works in Node y browser).
 */
function estimateStateSizeBytes(state: unknown): number {
  try {
    // JSON length is not perfect but good enough for logging purposes.
    const json = JSON.stringify(state);
    // JS string is UTF-16; to approximate UTF-8 bytes, re-encode:
    // (fast-path) if Buffer exists (Node), use it; else fallback
    // to a naive 1~3 bytes per char estimate via TextEncoder when available.
    if (typeof Buffer !== "undefined") {
      return Buffer.byteLength(json, "utf8");
    }
    if (typeof TextEncoder !== "undefined") {
      return new TextEncoder().encode(json).length;
    }
    // Fallback: character count as a coarse estimate
    return json.length;
  } catch {
    return 0;
  }
}

/**
 * Logs a detailed, humanized table for each DataMirror update.
 *
 * @param state Current MirrorRootState (can be null on first mount/reset)
 * @param label Optional label to prefix the log group
 */
export function logMirrorUpdateDetailed(
  state: MirrorRootState,
  label = "DataMirror"
): void {
  if (!state) {
    // keep the same vibe as your current log when state is null
    // but a bit more explicit
    // eslint-disable-next-line no-console
    console.log(`[${label}] onUpdate: state=null`);
    return;
  }

  const { data, timings, version, generatedAt } = state;

  const counts = {
    articles: data?.articles?.length ?? 0,
    motos: data?.motos?.length ?? 0,
    companies: data?.companies?.length ?? 0,
    articleTypes: data?.taxonomies?.articleTypes?.length ?? 0,
    motoTypes: data?.taxonomies?.motoTypes?.length ?? 0,
    motoClasses: data?.taxonomies?.motoClasses?.length ?? 0,
  };

  // Prefer the precise hydrate end time, otherwise fallback to generatedAt
  const lastContentUpdateISO = timings?.hydrate?.endedAt ?? generatedAt;
  const lastContentUpdateRel = formatRelativeTime(lastContentUpdateISO);

  const sizeBytes = estimateStateSizeBytes(state);
  const prettySize = formatBytes(sizeBytes);

  // Build summary line for collapsed group
  const summary =
    `size=${prettySize} • articles=${counts.articles} ` +
    `motos=${counts.motos} companies=${counts.companies} • ` +
    `updated=${lastContentUpdateRel}`;

  // eslint-disable-next-line no-console
  console.groupCollapsed(`[${label}] onUpdate: ${summary}`);

  // Overview table
  const overview = {
    version: version ?? "-",
    generatedAt,
    lastContentUpdate: lastContentUpdateISO ?? "-",
    lastContentUpdateRel,
    sizeBytes,
    sizeHuman: prettySize,
  };
  // eslint-disable-next-line no-console
  console.table(overview);

  // Counts table
  const countsRow = {
    ...counts,
    page_home: !!data?.pages?.home,
    page_ofertas: !!data?.pages?.ofertas,
    page_aboutUs: !!data?.pages?.aboutUs,
    has_config: !!data?.config,
  };
  // eslint-disable-next-line no-console
  console.table(countsRow);

  // Timings (if present) in their own table
  if (timings) {
    const hydrateMs = timings.hydrate?.totalMs ?? undefined;
    const snapshotSaveMs = timings.snapshotSaveMs ?? undefined;

    const timingRow = {
      hydrate_startedAt: timings.hydrate?.startedAt ?? "-",
      hydrate_endedAt: timings.hydrate?.endedAt ?? "-",
      hydrate_totalMs: hydrateMs ?? "-",
      snapshotSaveMs: snapshotSaveMs ?? "-",
      // flatten bySource if present
      ...Object.fromEntries(
        Object.entries(timings.hydrate?.bySource ?? {}).map(([k, v]) => [
          `bySource.${k}`,
          v,
        ])
      ),
    };
    // eslint-disable-next-line no-console
    console.table(timingRow);
  }

  // eslint-disable-next-line no-console
  console.groupEnd();
}
