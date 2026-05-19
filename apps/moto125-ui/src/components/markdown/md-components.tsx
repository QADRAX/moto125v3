import type { Components } from "react-markdown";
import { mediaUrl } from "@/utils/utils";
import ZoomableImage from "../common/ZoomableImage";
import TrackedHeading from "./TrackedHeading";
import TrackableLink from "./TrackableLink";

export const mdComponents: Components = {
  h1: ({ children, ...props }) => (
    <TrackedHeading
      as="h1"
      className="mt-6 scroll-mt-24 text-3xl font-bold"
      {...(props as any)}
    >
      {children}
    </TrackedHeading>
  ),
  h2: ({ children, ...props }) => (
    <TrackedHeading
      as="h2"
      className="mt-6 scroll-mt-24 text-2xl font-bold"
      {...(props as any)}
    >
      {children}
    </TrackedHeading>
  ),
  h3: ({ children, ...props }) => (
    <TrackedHeading
      as="h3"
      className="mt-6 scroll-mt-24 text-xl font-bold"
      {...(props as any)}
    >
      {children}
    </TrackedHeading>
  ),
  h4: ({ children, ...props }) => (
    <TrackedHeading
      as="h4"
      className="mt-4 scroll-mt-24 text-lg font-semibold"
      {...(props as any)}
    >
      {children}
    </TrackedHeading>
  ),
  p: ({ children, ...props }) => (
    <p className="my-4 leading-relaxed" {...(props as any)}>
      {children}
    </p>
  ),
  ul: ({ children, ...props }) => (
    <ul className="my-4 list-disc pl-6" {...(props as any)}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="my-4 list-decimal pl-6" {...(props as any)}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li className="my-1" {...(props as any)}>
      {children}
    </li>
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote className="my-4 border-l-4 pl-4 italic opacity-80" {...(props as any)}>
      {children}
    </blockquote>
  ),
  table: ({ children, ...props }) => (
    <div className="my-4 overflow-x-auto">
      <table className="w-full border-collapse" {...(props as any)}>
        {children}
      </table>
    </div>
  ),
  th: ({ children, ...props }) => (
    <th className=" py-2 pr-4 text-left font-medium" {...(props as any)}>
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td className=" py-2" {...(props as any)}>
      {children}
    </td>
  ),
  a: ({ children, href, ...props }) => {
    if (!href) return <span {...(props as any)}>{children}</span>;
    return (
      <TrackableLink href={href} {...(props as any)}>
        {children}
      </TrackableLink>
    );
  },
  img: ({ src, alt, ...props }) => {
    const url = src ? mediaUrl(src) : undefined;
    if (!url) return null;
    return (
      <ZoomableImage
        src={url}
        alt={alt ?? ""}
        className="my-2"
        {...(props as any)}
      />
    );
  },
  code: ({ className, children }) => {
    const txt = String(children).replace(/\n$/, "");
    const lang = /language-([\w-]+)/.exec(className || "")?.[1];
    return (
      <pre className="my-4 overflow-x-auto bg-neutral-950 p-4 text-neutral-100">
        <code className={lang ? `language-${lang}` : undefined}>{txt}</code>
      </pre>
    );
  },
};
