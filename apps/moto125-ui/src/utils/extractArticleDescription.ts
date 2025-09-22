import type { Article, ArticleContentBlock, TextContentBlock } from "@moto125/api-client";

import { unified } from "unified";
import remarkParse from "remark-parse";
import { visit, EXIT } from "unist-util-visit";
import { toString } from "mdast-util-to-string";

type Options = { maxLength?: number };

function isTextBlock(b: ArticleContentBlock): b is TextContentBlock {
  return b?.__component === "article-content.text-content" && typeof (b as any).Text === "string";
}

function truncateAtWord(input: string, max = 170): string {
  const s = input.trim().replace(/\s+/g, " ");
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 60 ? cut.slice(0, lastSpace) : cut).trimEnd() + "…";
}

export function extractArticleDescriptionFromMarkdown(md: string, opts?: Options): string | null {
  if (!md || !md.trim()) return null;

  try {
    const tree = unified().use(remarkParse as any).parse(md);
    let result: string | null = null;

    visit(tree as any, "paragraph", (node: any) => {
      if (result) return EXIT;

      const first = node?.children?.[0];
      if (first?.type === "emphasis" && first?.children?.length) {
        const text = toString(first);
        result = text?.trim() || null;
      } else {
        const text = toString(node);
        result = text?.trim() || null;
      }

      if (result) return EXIT;
    });

    if (!result) {
      visit(tree as any, "html", (node: any) => {
        if (result) return EXIT;
        const html: string = node?.value ?? "";
        const m = html.match(/<em[^>]*>([\s\S]*?)<\/em>/i);
        if (m?.[1]) {
          const stripped = m[1].replace(/<[^>]+>/g, "").trim();
          if (stripped) result = stripped;
        }
      });
    }

    if (!result) return null;
    return truncateAtWord(result, opts?.maxLength ?? 170);
  } catch {
    const em = md.match(/<em[^>]*>([\s\S]*?)<\/em>/i)?.[1]?.replace(/<[^>]+>/g, "").trim();
    if (em) return truncateAtWord(em, opts?.maxLength ?? 170);

    const firstPara = md
      .split(/\n{2,}/)
      .map(s => s.replace(/[*_`>#-]/g, "").trim())
      .find(Boolean);
    return firstPara ? truncateAtWord(firstPara, opts?.maxLength ?? 170) : null;
  }
}

export function computeArticleDescription(article: Article, opts?: Options): string | undefined {
  const mdBlocks = (article.content ?? []).filter(isTextBlock).map(b => b.Text!.trim()).filter(Boolean);
  for (const md of mdBlocks) {
    const desc = extractArticleDescriptionFromMarkdown(md, opts);
    if (desc) return desc;
  }
  return article.authorText ?? undefined;
}
