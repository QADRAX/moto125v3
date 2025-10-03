/**
 * Rank "Pruebas" (articles) by maxSpeed from prestaciones content block.
 *
 * - Fetches all articles from Strapi (paginated).
 * - For each article, finds a DZ block "__component": "article-content.prestaciones".
 * - Extracts prestaciones.maxSpeed (e.g., "108,1 km/h") and parses it to number (km/h).
 * - Sorts articles by maxSpeed (desc).
 * - Prints the top list and writes JSON/CSV to packages/migration/out/.
 *
 * ENV:
 *   STRAPI_API_URL
 *   STRAPI_API_TOKEN
 *
 * Run:
 *   pnpm ts-node packages/migration/src/rankArticlesByMaxSpeed.ts
 */

import "dotenv/config";
import path from "path";
import { promises as fs } from "fs";
import { createMoto125Api } from "@moto125/api-client";

const { STRAPI_API_URL, STRAPI_API_TOKEN } = process.env;

function log(...a: unknown[]) { console.log("[rank-max-speed]", ...a); }
function warn(...a: unknown[]) { console.warn("[rank-max-speed]", ...a); }
function errorLog(...a: unknown[]) { console.error("[rank-max-speed]", ...a); }

function guardEnv() {
  const missing: string[] = [];
  if (!STRAPI_API_URL) missing.push("STRAPI_API_URL");
  if (!STRAPI_API_TOKEN) missing.push("STRAPI_API_TOKEN");
  if (missing.length) throw new Error(`Missing env vars: ${missing.join(", ")}`);
  log(`Env OK (url=${new URL(STRAPI_API_URL!).origin})`);
}

const sdk = createMoto125Api({
  baseUrl: STRAPI_API_URL!,
  token: STRAPI_API_TOKEN!,
  queryDefaults: { publicationState: "live", locale: "es" },
});

/** Parse strings like "108,1 km/h", "112.3 km/h", "120 km/h" into number km/h. */
function parseMaxSpeed(value: unknown): number | null {
  if (typeof value !== "string") return null;
  // Find the first "<number>[,|.]<decimals>? km/h"
  const m = value.match(/([\d.,]+)\s*km\/h/i);
  if (!m) return null;
  let numeric = m[1].trim();

  // Heuristics for ES formatting:
  // - If contains both '.' and ',', assume '.' = thousands, ',' = decimal -> remove '.' and replace ',' with '.'
  // - Else if only ',', treat comma as decimal
  // - Else if only '.', treat dot as decimal
  if (numeric.includes(".") && numeric.includes(",")) {
    numeric = numeric.replace(/\./g, "").replace(",", ".");
  } else if (numeric.includes(",")) {
    numeric = numeric.replace(",", ".");
  }
  // Finally keep only [0-9.] to be safe
  numeric = numeric.replace(/[^0-9.]/g, "");

  const n = Number.parseFloat(numeric);
  return Number.isFinite(n) ? n : null;
}

type RankedRow = {
  rank: number;
  maxSpeedKmh: number;
  maxSpeedRaw?: string | null;
  slug: string;
  title?: string | null;
  publicationDate?: string | null;
  documentId: string;
  relatedMotoModels?: string[];
  relatedMotoIds?: string[]; // moto125Id
};

async function fetchAllArticlesWithContent(): Promise<any[]> {
  const pageSize = 100;
  let page = 1;
  const all: any[] = [];

  while (true) {
    const res = await sdk.articles.list({
      pagination: { page, pageSize, withCount: true },
      sort: ["publicationDate:desc", "id:desc"],
    });

    const items = res.data ?? [];
    all.push(...items);

    const meta = (res as any).meta;
    const pagination = meta?.pagination;
    const pageCount = pagination?.pageCount ?? 1;
    log(`Fetched page ${page}/${pageCount} (items: ${items.length})`);
    if (page >= pageCount) break;
    page++;
  }

  log(`Total articles fetched: ${all.length}`);
  return all;
}

function extractPrestacionesBlock(article: any): { prestaciones?: Record<string, unknown> | null } | null {
  const blocks = Array.isArray(article?.content) ? article.content : [];
  for (const b of blocks) {
    if (b?.__component === "article-content.prestaciones") {
      return { prestaciones: b?.prestaciones ?? null };
    }
  }
  return null;
}

function toRankable(article: any): { ok: boolean; row?: Omit<RankedRow, "rank"> } {
  const slug = article?.slug as string | undefined;
  const title = article?.title as string | undefined;
  const publicationDate = article?.publicationDate as string | undefined;
  const documentId = article?.documentId as string | undefined;

  const prest = extractPrestacionesBlock(article);
  const raw = prest?.prestaciones?.["maxSpeed"] as string | undefined;

  const max = parseMaxSpeed(raw);
  if (!slug || !documentId || max == null) return { ok: false };

  const relatedMotoModels = Array.isArray(article?.relatedMotos)
    ? article.relatedMotos.map((m: any) => m?.modelName).filter(Boolean)
    : undefined;
  const relatedMotoIds = Array.isArray(article?.relatedMotos)
    ? article.relatedMotos.map((m: any) => m?.moto125Id).filter(Boolean)
    : undefined;

  return {
    ok: true,
    row: {
      maxSpeedKmh: max,
      maxSpeedRaw: raw ?? null,
      slug,
      title: title ?? null,
      publicationDate: publicationDate ?? null,
      documentId,
      relatedMotoModels,
      relatedMotoIds,
    },
  };
}

function toCsv(rows: RankedRow[]): string {
  const header = [
    "rank",
    "maxSpeedKmh",
    "maxSpeedRaw",
    "slug",
    "title",
    "publicationDate",
    "documentId",
    "relatedMotoModels",
    "relatedMotoIds",
  ].join(",");

  const escape = (v: unknown) => {
    if (v == null) return "";
    const s = String(v);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const body = rows
    .map((r) =>
      [
        r.rank,
        r.maxSpeedKmh,
        r.maxSpeedRaw ?? "",
        r.slug,
        r.title ?? "",
        r.publicationDate ?? "",
        r.documentId,
        (r.relatedMotoModels ?? []).join(" | "),
        (r.relatedMotoIds ?? []).join(" | "),
      ]
        .map(escape)
        .join(",")
    )
    .join("\n");

  return `${header}\n${body}\n`;
}

async function ensureOutDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

async function main() {
  guardEnv();

  const outDir = path.resolve(process.cwd(), "data", "ranking-maxspeed");
  await ensureOutDir(outDir);

  const articles = await fetchAllArticlesWithContent();

  const rankables: Omit<RankedRow, "rank">[] = [];
  for (const a of articles) {
    const r = toRankable(a);
    if (r.ok && r.row) rankables.push(r.row);
  }

  if (rankables.length === 0) {
    warn("No articles with prestaciones.maxSpeed found.");
    return;
  }

  // Sort desc by speed and assign rank
  rankables.sort((a, b) => b.maxSpeedKmh - a.maxSpeedKmh);
  const ranked: RankedRow[] = rankables.map((r, i) => ({ ...r, rank: i + 1 }));

  // Print top 20 to console
  log("Top 20 by maxSpeed (km/h):");
  for (const row of ranked.slice(0, 20)) {
    log(
      `${row.rank}. ${row.maxSpeedKmh} km/h — ${row.title ?? row.slug} ` +
      `(slug=${row.slug}, docId=${row.documentId})`
    );
  }

  // Write JSON & CSV
  const jsonPath = path.join(outDir, "ranking_max_speed.json");
  const csvPath = path.join(outDir, "ranking_max_speed.csv");
  await fs.writeFile(jsonPath, JSON.stringify(ranked, null, 2), "utf8");
  await fs.writeFile(csvPath, toCsv(ranked), "utf8");

  log(`Saved: ${jsonPath}`);
  log(`Saved: ${csvPath}`);
}

main().catch((e) => {
  errorLog(e);
  process.exit(1);
});
