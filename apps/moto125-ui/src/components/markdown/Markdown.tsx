import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkSmartypants from "remark-smartypants";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { mdComponents } from "./md-components";

export interface MarkdownProps {
  source: string;
  className?: string;
}

export default function Markdown({ source, className }: MarkdownProps) {
  const rootClass = ["prose", "max-w-none", className]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={rootClass}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkSmartypants]}
        rehypePlugins={[
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: "wrap" }],
        ]}
        components={mdComponents}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
