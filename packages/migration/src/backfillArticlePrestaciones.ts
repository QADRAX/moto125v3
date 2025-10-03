/**
 * Backfill "prestaciones" into the ARTICLE content (Dynamic Zone).
 *
 * Scans local folders:
 *   packages/migration/data/moto125Posts/<year>/<slug>/data.json
 *
 * If data.json contains { prestaciones: {...} }, then:
 *  1) fetch the Strapi Article by slug (with content populated),
 *  2) sanitize existing blocks into ArticleContentBlockInput[],
 *  3) upsert a block: { __component: "article-content.prestaciones", prestaciones: {...} },
 *  4) update the article content in Strapi.
 *
 * ENV VARS:
 *   STRAPI_API_URL
 *   STRAPI_API_TOKEN
 *
 * OPTIONAL:
 *   DRY_RUN=true   -> log actions without updating Strapi
 *
 * Run:
 *   pnpm ts-node packages/migration/src/backfillArticlePrestaciones.ts
 *   DRY_RUN=true pnpm ts-node packages/migration/src/backfillArticlePrestaciones.ts
 */

import "dotenv/config";
import path from "path";
import { promises as fs } from "fs";
import type { Dirent } from "fs";
import { createMoto125Api } from "@moto125/api-client";
import type {
  ArticleContentBlockInput,
} from "@moto125/api-client";

const { STRAPI_API_URL, STRAPI_API_TOKEN, DRY_RUN } = process.env;

const ROOT = path.resolve(
  process.cwd(),
  "data",
  "moto125Posts"
);

function log(...a: unknown[]) { console.log("[backfill-article-prestaciones]", ...a); }
function warn(...a: unknown[]) { console.warn("[backfill-article-prestaciones]", ...a); }
function errorLog(...a: unknown[]) { console.error("[backfill-article-prestaciones]", ...a); }

function guardEnv() {
  const missing: string[] = [];
  if (!STRAPI_API_URL) missing.push("STRAPI_API_URL");
  if (!STRAPI_API_TOKEN) missing.push("STRAPI_API_TOKEN");
  if (missing.length) throw new Error(`Missing env vars: ${missing.join(", ")}`);
  log(`Env OK (url=${new URL(STRAPI_API_URL!).origin}) DRY_RUN=${!!DRY_RUN}`);
}

const sdk = createMoto125Api({
  baseUrl: STRAPI_API_URL!,
  token: STRAPI_API_TOKEN!,
  queryDefaults: { publicationState: "live", locale: "es" },
});

type LocalDataJson = {
  slug?: string;
  prestaciones?: Record<string, unknown>;
  [k: string]: unknown;
};

/** Read and parse JSON, return null if fails. */
async function safeReadJson(file: string): Promise<LocalDataJson | null> {
  try {
    const txt = await fs.readFile(file, "utf8");
    return JSON.parse(txt) as LocalDataJson;
  } catch (e) {
    warn(`Could not read/parse ${file}: ${(e as Error).message}`);
    return null;
  }
}

/** Iterate over all <year>/<slug>/data.json files. */
async function* iterDataJsonFiles(): AsyncGenerator<{ year: string; slug: string; file: string }> {
  let yearEntries: Dirent[] = [];
  try {
    yearEntries = await fs.readdir(ROOT, { withFileTypes: true }) as unknown as Dirent[];
  } catch (e) {
    throw new Error(`Cannot read root path ${ROOT}: ${(e as Error).message}`);
  }

  for (const yd of yearEntries) {
    if (!yd.isDirectory()) continue;
    const year = yd.name;
    const yearPath = path.join(ROOT, year);

    let slugEntries: Dirent[] = [];
    try {
      slugEntries = await fs.readdir(yearPath, { withFileTypes: true }) as unknown as Dirent[];
    } catch (e) {
      warn(`Cannot read year folder ${yearPath}: ${(e as Error).message}`);
      continue;
    }

    for (const sd of slugEntries) {
      if (!sd.isDirectory()) continue;
      const slug = sd.name;
      const file = path.join(yearPath, slug, "data.json");
      try {
        const st = await fs.stat(file);
        if (st.isFile()) {
          yield { year, slug, file };
        }
      } catch {
        // no data.json -> skip silently
      }
    }
  }
}

/** Fetch an article by slug with content populated. */
async function getArticleBySlugWithContent(slug: string) {
  const res = await sdk.articles.getBySlug(slug, {
    fields: ["slug", "title", "documentId"],
    populate: {
      content: { populate: "*" },
    },
    pagination: { page: 1, pageSize: 1, withCount: false },
  });
  return res.data?.[0] ?? null;
}

/**
 * Sanitize dynamic zone blocks:
 * Convert Strapi entries into ArticleContentBlockInput (remove read-only fields, keep allowed props).
 * This keeps your current blocks intact while ensuring the update payload is valid.
 */
function sanitizeBlocksToInput(blocks: any[] | undefined | null): ArticleContentBlockInput[] {
  if (!Array.isArray(blocks)) return [];

  const out: ArticleContentBlockInput[] = [];

  for (const b of blocks) {
    const comp = b?.__component as string | undefined;
    if (!comp) continue;

    if (comp === "article-content.text-content") {
      const Text = b?.Text ?? "";
      out.push({ __component: comp, Text });

    } else if (comp === "article-content.image-grid-content") {
      // This DZ has no required fields in your inputs typing
      out.push({ __component: comp });

    } else if (comp === "article-content.fortalezas-debilidades") {
      const Fortalezas = Array.isArray(b?.Fortalezas)
        ? b.Fortalezas.map((i: any) => ({ value: i?.value ?? i?.Value ?? "" }))
        : undefined;
      const Debilidades = Array.isArray(b?.Debilidades)
        ? b.Debilidades.map((i: any) => ({ value: i?.value ?? i?.Value ?? "" }))
        : undefined;
      out.push({ __component: comp, Fortalezas, Debilidades });

    } else if (comp === "article-content.prestaciones") {
      const prestaciones = b?.prestaciones ?? {};
      out.push({ __component: comp, prestaciones });

    } else {
      // Unknown/extra block: best-effort passthrough (strip id)
      const { id: _omit, __component, ...rest } = b ?? {};
      out.push({ __component, ...rest } as any);
    }
  }

  return out;
}

/** Replace or append the prestaciones block. */
function upsertPrestacionesBlock(
  blocks: ArticleContentBlockInput[],
  prestaciones: Record<string, unknown>
): ArticleContentBlockInput[] {
  const idx = blocks.findIndex((b) => b.__component === "article-content.prestaciones");
  const newBlock: ArticleContentBlockInput = {
    __component: "article-content.prestaciones",
    prestaciones,
  };

  if (idx >= 0) {
    const clone = blocks.slice();
    clone[idx] = newBlock; // replace deterministically
    return clone;
  }

  return [...blocks, newBlock];
}

async function main() {
  guardEnv();

  let scanned = 0;
  let withPrestaciones = 0;
  let notFound = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  log(`Scanning ${ROOT}`);

  for await (const { year, slug: folderSlug, file } of iterDataJsonFiles()) {
    scanned++;

    const local = await safeReadJson(file);
    if (!local) continue;

    const slug = folderSlug || local.slug;
    if (!slug) {
      warn(`[${year}/${folderSlug}] No slug (folder name or data.json). Skipping.`);
      continue;
    }

    const prestaciones = local.prestaciones as Record<string, unknown> | undefined;
    if (!prestaciones || Object.keys(prestaciones).length === 0) {
      skipped++;
      continue;
    }
    withPrestaciones++;

    try {
      const article = await getArticleBySlugWithContent(slug);
      if (!article?.documentId) {
        warn(`[${year}/${slug}] Article not found in Strapi. Skipping.`);
        notFound++;
        continue;
      }

      const existingBlocks = sanitizeBlocksToInput((article as any).content);
      const nextBlocks = upsertPrestacionesBlock(existingBlocks, prestaciones);

      if (DRY_RUN) {
        log(`[${year}/${slug}] DRY_RUN would update content (${existingBlocks.length} -> ${nextBlocks.length} blocks).`);
        updated++;
        continue;
      }

      await sdk.articles.update(article.documentId, { content: nextBlocks });

      log(`[${year}/${slug}] Updated OK (docId=${article.documentId}).`);
      updated++;

    } catch (e: any) {
      const msg = e?.status
        ? `HTTP ${e.status} ${e.message ?? ""} ${JSON.stringify(e.detail)}`
        : (e?.message ?? String(e));
      errorLog(`[${year}/${folderSlug}] Error: ${msg}`);
      errors++;
    }
  }

  log(
    `DONE — scanned=${scanned}, withPrestaciones=${withPrestaciones}, ` +
    `notFound=${notFound}, updated=${updated}, skipped=${skipped}, errors=${errors}`
  );
}

main().catch((e) => {
  errorLog(e);
  process.exit(1);
});
