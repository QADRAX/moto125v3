import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Article } from "@moto125/api-client";
import { getDiskStore, getSdk } from "../client.js";
import {
  getOrRunBrokenScan,
  getOrRunImageIssuesScan,
} from "../brokenScanCache.js";
import {
  detectBrokenArticleContent,
  type BrokenContentFinding,
} from "../contentBrokenDetect.js";
import {
  detectImageIssuesInArticleContent,
  type ImageIssueFinding,
} from "../contentImageDetect.js";
import { runTool } from "../util.js";

export type BrokenArticleHit = {
  documentId: string;
  slug: string;
  title: string | null;
  publicationDate: string | null;
  reasons: BrokenContentFinding["reason"][];
  findings: BrokenContentFinding[];
};

type BrokenScanReport = {
  scanned: number;
  totalInCms: number | null;
  brokenCount: number;
  broken: BrokenArticleHit[];
  fromCache: boolean;
};

export type ImageIssueArticleHit = {
  documentId: string;
  slug: string;
  title: string | null;
  publicationDate: string | null;
  reasons: ImageIssueFinding["reason"][];
  findings: ImageIssueFinding[];
};

type ImageIssuesScanReport = {
  scanned: number;
  totalInCms: number | null;
  issueCount: number;
  articles: ImageIssueArticleHit[];
  fromCache: boolean;
};

const scanInputSchema = {
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
  force: z
    .boolean()
    .optional()
    .describe("Si true, ignora caché del informe y reescanea"),
};

/**
 * Escanea artículos: markdown roto (HTML/tablas) e issues de imágenes
 * (saltos + chrome v1). Solo lectura. Informes cacheados en disco.
 */
export function registerContentHealthTools(server: McpServer) {
  server.registerTool(
    "articles_list_broken_content",
    {
      title: "Listar artículos con content roto",
      description: [
        "Escanea bloques article-content.text-content y lista artículos con markdown oficialmente roto.",
        "Criterios: html_residual (<table>/<div>/<p>/…), tabla_sin_separador, tabla_celdas_desiguales, tabla_malformada.",
        "No reescribe nada. No mira estilo editorial ni links ni imágenes.",
        "Resultado cacheado en disco; force=true salta caché. Se invalida al crear/actualizar artículos.",
        "Paginación interna por pageSize; maxPages limita el barrido.",
      ].join(" "),
      inputSchema: scanInputSchema,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ pageSize, maxPages, publicationState, force }) =>
      runTool(async () => {
        const size = pageSize ?? 50;
        const pages = maxPages ?? 20;
        const pub = publicationState ?? "preview";
        const store = getDiskStore();

        const { result, fromCache } = await getOrRunBrokenScan(
          store,
          {
            publicationState: pub,
            pageSize: size,
            maxPages: pages,
            force,
          },
          () => runBrokenScan({ pageSize: size, maxPages: pages, publicationState: pub })
        );

        return { ...result, fromCache } satisfies BrokenScanReport;
      })
  );

  server.registerTool(
    "articles_list_image_issues",
    {
      title: "Listar artículos con issues de imágenes MD",
      description: [
        "Escanea text-content y lista artículos con problemas de imágenes markdown.",
        "Criterios: imagen_sin_salto (falta \\n\\n antes/después fuera de tablas GFM),",
        "imagen_chrome_v1 (Ban/, banners/, M_images/, stories/modulos/, diseologitoparaweb, burbuverde, banners 728x90…).",
        "No reescribe nada. Tablas «Con lupa» no exigen salto; sí reportan chrome.",
        "Cacheado en disco; force=true reescanea. Se invalida al crear/actualizar artículos.",
      ].join(" "),
      inputSchema: scanInputSchema,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ pageSize, maxPages, publicationState, force }) =>
      runTool(async () => {
        const size = pageSize ?? 50;
        const pages = maxPages ?? 20;
        const pub = publicationState ?? "preview";
        const store = getDiskStore();

        const { result, fromCache } = await getOrRunImageIssuesScan(
          store,
          {
            publicationState: pub,
            pageSize: size,
            maxPages: pages,
            force,
          },
          () =>
            runImageIssuesScan({
              pageSize: size,
              maxPages: pages,
              publicationState: pub,
            })
        );

        return { ...result, fromCache } satisfies ImageIssuesScanReport;
      })
  );
}

async function listArticlesPage(opts: {
  page: number;
  pageSize: number;
  publicationState: "live" | "preview";
}) {
  const sdk = getSdk();
  return sdk.articles.list({
    publicationState: opts.publicationState,
    pagination: {
      page: opts.page,
      pageSize: opts.pageSize,
      withCount: true,
    },
    fields: ["slug", "title", "publicationDate"],
    populate: {
      content: true,
    },
    sort: ["publicationDate:desc", "createdAt:desc"],
  });
}

async function runBrokenScan(opts: {
  pageSize: number;
  maxPages: number;
  publicationState: "live" | "preview";
}): Promise<Omit<BrokenScanReport, "fromCache">> {
  const broken: BrokenArticleHit[] = [];
  let scanned = 0;
  let total: number | null = null;

  for (let page = 1; page <= opts.maxPages; page += 1) {
    const res = await listArticlesPage({
      page,
      pageSize: opts.pageSize,
      publicationState: opts.publicationState,
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
}

async function runImageIssuesScan(opts: {
  pageSize: number;
  maxPages: number;
  publicationState: "live" | "preview";
}): Promise<Omit<ImageIssuesScanReport, "fromCache">> {
  const articles: ImageIssueArticleHit[] = [];
  let scanned = 0;
  let total: number | null = null;

  for (let page = 1; page <= opts.maxPages; page += 1) {
    const res = await listArticlesPage({
      page,
      pageSize: opts.pageSize,
      publicationState: opts.publicationState,
    });

    if (total == null) {
      total = res.meta.pagination?.total ?? null;
    }

    const batch = res.data ?? [];
    if (!batch.length) break;

    for (const article of batch) {
      scanned += 1;
      const findings = detectImageIssuesInArticleContent(
        article.content as Article["content"]
      );
      if (!findings.length) continue;

      const reasons = [...new Set(findings.map((f) => f.reason))];
      articles.push({
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
    issueCount: articles.length,
    articles,
  };
}
