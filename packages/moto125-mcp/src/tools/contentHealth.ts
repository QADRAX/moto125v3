import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Article } from "@moto125/api-client";
import { getSdk } from "../client.js";
import {
  detectBrokenArticleContent,
  type BrokenContentFinding,
} from "../contentBrokenDetect.js";
import { runTool } from "../util.js";

export type BrokenArticleHit = {
  documentId: string;
  slug: string;
  title: string | null;
  publicationDate: string | null;
  reasons: BrokenContentFinding["reason"][];
  findings: BrokenContentFinding[];
};

/**
 * Escanea artículos y devuelve solo los con markdown oficialmente roto
 * (HTML residual / tablas GFM rotas). Solo lectura.
 */
export function registerContentHealthTools(server: McpServer) {
  server.registerTool(
    "articles_list_broken_content",
    {
      title: "Listar artículos con content roto",
      description: [
        "Escanea bloques article-content.text-content y lista artículos con markdown oficialmente roto.",
        "Criterios: html_residual (<table>/<div>/<p>/…), tabla_sin_separador, tabla_celdas_desiguales, tabla_malformada.",
        "No reescribe nada. No mira estilo editorial ni links.",
        "Paginación interna por pageSize; maxPages limita el barrido.",
      ].join(" "),
      inputSchema: {
        pageSize: z
          .number()
          .int()
          .min(1)
          .max(100)
          .optional()
          .describe("Artículos por petición Strapi (default 50)"),
        maxPages: z
          .number()
          .int()
          .min(1)
          .max(200)
          .optional()
          .describe("Máx. páginas a escanear (default 20)"),
        publicationState: z
          .enum(["live", "preview"])
          .optional()
          .describe("Default: preview"),
      },
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ pageSize, maxPages, publicationState }) =>
      runTool(async () => {
        const sdk = getSdk();
        const size = pageSize ?? 50;
        const pages = maxPages ?? 20;
        const broken: BrokenArticleHit[] = [];
        let scanned = 0;
        let total: number | null = null;

        for (let page = 1; page <= pages; page += 1) {
          const res = await sdk.articles.list({
            publicationState: publicationState ?? "preview",
            pagination: { page, pageSize: size, withCount: true },
            fields: ["slug", "title", "publicationDate"],
            populate: {
              content: true,
            },
            sort: ["publicationDate:desc", "createdAt:desc"],
          });

          if (total == null) {
            total = res.meta.pagination?.total ?? null;
          }

          const batch = res.data ?? [];
          if (!batch.length) break;

          for (const article of batch) {
            scanned += 1;
            const findings = detectBrokenArticleContent(
              article.content as Article["content"]
            );
            if (!findings.length) continue;

            const reasons = [...new Set(findings.map((f) => f.reason))];
            broken.push({
              documentId: article.documentId,
              slug: article.slug,
              title: article.title ?? null,
              publicationDate: article.publicationDate ?? null,
              reasons,
              findings,
            });
          }

          const pageCount = res.meta.pagination?.pageCount ?? page;
          if (page >= pageCount) break;
        }

        return {
          scanned,
          totalInCms: total,
          brokenCount: broken.length,
          broken,
        };
      })
  );
}
