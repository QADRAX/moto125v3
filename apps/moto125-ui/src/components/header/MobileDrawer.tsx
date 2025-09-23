"use client";

import { useEffect } from "react";
import Link from "next/link";
import type { MenuLink } from "./navModel";
import Portal from "./Portal";

type Props = {
  open: boolean;
  onClose: () => void;
  siteName: string;
  logoUrl: string | null;
  nav: Array<{
    key: string;
    label: string;
    href?: string;
    children?: MenuLink[];
  }>;
};

export default function MobileDrawer({
  open,
  onClose,
  siteName,
  logoUrl,
  nav,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  return (
    <Portal>
      {open && (
        <button
          className="md:hidden fixed inset-0 z-[990] bg-black/30 animate-in fade-in-50"
          aria-hidden="true"
          onClick={onClose}
        />
      )}

      <aside
        id="mobile-drawer"
        className={`md:hidden fixed z-[1000] inset-y-0 left-0 w-72 max-w-[85%]
                    bg-white border-r border-[#e6e6e6] shadow-md flex flex-col
                    ${open ? "animate-in slide-in-from-left duration-200" : "hidden"}`}
        role="dialog"
        aria-modal="true"
        aria-label="Menú principal"
      >
        <div className="h-12 flex items-center justify-between px-3 border-b border-[#e6e6e6]">
          {/* Logo en lugar de texto */}
          <Link
            href="/"
            className="inline-flex items-center gap-2"
            aria-label={siteName}
            onClick={onClose}
          >
            {logoUrl ? (
              <img src={logoUrl} alt={siteName} className="h-7 w-auto" />
            ) : (
              <span className="font-heading text-lg font-semibold">
                {siteName}
              </span>
            )}
          </Link>

          <button
            type="button"
            className="w-10 h-10 border border-[#e6e6e6] bg-white hover:bg-black/5 transition"
            aria-label="Cerrar menú"
            onClick={onClose}
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

        <nav className="p-2 overflow-y-auto scrollbar">
          <ul className="space-y-1">
            <li>
              <Link
                href="/buscar"
                className="flex items-center gap-2 px-3 py-2 hover:bg-black/5 transition"
                onClick={onClose}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  className="shrink-0"
                >
                  <path
                    d="M11 4a7 7 0 015.657 11.313l3.515 3.515a1 1 0 01-1.414 1.414l-3.515-3.515A7 7 0 1111 4zm0 2a5 5 0 100 10 5 5 0 000-10z"
                    fill="currentColor"
                  />
                </svg>
                <span>Buscar</span>
              </Link>
            </li>
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
                          onClick={onClose}
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
                    onClick={onClose}
                  >
                    {item.label}
                  </Link>
                </li>
              )
            )}
          </ul>
        </nav>
      </aside>
    </Portal>
  );
}
