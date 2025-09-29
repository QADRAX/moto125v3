"use client";

import { useGAEvent } from "@/hooks/useGAEvent";
import { useVisibilityOnce } from "@/hooks/useVisibilityOnce";
import * as React from "react";

type Level = "h1" | "h2" | "h3" | "h4";

type Props = React.HTMLAttributes<HTMLHeadingElement> & {
  as: Level;
};

export default function TrackedHeading({ as, children, ...rest }: Props) {
  const { trackEvent } = useGAEvent();

  const onSeen = React.useCallback(() => {
    const text =
      typeof children === "string"
        ? children
        : (rest as any)?.["data-text"] ?? "";
    trackEvent("heading_view", { level: as, heading_text: text });
  }, [as, children, rest, trackEvent]);

  const ref = useVisibilityOnce<HTMLHeadingElement>(onSeen);

  const Tag = as;
  return (
    <Tag
      ref={ref}
      {...rest}
      data-text={typeof children === "string" ? children : undefined}
    >
      {children}
    </Tag>
  );
}