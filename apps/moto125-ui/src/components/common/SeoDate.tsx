import * as React from "react";
import { formatDate } from "@/utils/utils";

/**
 * Props for the SEO-friendly date component.
 */
export interface SeoDateProps extends React.HTMLAttributes<HTMLTimeElement> {
  /** ISO string for the date (e.g., 2025-09-16T10:00:00.000Z). */
  iso: string;
  /** Optional visible label (e.g., "Publicado"). If provided, it will be rendered before the date. */
  label?: string;
  /**
   * Optional microdata itemProp for SEO, e.g., "datePublished" or "dateModified".
   * See: https://schema.org/datePublished
   */
  itemProp?: "datePublished" | "dateModified" | (string & {});
  /** If true, hides the visible label but keeps the date; useful when label is redundant. */
  hideLabelVisually?: boolean;
}

export function SeoDate({
  iso,
  label,
  itemProp,
  hideLabelVisually,
  className = "",
  ...rest
}: SeoDateProps) {
  const formatted = React.useMemo(() => formatDate(iso), [iso]);

  return (
    <span className={className}>
      {label && !hideLabelVisually && <span className="mr-1">{label}:</span>}
      <time dateTime={iso} itemProp={itemProp} {...rest}>
        {formatted}
      </time>
    </span>
  );
}

export default SeoDate;
