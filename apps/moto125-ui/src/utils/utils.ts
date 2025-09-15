import { Article } from "@moto125/api-client";

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

export function resolveArticleHref(a: Article): string {
  const slug = a.slug ?? String(a.documentId ?? a.id ?? "");
  return `/articulos/${slug}`;
}

export function getImage(a: Article) {
  const c = a.coverImage ?? undefined;
  const url = mediaUrl(c?.url) ?? null;
  return {
    url,
    alt: c?.alternativeText ?? a.title ?? "Artículo",
    width: c?.width ?? undefined,
    height: c?.height ?? undefined,
  };
}

export function formatDate(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}
