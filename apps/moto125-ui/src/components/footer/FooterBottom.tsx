import "server-only";
import packageJson from "../../../package.json";
import { GITHUB_REPO_URL } from "@/constants";

export default function FooterBottom({ siteName }: { siteName: string }) {
  const year = new Date().getFullYear();
  const version = packageJson.version;

  return (
    <div className="border-t border-neutral-200">
      <div className="mx-auto max-w-page px-4 sm:px-6 py-4 text-xs text-neutral-600 flex flex-wrap items-center justify-center gap-x-3">
        <span>
          © {year} {siteName}
        </span>
        <span aria-hidden="true">•</span>
        {GITHUB_REPO_URL ? (
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
            aria-label={`Abrir repositorio en GitHub v${version}`}
          >
            v{version}
          </a>
        ) : (
          <span>v{version}</span>
        )}
      </div>
    </div>
  );
}
