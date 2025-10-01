export const VIEWED_TZ = "Europe/Madrid" as const;
export const VIEWED_COOKIE_PREFIX = "va-" as const;
export const MAX_IDS_PER_DAY = 60 as const;

export function yyyymmddInTz(tz: string = VIEWED_TZ, d: Date = new Date()): string {
  const iso = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
  return iso.replaceAll("-", "");
}

export function viewedCookieNameToday(tz: string = VIEWED_TZ, d: Date = new Date()): string {
  return `${VIEWED_COOKIE_PREFIX}${yyyymmddInTz(tz, d)}`;
}

export function parseSlugCsv(value: string | undefined | null): Set<string> {
  if (!value) return new Set();
  return new Set(value.split(",").map((s) => s.trim()).filter(Boolean));
}

export function serializeSlugCsv(ids: Iterable<string>, max = MAX_IDS_PER_DAY): string {
  const arr = Array.from(new Set(ids));
  const tail = arr.slice(-max);
  return tail.join(",");
}

export function conservativeMaxAgeSeconds(): number {
  return 26 * 60 * 60; // 26h
}
