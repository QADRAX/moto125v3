/**
 * Normalize any YouTube input (ID, youtu.be, /watch, /embed, /shorts, /live)
 * into canonical watch and embed URLs. Preserves time parameter.
 */

export type NormalizedYouTube = {
  id: string | null;
  /** Seconds from start, if provided via t/start */
  start?: number;
  /** Playlist ID if provided (best-effort) */
  list?: string;
  /** Share param 'si' (optional, pass-through for watch links if you want) */
  si?: string;
  /** Canonical https://www.youtube.com/watch?... */
  watchUrl: string | null;
  /** https://www.youtube(-nocookie).com/embed/... */
  embedUrl: string | null;
};

type NormalizeOptions = {
  /** Use privacy enhanced domain for embed (youtube-nocookie.com). Default: false */
  privacyEnhanced?: boolean;
  /** Preserve the 'si' share parameter in the watch link. Default: true */
  preserveSiInWatch?: boolean;
};

function parseTimeToSeconds(v?: string | null): number | undefined {
  if (!v) return undefined;
  // Accept "90", "90s", "1m30s", "1h2m3s"
  const num = Number(v);
  if (!Number.isNaN(num)) return Math.max(0, Math.floor(num));
  const m = v.match(
    /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/i
  );
  if (!m) return undefined;
  const h = m[1] ? parseInt(m[1], 10) : 0;
  const mnt = m[2] ? parseInt(m[2], 10) : 0;
  const s = m[3] ? parseInt(m[3], 10) : 0;
  return h * 3600 + mnt * 60 + s;
}

/** Extract video id, playlist id, start seconds and 'si' if present */
function extractIdAndParams(input: string): { id: string | null; list?: string; start?: number; si?: string } {
  // Plain ID (no slash, no query)
  if (!input.includes("/") && !input.includes("?")) {
    return { id: input.trim() };
  }

  try {
    const url = new URL(input);
    const host = url.hostname;
    const path = url.pathname;
    const search = url.searchParams;

    let id: string | null = null;
    let list = search.get("list") || undefined;
    const si = search.get("si") || undefined;

    // time: YouTube uses 't' on watch and 'start' on embed. Normalize to seconds.
    const t = search.get("t");
    const startParam = search.get("start");
    const start = parseTimeToSeconds(t ?? startParam ?? undefined);

    if (host.includes("youtu.be")) {
      id = path.replace("/", "") || null;
      return { id, list, start, si };
    }

    if (host.includes("youtube.com") || host.includes("youtube-nocookie.com")) {
      const parts = path.split("/").filter(Boolean);
      // /watch?v=<id>
      if (path === "/watch") {
        id = search.get("v");
        return { id, list, start, si };
      }
      // /embed/<id>  |  /shorts/<id>  |  /live/<id>  |  /v/<id> (legacy)
      if (parts.length >= 2 && ["embed", "shorts", "live", "v"].includes(parts[0])) {
        id = parts[1] || null;
        return { id, list, start, si };
      }
    }
  } catch {
    // fallthrough
  }

  // Fallback: treat as plain ID
  return { id: input?.trim() || null };
}

function buildWatchUrl(id: string | null, opts: { start?: number; list?: string; si?: string; preserveSi: boolean }): string | null {
  if (!id) return null;
  const params: string[] = [`v=${encodeURIComponent(id)}`];
  if (opts.start && opts.start > 0) params.push(`t=${opts.start}s`);
  if (opts.list) params.push(`list=${encodeURIComponent(opts.list)}`);
  if (opts.preserveSi && opts.si) params.push(`si=${encodeURIComponent(opts.si)}`);
  return `https://www.youtube.com/watch?${params.join("&")}`;
}

function buildEmbedUrl(id: string | null, opts: { start?: number; list?: string; privacyEnhanced: boolean }): string | null {
  const base = opts.privacyEnhanced ? "https://www.youtube-nocookie.com" : "https://www.youtube.com";
  if (opts.list && !id) {
    // Playlist embed without specific video
    return `${base}/embed/videoseries?list=${encodeURIComponent(opts.list)}`;
  }
  if (!id) return null;
  const params: string[] = [];
  if (opts.start && opts.start > 0) params.push(`start=${opts.start}`);
  if (opts.list) params.push(`list=${encodeURIComponent(opts.list)}`);
  return `${base}/embed/${encodeURIComponent(id)}${params.length ? `?${params.join("&")}` : ""}`;
}

/**
 * Normalize any YouTube input into canonical watch and embed URLs.
 */
export function normalizeYouTube(
  input: string,
  { privacyEnhanced = false, preserveSiInWatch = true }: NormalizeOptions = {}
): NormalizedYouTube {
  const { id, list, start, si } = extractIdAndParams(input);
  const watchUrl = buildWatchUrl(id, { start, list, si, preserveSi: preserveSiInWatch });
  const embedUrl = buildEmbedUrl(id, { start, list, privacyEnhanced });
  return { id, start, list, si, watchUrl, embedUrl };
}
