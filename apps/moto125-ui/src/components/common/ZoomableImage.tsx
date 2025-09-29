"use client";

import { useGAEvent } from "@/hooks/useGAEvent";
import * as React from "react";
import * as ReactDOM from "react-dom";

export interface ZoomableImageProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
}

export default function ZoomableImage({
  src,
  alt,
  className = "",
  ...rest
}: ZoomableImageProps) {
  const [open, setOpen] = React.useState(false);
  const { trackEvent } = useGAEvent();

  const openLightbox = React.useCallback(() => {
    setOpen(true);
    trackEvent("image_zoom", {
      image_src: src,
      image_alt: alt || "",
    });
  }, [src, alt, trackEvent]);
  
  const closeLightbox = React.useCallback(() => setOpen(false), []);

  const onKeyDownGlobal = React.useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
    },
    [closeLightbox]
  );

  React.useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDownGlobal);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDownGlobal);
    };
  }, [open, onKeyDownGlobal]);

  const onKeyDownLocal = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.stopPropagation();
      openLightbox();
    }
  };

  const onClickCapture = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openLightbox();
  };

  return (
    <>
      <span
        role="button"
        tabIndex={0}
        onKeyDown={onKeyDownLocal}
        onClickCapture={onClickCapture}
        className="relative inline-block my-4 cursor-zoom-in outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        onDragStart={(e) => e.preventDefault()}
      >
        <img
          src={src}
          alt={alt}
          className={[
            "transition-transform duration-200 ease-out hover:scale-[1.01]",
            className,
          ].join(" ")}
          loading="lazy"
          decoding="async"
          {...rest}
        />
      </span>

      {open && typeof window !== "undefined"
        ? ReactDOM.createPortal(
            <div
              aria-modal="true"
              role="dialog"
              aria-label="Imagen a pantalla completa"
              className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/90"
              onClick={closeLightbox}
            >
              <figure
                className="relative max-h-[95vh] max-w-[95vw] p-0 m-0"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={src}
                  alt={alt}
                  className="max-h-[95vh] max-w-[95vw] object-contain shadow-2xl"
                  draggable={false}
                />
                <button
                  onClick={closeLightbox}
                  aria-label="Cerrar imagen"
                  className="absolute -top-3 -right-3 h-9 w-9 rounded-full bg-white/95 text-black shadow-md hover:bg-white transition-colors flex items-center justify-center text-sm font-bold"
                >
                  ✕
                </button>
                {alt && (
                  <figcaption className="mt-3 text-center text-white/80 text-sm">
                    {alt}
                  </figcaption>
                )}
              </figure>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
