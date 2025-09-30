"use client";

import { useEffect, useRef } from "react";
import { useConsentDialog } from "./useConsentDialog";

export default function ConsentDialog({
  gaId,
  cookieName = "m125-consent",
  denyTtlHours = 12,
  grantTtlDays = 180,
  logoSrc,
  brandName = "moto125.cc",
  privacyHref,
}: {
  gaId: string;
  cookieName?: string;
  denyTtlHours?: number;
  grantTtlDays?: number;
  logoSrc?: string;
  brandName?: string;
  privacyHref?: string;
}) {
  const { open, setOpen, acceptAnalytics, acceptAll, denyAll } = useConsentDialog({
    gaId,
    cookieName,
    denyTtlHours,
    grantTtlDays,
  });

  const panelRef = useRef<HTMLDivElement>(null);

  // Close with ESC -> deny
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") denyAll();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, denyAll]);

  // Backdrop click -> deny
  function onBackdropMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) denyAll();
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/55 px-4"
      onMouseDown={onBackdropMouseDown}
    >
      <div
        ref={panelRef}
        className="w-full max-w-[720px] rounded-2xl bg-white shadow-2xl ring-1 ring-black/10 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-6 pt-6">
          {logoSrc ? (
            <img
              src={logoSrc}
              alt={brandName}
              className="h-9 w-auto rounded-md bg-white"
              loading="eager"
            />
          ) : (
            <span className="text-lg font-semibold">{brandName}</span>
          )}

          <div className="ml-auto">
            {/* Close (deny) */}
            <button
              aria-label="Cerrar y continuar sin aceptar"
              onClick={denyAll}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 pb-6">
          <h2 id="consent-title" className="mt-2 text-2xl font-semibold">
            ¿Nos ayudas a mejorar {brandName}?
          </h2>

          <p className="mt-2 text-sm text-gray-700 leading-relaxed">
            Usamos cookies para medir el uso del sitio y, opcionalmente, para publicidad.
            Sin tu permiso, no activamos analítica ni publicidad. Puedes cambiar tu elección en
            cualquier momento desde “Preferencias de cookies” en el pie de página.
          </p>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-gray-200 p-4">
              <h3 className="font-medium">Necesarias</h3>
              <p className="mt-1 text-xs text-gray-600">
                Esenciales para el funcionamiento básico. No se usan con fines publicitarios.
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 p-4">
              <h3 className="font-medium">Analítica (GA4)</h3>
              <p className="mt-1 text-xs text-gray-600">
                Nos ayuda a entender qué contenidos funcionan mejor para seguir mejorando.
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 p-4">
              <h3 className="font-medium">Publicidad</h3>
              <p className="mt-1 text-xs text-gray-600">
                Personalización de anuncios y medición de campañas (opcional).
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={denyAll}
              className="rounded-lg px-4 py-2 text-white bg-gray-900 hover:opacity-90"
            >
              Continuar sin aceptar
            </button>
            <button
              onClick={acceptAnalytics}
              className="rounded-lg px-4 py-2 border border-gray-300 hover:bg-gray-50"
            >
              Solo analítica
            </button>
            <button
              onClick={acceptAll}
              className="rounded-lg px-4 py-2 text-white bg-[#F39C12] hover:opacity-90"
            >
              Aceptar todo
            </button>
          </div>

          <p className="mt-4 text-xs text-gray-500">
            Más información en nuestra{" "}
            <a
              href={privacyHref}
              className="underline decoration-[#F39C12] underline-offset-2 hover:opacity-90"
            >
              Política de privacidad
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
