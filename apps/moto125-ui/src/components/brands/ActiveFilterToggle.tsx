"use client";

import * as React from "react";

export interface ActiveFilterToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  tooltip?: string;
  className?: string;
}

export default function ActiveFilterToggle({
  checked,
  onChange,
  tooltip = "Activa este interruptor para ver solo las motos en venta. Desactívalo para ver también las descatalogadas.",
  className = "",
}: ActiveFilterToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      title={tooltip}
      className={[
        "inline-flex items-center gap-2",
        "select-none",
        className,
      ].join(" ")}
    >
      <span className="text-xs">
        {checked ? "Solo en tiendas" : "Todas"}
      </span>

      {/* Switch track */}
      <span
        aria-hidden="true"
        className={[
          "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full",
          "transition-colors duration-200",
          checked
            ? "bg-[var(--color-primary)]"
            : "bg-black/30 dark:bg-white/30",
        ].join(" ")}
      >
        {/* Knob */}
        <span
          className={[
            "h-4 w-4 rounded-full bg-white shadow-sm",
            "transition-transform duration-200 ease-out",
            checked ? "translate-x-[18px]" : "translate-x-[2px]",
          ].join(" ")}
        />
      </span>
    </button>
  );
}
