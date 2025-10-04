/**
 * Backfill: replace old Moto125 links inside article text blocks (Markdown).
 *
 * Replaces links like:
 *   /comparador/?run=moto_ficha.php&id_a_moto=110
 *   /comparador?run=moto_ficha.php&id_a_moto=110
 *   /comparador/index.php?run=moto_ficha.php&id_a_moto=110
 *   https://domain/comparador/?run=moto_ficha.php&amp;id_a_moto=110&foo=bar
 * with:
 *   /moto/110
 *
 * ENV VARS:
 *   STRAPI_API_URL
 *   STRAPI_API_TOKEN
 *
 * OPTIONAL:
 *   DRY_RUN=true
 *   PAGE_SIZE=100
 *
 * Run:
 *   pnpm ts-node packages/migration/src/backfillReplaceOldLinks.ts
 */

import "dotenv/config";
import { createMoto125Api } from "@moto125/api-client";
import type { Article, ArticleContentBlock } from "@moto125/api-client";
import type { ArticleContentBlockInput } from "@moto125/api-client";

const { STRAPI_API_URL, STRAPI_API_TOKEN, DRY_RUN, PAGE_SIZE } = process.env;

function log(...a: unknown[]) { console.log("[backfill-replace-old-links]", ...a); }
function warn(...a: unknown[]) { console.warn("[backfill-replace-old-links]", ...a); }
function errorLog(...a: unknown[]) { console.error("[backfill-replace-old-links]", ...a); }

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

/**
 * Regex that finds any URL pointing to /comparador (with optional domain and /index.php),
 * allowing an optional slash before the query mark:
 *   /comparador? ...
 *   /comparador/? ...
 *   /comparador/index.php? ...
 *
 * It captures the whole query string to parse with URLSearchParams.
 */
const OLD_LINK_REGEX =
  /(?:https?:\/\/[^\/"' )]+)?\/comparador(?:\/index\.php)?\/?\?([^"' )]+)/gi;

/** Replace &amp; -> & to properly parse query strings coming from HTML/Markdown. */
function normalizeEntities(qs: string): string {
  return qs.replace(/&amp;/gi, "&");
}

/**
 * Replace only when id_a_moto=<digits> is present.
 */
function replaceOldMotoLinks(text: string | undefined | null): {
  next: string;
  replacements: number;
  samples: string[];
  comparadorHints: number;
} {
  if (!text) return { next: text ?? "", replacements: 0, samples: [], comparadorHints: 0 };

  // Count hints even if we don't replace (for diagnostics)
  const hintRe = /\/comparador(?:\/index\.php)?\/?\?/gi;
  const comparadorHints = (text.match(hintRe) || []).length;

  const samples: string[] = [];
  const next = text.replace(OLD_LINK_REGEX, (full: string, queryRaw: string) => {
    const params = new URLSearchParams(normalizeEntities(queryRaw));
    const id = params.get("id_a_moto");
    if (id && /^\d+$/.test(id)) {
      if (samples.length < 10) samples.push(full);
      return `/moto/${id}`;
    }
    return full;
  });

  return { next, replacements: samples.length, samples, comparadorHints };
}

/** Sanitize DZ blocks for update payload (strip ids, keep allowed props). */
function sanitizeBlocksToInput(blocks: ArticleContentBlock[] | undefined | null): ArticleContentBlockInput[] {
  if (!Array.isArray(blocks)) return [];
  const out: ArticleContentBlockInput[] = [];

  for (const b of blocks) {
    const comp = (b as any)?.__component as string | undefined;
    if (!comp) continue;

    if (comp === "article-content.text-content") {
      const Text = (b as any)?.Text ?? "";
      out.push({ __component: comp, Text });

    } else if (comp === "article-content.image-grid-content") {
      out.push({ __component: comp });

    } else if (comp === "article-content.fortalezas-debilidades") {
      const Fortalezas = Array.isArray((b as any)?.Fortalezas)
        ? (b as any).Fortalezas.map((i: any) => ({ value: i?.value ?? i?.Value ?? "" }))
        : undefined;
      const Debilidades = Array.isArray((b as any)?.Debilidades)
        ? (b as any).Debilidades.map((i: any) => ({ value: i?.value ?? i?.Value ?? "" }))
        : undefined;
      out.push({ __component: comp, Fortalezas, Debilidades });

    } else if (comp === "article-content.prestaciones") {
      const prestaciones = (b as any)?.prestaciones ?? {};
      out.push({ __component: comp, prestaciones });

    } else {
      const { id: _omit, __component, ...rest } = (b as any) ?? {};
      out.push({ __component, ...rest } as any);
    }
  }

  return out;
}

function replaceLinksInBlocks(blocks: ArticleContentBlockInput[]): {
  nextBlocks: ArticleContentBlockInput[];
  totalReplacements: number;
  sampleMatches: string[];
  hintCount: number;
} {
  let total = 0;
  let hints = 0;
  const samples: string[] = [];

  const nextBlocks = blocks.map((b) => {
    if (b.__component === "article-content.text-content") {
      const raw = (b as any).Text as string | undefined;
      const { next, replacements, samples: s, comparadorHints } = replaceOldMotoLinks(raw);
      total += replacements;
      hints += comparadorHints;
      if (s.length && samples.length < 10) {
        const missing = 10 - samples.length;
        samples.push(...s.slice(0, missing));
      }
      return { ...b, Text: next };
    }
    return b;
  });

  return { nextBlocks, totalReplacements: total, sampleMatches: samples, hintCount: hints };
}

async function listArticlesPage(page: number, pageSize: number) {
  return sdk.articles.list({
    fields: ["slug", "title", "documentId"],
    populate: { content: { populate: "*" } },
    pagination: { page, pageSize, withCount: true },
    sort: ["publicationDate:desc", "createdAt:desc"],
  });
}

async function main() {
  guardEnv();

  const pageSize = Math.max(1, Number(PAGE_SIZE ?? 100));
  let page = 1;

  let scanned = 0;
  let changed = 0;
  let updated = 0;
  let errors = 0;
  let totalReplacements = 0;
  let totalHints = 0;

  const globalSamples = new Set<string>();

  while (true) {
    const res = await listArticlesPage(page, pageSize);
    const items = res?.data ?? [];
    const totalItems = (res as any)?.meta?.pagination?.total ?? undefined;

    if (!items.length) {
      log(`No more articles. Stopped at page ${page - 1}.`);
      break;
    }

    log(`Page ${page} — ${items.length} articles${totalItems ? ` (total=${totalItems})` : ""}`);

    for (const article of items as Article[]) {
      scanned++;
      const docId = (article as any)?.documentId;
      const slug = (article as any)?.slug ?? "(no-slug)";
      const title = (article as any)?.title ?? "";

      try {
        const existingBlocks = sanitizeBlocksToInput((article as any).content);
        if (!existingBlocks.length) continue;

        const { nextBlocks, totalReplacements: rep, sampleMatches, hintCount } =
          replaceLinksInBlocks(existingBlocks);

        totalHints += hintCount;

        if (rep > 0) {
          changed++;
          sampleMatches.forEach((s) => {
            if (globalSamples.size < 10) globalSamples.add(s);
          });

          if (DRY_RUN) {
            log(`DRY_RUN — would update "${title}" [${slug}] (replacements=${rep})`);
            totalReplacements += rep;
          } else {
            await sdk.articles.update(docId, { content: nextBlocks });
            updated++;
            totalReplacements += rep;
            log(`Updated "${title}" [${slug}] — replaced ${rep} link(s).`);
          }
        } else if (hintCount > 0) {
          log(`"${title}" [${slug}] contains '/comparador' (hints=${hintCount}) but no valid id_a_moto found.`);
        }
      } catch (e: any) {
        const msg = e?.status
          ? `HTTP ${e.status} ${e.message ?? ""} ${JSON.stringify(e.detail)}`
          : (e?.message ?? String(e));
        errorLog(`Error updating "${title}" [${slug}]: ${msg}`);
        errors++;
      }
    }

    page++;
  }

  log(
    `DONE — scanned=${scanned}, changed=${changed}, updated=${updated}, ` +
    `replacements=${totalReplacements}, comparadorHints=${totalHints}, errors=${errors}`
  );

  if (globalSamples.size) {
    log(`Samples replaced:`);
    Array.from(globalSamples).forEach((s) => log(`  - ${s}`));
  }
}

main().catch((e) => {
  errorLog(e);
  process.exit(1);
});
