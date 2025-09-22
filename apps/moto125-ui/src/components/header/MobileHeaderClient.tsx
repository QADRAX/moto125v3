"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ArticleType } from "@moto125/api-client";
import { buildNav } from "./navModel";
import MobileDrawer from "./MobileDrawer";

type Props = {
  siteName: string;
  logoUrl: string | null;
  types: ArticleType[];
};

export default function MobileHeaderClient({
  siteName,
  logoUrl,
  types,
}: Props) {
  const [open, setOpen] = useState(false);
  const nav = buildNav(types);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <>
      <div className="h-12 px-3 flex items-center justify-between bg-white">
        <Link
          href="/"
          className="inline-flex items-center gap-2"
          aria-label={siteName}
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={siteName}
              className="h-7 w-auto"
              loading="eager"
            />
          ) : (
            <span className="text-lg font-heading font-semibold">
              {siteName}
            </span>
          )}
        </Link>

        <button
          type="button"
          className="inline-flex items-center justify-center w-10 h-10 bg-white hover:bg-black/5 transition"
          aria-label="Abrir menú"
          aria-controls="mobile-drawer"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M4 7h16M4 12h16M4 17h16"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </button>
      </div>

      <MobileDrawer
        open={open}
        onClose={() => setOpen(false)}
        siteName={siteName}
        logoUrl={logoUrl}
        nav={nav}
      />
    </>
  );
}
