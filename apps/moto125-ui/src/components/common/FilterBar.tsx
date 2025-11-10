"use client";
import * as React from "react";

export interface FilterBarProps {
  query: string;
  onQueryChange: (next: string) => void;
  placeholder?: string;

  // For lists that support active/inactive filtering (motos)
  showActiveToggle?: boolean;
  activeOnly?: boolean;
  onActiveOnlyChange?: (next: boolean) => void;
  // When true, the active toggle is disabled (read-only)
  activeToggleDisabled?: boolean;

  className?: string;
}

export default function FilterBar({
  query,
  onQueryChange,
  placeholder = "Buscar...",
  showActiveToggle = false,
  activeOnly = false,
  onActiveOnlyChange,
  activeToggleDisabled = false,
  className = "",
}: FilterBarProps) {
  return (
    <div className={["mb-4", className].join(" ")}>
      <div
        className={[
          "flex items-center gap-3 w-full",
          "p-2",
          "border border-gray-200 dark:border-neutral-700",
          "bg-white dark:bg-neutral-900",
          "rounded-none",
          "flex-nowrap",
        ].join(" ")}
      >
        <input
          aria-label={placeholder}
          placeholder={placeholder}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          className="flex-1 bg-transparent border-none text-sm text-neutral-900 dark:text-neutral-100 outline-none"
        />

        {showActiveToggle && onActiveOnlyChange ? (
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => onActiveOnlyChange(e.target.checked)}
              disabled={activeToggleDisabled}
              aria-disabled={activeToggleDisabled}
            />
            <span className="select-none">Solo activos</span>
          </label>
        ) : null}
      </div>
    </div>
  );
}
