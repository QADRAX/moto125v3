import Link from "next/link";
import ResetConsentButton from "../googleAnalytics/ResetConsentButton";
import { NAV_LINKS } from "@/constants";

export default function FooterLinks() {
  return (
    <nav aria-label="Enlaces" className="sm:justify-self-center">
      <h2 className="text-sm font-semibold uppercase tracking-wide mb-3">
        Enlaces
      </h2>
      <ul className="space-y-2">
        {NAV_LINKS.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="hover:underline">
              {l.label}
            </Link>
          </li>
        ))}
        <li>
          <ResetConsentButton />
        </li>
      </ul>
    </nav>
  );
}
