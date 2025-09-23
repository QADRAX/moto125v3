"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function SearchNavItem() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const t = setTimeout(() => inputRef.current?.focus(), 0);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(t);
    };
  }, [open]);

  useEffect(() => {
    const onGlobalSlash = (e: KeyboardEvent) => {
      if (e.key !== "/") return;
      const el = document.activeElement;
      const tag = (el?.tagName || "").toLowerCase();
      const isEditable =
        tag === "input" || tag === "textarea" || (el as HTMLElement)?.isContentEditable;
      if (!isEditable) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onGlobalSlash);
    return () => window.removeEventListener("keydown", onGlobalSlash);
  }, []);

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const term = q.trim();
    setOpen(false);
    if (!term) return;
    const qs = new URLSearchParams({ q: term }).toString();
    router.push(`/buscar?${qs}`);
  };

  return (
    <li className="relative">
      <button
        type="button"
        className="px-3 py-1.5 hover:bg-black/5 transition inline-flex items-center gap-2"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="header-search-dialog"
        onClick={() => setOpen(true)}
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
        <span className="sr-only">Buscar</span>
      </button>

      {open && (
        <>
          <button
            className="fixed inset-0 z-[1000] bg-black/30"
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />
          <div
            id="header-search-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Buscar"
            className="
              fixed z-[1001] left-1/2 -translate-x-1/2
              top-6 w-[min(680px,92vw)]
              border border-[#e6e6e6] bg-white shadow-md rounded-lg
              p-3
            "
          >
            <form onSubmit={submit} className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="search"
                  name="q"
                  placeholder="Buscar artículos…"
                  autoComplete="off"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="
                    w-full rounded-md border border-[#e6e6e6]
                    px-3 py-2 pr-9 outline-none
                    focus:ring-2 focus:ring-[var(--color-primary)]
                  "
                  aria-label="Buscar"
                />
                {/* icono dentro del input (decorativo) */}
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
                  <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18">
                    <path
                      d="M11 4a7 7 0 015.657 11.313l3.515 3.515a1 1 0 01-1.414 1.414l-3.515-3.515A7 7 0 1111 4zm0 2a5 5 0 100 10 5 5 0 000-10z"
                      fill="currentColor"
                    />
                  </svg>
                </span>
              </div>

              <button
                type="submit"
                className="rounded-md border border-[#e6e6e6] px-3 py-2 hover:bg-black/5 transition"
                aria-label="Buscar"
              >
                Buscar
              </button>

              <button
                type="button"
                className="rounded-md border border-[#e6e6e6] px-3 py-2 hover:bg-black/5 transition"
                onClick={() => setOpen(false)}
                aria-label="Cerrar"
                title="Cerrar (Esc)"
              >
                Cerrar
              </button>
            </form>
          </div>
        </>
      )}
    </li>
  );
}
