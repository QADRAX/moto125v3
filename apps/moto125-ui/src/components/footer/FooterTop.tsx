import Link from "next/link";

export default function FooterTop({
  siteName,
  siteDescription,
  logoUrl,
  logoAlt,
}: {
  siteName: string;
  siteDescription?: string | null;
  logoUrl?: string | null;
  logoAlt: string;
}) {
  return (
    <section>
      <h2 className="sr-only">Sobre el sitio</h2>

      <Link href="/" aria-label={siteName} className="inline-flex items-center">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={logoAlt}
            className="h-12 sm:h-14 w-auto"
            loading="lazy"
          />
        ) : (
          <span className="text-xl font-heading font-semibold">{siteName}</span>
        )}
      </Link>

      {siteDescription && (
        <p
          className="mt-3 text-sm text-neutral-600 max-w-prose"
          itemProp="description"
        >
          {siteDescription}
        </p>
      )}
    </section>
  );
}
