import Link from "next/link";
import { isExternalUrl } from "@/utils/utils";
import { SOCIAL_LINKS } from "@/constants";
import { YouTubeIcon } from "../common/icons/YoutubeIcon";
import GithubIcon from "../common/icons/GithubIcon";
import FacebookIcon from "../common/icons/FacebookIcon";

export default function FooterSocial({
  siteName,
  heroImg,
  heroTitle,
  heroLink,
}: {
  siteName: string;
  heroImg?: string | null;
  heroTitle?: string | null;
  heroLink?: string | null;
}) {
  const { youtube, github, facebook } = SOCIAL_LINKS;

  return (
    <section className="lg:justify-self-end">
      <h2 className="text-sm font-semibold uppercase tracking-wide mb-3">
        Síguenos
      </h2>

      <ul className="space-y-2">
        {youtube && (
          <li>
            <a
              href={youtube}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 hover:underline"
              aria-label="Visitar nuestro canal de YouTube"
            >
              <YouTubeIcon className="w-5 h-5" />
              <span>YouTube</span>
            </a>
          </li>
        )}

        {github && (
          <li>
            <a
              href={github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 hover:underline"
              aria-label="Visitar nuestro repositorio en GitHub"
            >
              <GithubIcon className="w-5 h-5" />
              <span>GitHub</span>
            </a>
          </li>
        )}

        {facebook && (
          <li>
            <a
              href={facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 hover:underline"
              aria-label="Visitar nuestra página en Facebook"
            >
              <FacebookIcon className="w-5 h-5" />
              <span>Facebook</span>
            </a>
          </li>
        )}
      </ul>

      {heroImg && (
        <div className="mt-5">
          {heroLink ? (
            isExternalUrl(heroLink) ? (
              <a
                href={heroLink}
                title={heroTitle ?? siteName}
                aria-label={heroTitle ?? siteName}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block"
              >
                <img
                  src={heroImg}
                  alt={heroTitle ?? siteName}
                  title={heroTitle ?? siteName}
                  className="h-24 sm:h-28 w-auto object-contain rounded-lg border border-neutral-200 p-2 shadow-sm"
                  loading="lazy"
                />
              </a>
            ) : (
              <Link
                href={heroLink}
                title={heroTitle ?? siteName}
                aria-label={heroTitle ?? siteName}
                className="inline-block"
              >
                <img
                  src={heroImg}
                  alt={heroTitle ?? siteName}
                  title={heroTitle ?? siteName}
                  className="h-24 sm:h-28 w-auto object-contain rounded-lg border border-neutral-200 p-2 shadow-sm"
                  loading="lazy"
                />
              </Link>
            )
          ) : (
            <img
              src={heroImg}
              alt={heroTitle ?? siteName}
              title={heroTitle ?? siteName}
              className="h-24 sm:h-28 w-auto object-contain rounded-lg border border-neutral-200 p-2 shadow-sm"
              loading="lazy"
            />
          )}
        </div>
      )}
    </section>
  );
}
