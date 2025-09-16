import * as React from "react";
import Link from "next/link";
import { slugify } from "@/utils/utils";

export interface ArticleTypeBadgeProps {
  name: string;
  className?: string;
}


export function ArticleTypeBadge({ name, className = "" }: ArticleTypeBadgeProps) {
  const slug = slugify(name);
  const href = `/articulos/tipo/${slug}`;

  return (
    <Link
      href={href}
      className={[
        "inline-block bg-[var(--color-primary)] text-white text-xs font-bold uppercase",
        "tracking-wide px-2 py-1 ml-2 align-middle transition-colors",
        "hover:bg-[color-mix(in srgb, var(--color-primary) 85%, black)]",
        className,
      ].join(" ")}
    >
      {name}
    </Link>
  );
}

export default ArticleTypeBadge;
