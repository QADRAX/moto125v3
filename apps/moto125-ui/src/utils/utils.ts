export function mediaUrl(url?: string | null): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  const base = process.env.STRAPI_API_URL ?? "";
  return base ? `${base}${url}` : url;
}

export function toUpperCamelCase(input?: string | null): string {
  if (!input) return "";
  return input
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function slugify(input?: string | null): string {
  if (!input) return "";
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

export function isExternalUrl(url?: string | null): boolean {
  return !!url && /^https?:\/\//i.test(url);
}