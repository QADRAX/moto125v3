"use client";

import * as React from "react";
import NextLink from "next/link";
import { useGAEvent } from "@/hooks/useGAEvent";

function isExternalUrl(href?: string) {
  if (!href) return false;
  try {
    const u = new URL(href, location.origin);
    return u.origin !== location.origin;
  } catch {
    return false;
  }
}

type Props = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  className?: string;
  children: React.ReactNode;
};

export default function TrackableLink({ href, children, ...rest }: Props) {
  const { trackEvent } = useGAEvent();
  const external = isExternalUrl(href);

  const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    trackEvent("article_link_click", {
      href,
      is_external: external,
      link_text:
        typeof children === "string" ? children : (rest as any)?.["data-text"] ?? "",
    });
    rest.onClick?.(e);
  };

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        {...rest}
        onClick={onClick}
      >
        {children}
      </a>
    );
  }

  return (
    <NextLink href={href} {...(rest as any)} onClick={onClick}>
      {children}
    </NextLink>
  );
}
