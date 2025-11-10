export const PAGE_SIZE = 12;

export const COOKIES_CONSENT_DENY_TTL_HOURS = 24;
export const COOKIES_CONSENT_GRANT_TTL_DAYS = 180;

export const NAV_LINKS = [
  { label: "Sobre nosotros", href: "/sobre-nosotros" },
  { label: "Política de privacidad", href: "/politica-de-privacidad" },
  { label: "Política de cookies", href: "/politica-de-cookies" },
  { label: "Aviso legal", href: "/aviso-legal" },
] as const;

export const SOCIAL_LINKS = {
  youtube: "https://www.youtube.com/@Moto125ccTV",
  github: undefined,
  facebook: undefined,
} as const;

export const GITHUB_REPO_URL = "https://github.com/QADRAX/moto125v3";