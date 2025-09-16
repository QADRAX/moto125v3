import * as React from "react";
import Link from "next/link";
import { slugify } from "@/utils/utils";

export interface ArticleTagBadgeProps {
  name: string;
  className?: string;
  variant?: "filled" | "outline";
}

export default function ArticleTagBadge({
  name,
  className = "",
  variant = "filled",
}: ArticleTagBadgeProps) {
  const slug = slugify(name);
  const href = `/articulos/tag/${slug}`;

  const base =
    "inline-block text-xs font-semibold uppercase tracking-wide px-2 py-1 rounded transition-colors";

  const filled =
    "bg-[var(--color-primary)] text-white hover:bg-[color-mix(in srgb, var(--color-primary) 85%, black)]";

  const outline =
    "border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white";

  return (
    <Link href={href} className={[base, variant === "filled" ? filled : outline, className].join(" ")}>
      {name}
    </Link>
  );
}
