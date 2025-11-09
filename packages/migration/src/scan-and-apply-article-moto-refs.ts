/**
 * One-file CLI: scan → plan → apply relatedMotos & relatedCompanies in Articles.
 *
 * Usage:
 *   # Dry-run (merge): scan, plan, log payloads (no writes)
 *   ts-node packages/migration/src/scan-and-apply-article-moto-refs.ts
 *
 *   # Actually write (merge)
 *   ts-node packages/migration/src/scan-and-apply-article-moto-refs.ts --write
 *
 *   # Overwrite relations (set)
 *   ts-node packages/migration/src/scan-and-apply-article-moto-refs.ts --write --mode=set
 *
 *   # Only scan (no apply), pretty logs
 *   ts-node packages/migration/src/scan-and-apply-article-moto-refs.ts --scan-only
 *
 * Flags:
 *   --write        Persist changes (default: dry-run)
 *   --mode=set     set|merge (default: merge)
 *   --pagesize=NN  pagination size (default: 100)
 */

import 'dotenv/config';
import { createMoto125Api, Moto125Sdk, StrapiQueryParams } from '@moto125/api-client';

/* ------------------------------ Logging ---------------------------------- */

const log  = (...a: any[]) => console.log('[m125-migration]', ...a);
const warn = (...a: any[]) => console.warn('[m125-migration]', ...a);
const err  = (...a: any[]) => console.error('[m125-migration]', ...a);

/* ------------------------------ Env guard -------------------------------- */

function getEnv() {
  const { STRAPI_API_URL, STRAPI_API_TOKEN } = process.env;
  const missing: string[] = [];
  if (!STRAPI_API_URL) missing.push('STRAPI_API_URL');
  if (!STRAPI_API_TOKEN) missing.push('STRAPI_API_TOKEN');
  if (missing.length) throw new Error(`Missing env vars: ${missing.join(', ')}`);
  return { STRAPI_API_URL, STRAPI_API_TOKEN };
}

/* --------------------------- Markdown helpers ---------------------------- */

/** Strip <table>...</table> blocks if inner text contains "rivales directos". */
function stripDirectRivalsHtmlTables(md: string): string {
  return md.replace(/<table[\s\S]*?<\/table>/gi, (tbl) => {
    const txt = tbl.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').toLowerCase();
    return txt.includes('rivales directos') ? '' : tbl;
  });
}

/** Remove simple md formatting to simplify header matching. */
function stripMdFormatting(s: string): string {
  return s
    .replace(/`+/g, '')
    .replace(/\*\*/g, '')
    .replace(/__+/g, '')
    .replace(/<[^>]+>/g, '')
    .toLowerCase();
}

/** Drop GFM table when header mentions "rivales directos". */
function stripDirectRivalsGfmTables(md: string): string {
  const lines = md.split(/\r?\n/);
  const out: string[] = [];
  let i = 0;

  const isPipeRow = (line: string) => /^\s*\|.*\|\s*$/.test(line);
  const isSeparatorRow = (line: string) =>
    /^\s*\|?(?:\s*:?-{3,}:?\s*\|)+\s*(?:\s*:?-{3,}:?\s*)?\|?\s*$/.test(line);

  while (i < lines.length) {
    const line = lines[i];
    if (isPipeRow(line) && i + 1 < lines.length && isSeparatorRow(lines[i + 1])) {
      const headerText = stripMdFormatting(line);
      if (headerText.includes('rivales directos')) {
        i += 2;
        while (i < lines.length && isPipeRow(lines[i])) i++;
        if (i < lines.length && /^\s*$/.test(lines[i])) i++;
        continue;
      }
    }
    out.push(line);
    i++;
  }
  return out.join('\n');
}

/** Remove only tables whose header includes "Rivales directos". */
function stripDirectRivalsTablesOnly(md: string): string {
  let out = stripDirectRivalsHtmlTables(md);
  out = stripDirectRivalsGfmTables(out);
  return out;
}

/**
 * Extract Moto IDs from ".../images/stories/motos/m{ID}/file.jpg"
 * AFTER removing only "Rivales directos" tables. Ignores thumbnails ("t...").
 */
function extractMotoIdsFromMarkdown(md: string): string[] {
  const cleaned = stripDirectRivalsTablesOnly(md);
  const rx = /images\/stories\/motos\/m([1-9]\d*)\/(?!t)[^\/\s"'()<>]+/gi;
  const found = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = rx.exec(cleaned)) !== null) found.add(m[1]);
  return Array.from(found);
}

/* ------------------------------- Types ----------------------------------- */

type ArticleScanRow = {
  id: number;
  documentId: string;
  slug: string;
  title?: string | null;
  motoRefsCount: number;
  motoIds: string[];
  validMotoIds: string[];
  missingMotoIds: string[];
  relatedMotoDocIds?: string[];
  relatedCompanyDocIds?: string[];
};

type MotoResolved = {
  moto125Id: string;
  exists: boolean;
  docId?: string;
  name?: string;
  companyDocId?: string;
  companyName?: string;
};

type ApplyMode = 'set' | 'merge';

/* ---------------------------- SDK + Resolver ----------------------------- */

function createSdk(): Moto125Sdk {
  const { STRAPI_API_URL, STRAPI_API_TOKEN } = getEnv();
  return createMoto125Api({
    baseUrl: STRAPI_API_URL!,
    token: STRAPI_API_TOKEN!,
    queryDefaults: { publicationState: 'live', locale: 'es' },
  });
}

const motoCache = new Map<string, MotoResolved>();

/**
 * Resolve minimal moto + company (brand) info from moto125Id.
 * Requests only needed fields for performance.
 */
async function resolveMotoByMoto125Id(
  sdk: Moto125Sdk,
  moto125Id: string
): Promise<MotoResolved> {
  const cached = motoCache.get(moto125Id);
  if (cached) return cached;

  try {
    const res = await sdk.motos.getByMoto125Id(moto125Id, {
      fields: ['moto125Id', 'fullName', 'modelName', 'documentId'],
      pagination: { page: 1, pageSize: 1, withCount: false },
    });

    const row = res.data?.[0];
    const info: MotoResolved = row
      ? {
          exists: true,
          moto125Id,
          docId: row.documentId,
          name: (row.fullName ?? row.modelName ?? '').trim() || undefined,
          companyDocId: row.company?.documentId ?? undefined,
          companyName: row.company?.name ?? undefined,
        }
      : { exists: false, moto125Id };

    motoCache.set(moto125Id, info);
    return info;
  } catch {
    const info: MotoResolved = { exists: false, moto125Id };
    motoCache.set(moto125Id, info);
    return info;
  }
}

/* ------------------------------- Scanner --------------------------------- */

/**
 * Pull paginated articles and scan dynamic zone text blocks for moto refs.
 */
async function scanArticlesForMotoRefs(
  sdk: Moto125Sdk,
  pageSize = 100
): Promise<ArticleScanRow[]> {
  const basePopulate: StrapiQueryParams['populate'] = { content: { populate: '*' } };
  const rows: ArticleScanRow[] = [];

  log('Scanning articles for "images/stories/motos/m{ID}" references...');

  let page = 1;
  let pageCount = 1;

  while (page <= pageCount) {
    const res = await sdk.articles.list({
      populate: basePopulate,
      pagination: { page, pageSize, withCount: true },
      sort: ['publicationDate:desc', 'createdAt:desc'],
    });

    pageCount = res.meta.pagination?.pageCount ?? 1;

    for (const art of res.data) {
      const { id, documentId, slug, title } = art as any;
      const blocks = (art as any).content as any[] | undefined;
      const mdChunks: string[] = [];

      if (Array.isArray(blocks)) {
        for (const b of blocks) {
          if (b?.__component === 'article-content.text-content' && typeof b?.Text === 'string') {
            mdChunks.push(b.Text);
          }
        }
      }

      const uniqueMotoIds = new Set<string>();
      for (const md of mdChunks) {
        extractMotoIdsFromMarkdown(md).forEach((i) => uniqueMotoIds.add(i));
      }
      const motoIds = Array.from(uniqueMotoIds);

      rows.push({
        id, documentId, slug, title,
        motoRefsCount: motoIds.length,
        motoIds,
        validMotoIds: [],
        missingMotoIds: [],
      });
    }

    page++;
  }

  return rows;
}

/* ------------------------------ Planner ---------------------------------- */

function prettyRelations(r: ArticleScanRow): string {
  const motos = (r.relatedMotoDocIds ?? []).length;
  const brands = (r.relatedCompanyDocIds ?? []).length;
  const missing = r.missingMotoIds.length;
  return `motos=${motos}, brands=${brands}${missing ? `, missing=[${r.missingMotoIds.join(', ')}]` : ''}`;
}

/**
 * Resolve motos & derive final relatedMotos/relatedCompanies docId lists per article.
 * Mutates each row (fills valid/missing/related arrays).
 */
async function planArticleRelations(
  sdk: Moto125Sdk,
  rows: ArticleScanRow[]
): Promise<void> {
  for (const r of rows) {
    if (r.motoIds.length === 0) {
      r.validMotoIds = [];
      r.missingMotoIds = [];
      r.relatedMotoDocIds = [];
      r.relatedCompanyDocIds = [];
      continue;
    }

    const infos = await Promise.all(r.motoIds.map((mid) => resolveMotoByMoto125Id(sdk, mid)));
    r.validMotoIds = infos.filter(i => i.exists).map(i => i.moto125Id);
    r.missingMotoIds = infos.filter(i => !i.exists).map(i => i.moto125Id);
    r.relatedMotoDocIds = Array.from(new Set(infos.filter(i => i.exists && i.docId).map(i => i.docId!)));
    r.relatedCompanyDocIds = Array.from(new Set(infos.filter(i => i.companyDocId).map(i => i.companyDocId!)));
  }
}

/* ------------------------------- Updater --------------------------------- */

async function buildRelationPayloads(
  sdk: Moto125Sdk,
  row: ArticleScanRow,
  mode: ApplyMode
): Promise<{ relatedMotos?: { set: string[] }, relatedCompanies?: { set: string[] } }> {
  const derivedMotos = Array.from(new Set(row.relatedMotoDocIds ?? []));
  const derivedCompanies = Array.from(new Set(row.relatedCompanyDocIds ?? []));

  if (mode === 'set') {
    return {
      relatedMotos: { set: derivedMotos },
      relatedCompanies: { set: derivedCompanies },
    };
  }

  // merge → union with current relations
  const current = await sdk.articles.getById(row.documentId, {
    fields: ['documentId', 'slug'],
  });

  const curMotos = (current.data?.relatedMotos ?? []).map((m: any) => m.documentId);
  const curCompanies = (current.data?.relatedCompanies ?? []).map((c: any) => c.documentId);

  return {
    relatedMotos: { set: Array.from(new Set([...curMotos, ...derivedMotos])) },
    relatedCompanies: { set: Array.from(new Set([...curCompanies, ...derivedCompanies])) },
  };
}

type UpdateCounters = { updated: number; skipped: number; failed: number };

async function applyArticleRelations(
  sdk: Moto125Sdk,
  rows: ArticleScanRow[],
  mode: ApplyMode,
  dryRun: boolean
): Promise<UpdateCounters> {
  const counters: UpdateCounters = { updated: 0, skipped: 0, failed: 0 };

  for (const r of rows) {
    const payload = await buildRelationPayloads(sdk, r, mode);

    const willWrite =
      (payload.relatedMotos && payload.relatedMotos.set.length > 0) ||
      (payload.relatedCompanies && payload.relatedCompanies.set.length > 0);

    if (!willWrite && mode === 'merge') {
      counters.skipped++;
      log(`SKIP ${r.slug} → nothing to merge`);
      continue;
    }

    if (dryRun) {
      log(`DRY-RUN ${r.slug} → update`, JSON.stringify(payload));
      counters.updated++;
      continue;
    }

    try {
      await sdk.articles.update(r.documentId, payload);
      log(`OK ${r.slug} updated.`);
      counters.updated++;
    } catch (e: any) {
      counters.failed++;
      err(`FAIL ${r.slug}: ${e?.message ?? e}`);
    }
  }

  return counters;
}

/* --------------------------------- CLI ----------------------------------- */

function parseArgs(argv: string[]) {
  const args = new Map<string, string | boolean>();
  argv.forEach((a) => {
    const [k, v] = a.includes('=') ? a.split('=') : [a, 'true'];
    args.set(k.replace(/^--/, ''), v === 'true' ? true : v);
  });
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const dryRun = false;
  const mode = (args.get('mode') as ApplyMode) ?? 'merge';
  const pageSize = Number(args.get('pagesize') ?? 100);
  const scanOnly = !!args.get('scan-only');

  const sdk = createSdk();

  // 1) Scan
  const rows = await scanArticlesForMotoRefs(sdk, pageSize);

  // 2) Plan
  await planArticleRelations(sdk, rows);

  // Stats + pretty line per article with refs
  let totalRefs = 0;
  let withRefs = 0;
  const missingSet = new Set<string>();
  for (const r of rows) {
    totalRefs += r.motoRefsCount;
    if (r.motoRefsCount > 0) withRefs++;
    r.missingMotoIds.forEach(m => missingSet.add(m));
    if (r.motoRefsCount > 0) {
      log(`[${r.slug}] refs=${r.motoRefsCount} → ${prettyRelations(r)}`);
    }
  }
  log('--------------------------------------------');
  log(`Scanned articles: ${rows.length}`);
  log(`Articles with references: ${withRefs}`);
  log(`Total references found: ${totalRefs}`);
  if (missingSet.size) log(`Missing in catalog: ${Array.from(missingSet).join(', ')}`);

  if (scanOnly) {
    log('Scan-only mode. No updates performed.');
    return;
  }

  // 3) Apply (only candidates with something to do)
  const candidates = rows.filter(r =>
    (r.motoRefsCount > 0) ||
    ((r.relatedMotoDocIds?.length ?? 0) > 0) ||
    ((r.relatedCompanyDocIds?.length ?? 0) > 0)
  );

  const { updated, skipped, failed } = await applyArticleRelations(sdk, candidates, mode, dryRun);
  log(`Done. updated=${updated} skipped=${skipped} failed=${failed} (mode=${mode}, dryRun=${dryRun})`);
}

main().catch((e) => {
  err(e);
  process.exit(1);
});
