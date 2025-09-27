"use client";

export default function ResetConsentButton({
  cookieName = "m125-consent",
  label = "Restablecer preferencias de cookies",
}: {
  cookieName?: string;
  label?: string;
}) {
  function deleteCookieAllWays(name: string) {
    const opts = [
      "",
      `; Domain=${location.hostname}`,
      location.hostname.startsWith(".") ? "" : `; Domain=.${location.hostname}`,
    ];
    const base = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;

    opts.forEach((domain) => {
      document.cookie = `${base}${domain}`;
      document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${domain}`;
    });

    try { sessionStorage.removeItem("m125-consent-soft"); } catch {}
  }

  function onClick() {
    deleteCookieAllWays(cookieName);
    location.reload();
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="p-0 bg-transparent border-0 text-left hover:underline"
      aria-label="Restablecer preferencias de cookies"
    >
      {label}
    </button>
  );
}
