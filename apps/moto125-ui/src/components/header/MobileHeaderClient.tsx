"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ArticleType } from "@moto125/api-client";
import { buildNav } from "./navModel";

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
      {/* Top bar móvil */}
      <div className="h-12 px-3 flex items-center justify-between bg-white border-b-3 border-primary">
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
          className="inline-flex items-center justify-center w-10 h-10 border border-[#e6e6e6] bg-white hover:bg-black/5 transition"
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

      {/* Overlay */}
      {open && (
        <button
          className="md:hidden fixed inset-0 z-[60] bg-black/30 animate-in fade-in-50"
          aria-hidden="true"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <aside
        id="mobile-drawer"
        className={`md:hidden fixed z-[70] inset-y-0 left-0 w-72 max-w-[85%]
                    bg-white border-r border-[#e6e6e6] shadow-md flex flex-col
                    ${open ? "animate-in slide-in-from-left duration-200" : "hidden"}`}
        role="dialog"
        aria-modal="true"
        aria-label="Menú principal"
      >
        <div className="h-12 flex items-center justify-between px-3 border-b border-[#e6e6e6]">
          <span className="font-heading text-lg font-semibold">{siteName}</span>
          <button
            type="button"
            className="w-10 h-10 border border-[#e6e6e6] bg-white hover:bg-black/5 transition"
            aria-label="Cerrar menú"
            onClick={() => setOpen(false)}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="mx-auto"
            >
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </button>
        </div>

        {/* Navegación móvil (misma estructura que desktop) */}
        <nav className="p-2 overflow-y-auto scrollbar">
          <ul className="space-y-1">
            {nav.map((item) =>
              item.children?.length ? (
                <li key={item.key}>
                  <div className="pt-2 pb-1 px-3 text-xs font-semibold uppercase tracking-wide text-[#666]">
                    {item.label}
                  </div>
                  <ul>
                    {item.children.map((c) => (
                      <li key={c.key}>
                        <Link
                          href={c.href}
                          className="block px-3 py-2 hover:bg-black/5 transition"
                          onClick={() => setOpen(false)}
                        >
                          {c.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              ) : (
                <li key={item.key}>
                  <Link
                    href={item.href!}
                    className="block px-3 py-2 hover:bg-black/5 transition"
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </Link>
                </li>
              )
            )}
          </ul>
        </nav>
      </aside>
    </>
  );
}
