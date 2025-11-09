import 'dotenv/config';
import {
  createMoto125Api,
  Moto125Sdk,
  StrapiQueryParams
} from '@moto125/api-client';

const { STRAPI_API_URL, STRAPI_API_TOKEN } = process.env;

/** Lightweight logger helpers */
function log(...args: any[]) { console.log('[scan-article-moto-refs]', ...args); }
function err(...args: any[]) { console.error('[scan-article-moto-refs]', ...args); }

/** Guard required env vars */
function guardEnv() {
  const missing: string[] = [];
  if (!STRAPI_API_URL) missing.push('STRAPI_API_URL');
  if (!STRAPI_API_TOKEN) missing.push('STRAPI_API_TOKEN');
  if (missing.length) throw new Error(`Missing env vars: ${missing.join(', ')}`);
}

/** Remove only tables whose header includes "Rivales directos" (case-insensitive). */
function stripDirectRivalsTablesOnly(md: string): string {
  let out = stripDirectRivalsHtmlTables(md);
  out = stripDirectRivalsGfmTables(out);
  return out;
}

/** Strip <table>...</table> blocks if their inner text contains "rivales directos". */
function stripDirectRivalsHtmlTables(md: string): string {
  return md.replace(/<table[\s\S]*?<\/table>/gi, (tbl) => {
    const txt = tbl
      .replace(/<[^>]+>/g, ' ')   // drop HTML tags
      .replace(/\s+/g, ' ')
      .toLowerCase();
    return txt.includes('rivales directos') ? '' : tbl;
  });
}

/** Utility: remove simple markdown formatting to simplify header matching. */
function stripMdFormatting(s: string): string {
  return s
    .replace(/`+/g, '')
    .replace(/\*\*/g, '')
    .replace(/__+/g, '')
    .replace(/<[^>]+>/g, '') // residual HTML
    .toLowerCase();
}

/** GFM tables: detect header row + separator; drop the whole table iff header mentions "rivales directos". */
function stripDirectRivalsGfmTables(md: string): string {
  const lines = md.split(/\r?\n/);
  const out: string[] = [];
  let i = 0;

  const isPipeRow = (line: string) => /^\s*\|.*\|\s*$/.test(line);
  const isSeparatorRow = (line: string) =>
    /^\s*\|?(?:\s*:?-{3,}:?\s*\|)+\s*(?:\s*:?-{3,}:?\s*)?\|?\s*$/.test(line);

  while (i < lines.length) {
    const line = lines[i];

    // potential table header?
    if (isPipeRow(line) && i + 1 < lines.length && isSeparatorRow(lines[i + 1])) {
      const headerText = stripMdFormatting(line);
      if (headerText.includes('rivales directos')) {
        // skip header + separator + all following table rows
        i += 2;
        while (i < lines.length && isPipeRow(lines[i])) i++;
        if (i < lines.length && /^\s*$/.test(lines[i])) i++; // swallow one trailing blank line
        continue; // do not push any of these lines
      }
    }

    out.push(line);
    i++;
  }

  return out.join('\n');
}

/**
 * Extract Moto IDs from legacy paths like ".../images/stories/motos/m{ID}/file.jpg"
 * AFTER removing only "Rivales directos" tables to avoid false positives.
 * Ignores thumbnails whose filename starts with "t" right after the m{ID}/ segment.
 */
function extractMotoIdsFromMarkdown(md: string): string[] {
  const cleaned = stripDirectRivalsTablesOnly(md);

  // Matches: images/stories/motos/m{ID}/<filename>
  // but IGNORES when <filename> starts with "t" (e.g., t000.jpg)
  // Explanation:
  //  - capture group 1 = moto ID (no leading zero)
  //  - after m{ID}/ we assert next path segment DOES NOT start with "t"
  //  - stops matching at next slash/space/quote/paren to avoid over-capture
  const rx = /images\/stories\/motos\/m([1-9]\d*)\/(?!t)[^\/\s"'()<>]+/gi;

  const found = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = rx.exec(cleaned)) !== null) {
    found.add(m[1]);
  }
  return Array.from(found);
}

type ArticleRow = {
  id: number;
  documentId: string;
  slug: string;
  title?: string | null;
  motoRefsCount: number;
  motoIds: string[];
  validMotoIds: string[];
  missingMotoIds: string[];
};

type MotoInfo = { exists: boolean; moto125Id: string; name?: string };

/** Cache moto lookups by moto125Id to avoid repeated HTTP calls */
const motoCache = new Map<string, MotoInfo>();

/**
 * Resolve minimal info about a Moto by its moto125Id using the SDK.
 * We override populate to [] and request only a few scalar fields.
 */
async function resolveMotoInfo(
  sdk: Moto125Sdk,
  moto125Id: string
): Promise<MotoInfo> {
  const cached = motoCache.get(moto125Id);
  if (cached) return cached;

  try {
    const res = await sdk.motos.getByMoto125Id(moto125Id, {
      fields: ['moto125Id', 'modelName', 'fullName'],
      populate: [],
      pagination: { page: 1, pageSize: 1, withCount: false },
    });

    const row = res.data?.[0];
    const info: MotoInfo = row
      ? {
          exists: true,
          moto125Id,
          name: (row.fullName ?? row.modelName ?? '').trim() || undefined,
        }
      : { exists: false, moto125Id };

    motoCache.set(moto125Id, info);
    return info;
  } catch {
    const info: MotoInfo = { exists: false, moto125Id };
    motoCache.set(moto125Id, info);
    return info;
  }
}

async function main() {
  guardEnv();

  /** Build the SDK with convenient query defaults */
  const sdk = createMoto125Api({
    baseUrl: STRAPI_API_URL!,
    token: STRAPI_API_TOKEN!,
    queryDefaults: {
      publicationState: 'live',
      locale: 'es',
    },
  });

  const pageSize = 100;
  let page = 1;
  let pageCount = 1;

  const report: ArticleRow[] = [];

  /** We only need the Dynamic Zone content */
  const basePopulate: StrapiQueryParams['populate'] = {
    content: { populate: '*' },
  };

  log('Scanning articles for "images/stories/motos/m{ID}" references...');

  while (page <= pageCount) {
    const res = await sdk.articles.list({
      populate: basePopulate,
      pagination: { page, pageSize, withCount: true },
      sort: ['publicationDate:desc', 'createdAt:desc'],
    });

    pageCount = res.meta.pagination?.pageCount ?? 1;

    for (const art of res.data) {
      const { id, documentId, slug, title } = art;

      // content is a Dynamic Zone. Extract markdown/text from text-content blocks
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

      // Validate against catalog
      const infos = await Promise.all(motoIds.map((mid) => resolveMotoInfo(sdk, mid)));
      const validMotoIds = infos.filter((i) => i.exists).map((i) => i.moto125Id);
      const missingMotoIds = infos.filter((i) => !i.exists).map((i) => i.moto125Id);

      report.push({
        id,
        documentId,
        slug,
        title,
        motoRefsCount: motoIds.length,
        motoIds,
        validMotoIds,
        missingMotoIds,
      });

      if (motoIds.length > 0) {
        const pretty = infos
          .map((i) => (i.exists ? `${i.moto125Id}: "${i.name ?? 'no name?'}"` : `${i.moto125Id}: <missing>`))
          .join(', ');

        log(`[${(art as any).publicationDate ?? ''}] Article (${slug}) → ${motoIds.length} refs — ${pretty}`);

        if (missingMotoIds.length) {
          log(
            `[${(art as any).publicationDate ?? ''}] Article (${slug}) -> ⚠️ missing in catalog: [${missingMotoIds.join(', ')}]`
          );
        }
      }
    }

    page++;
  }

  // Final summary
  const total = report.length;
  const withRefs = report.filter((r) => r.motoRefsCount > 0).length;
  const totalRefs = report.reduce((acc, r) => acc + r.motoRefsCount, 0);
  const missingSet = new Set<string>();
  report.forEach((r) => r.missingMotoIds.forEach((m) => missingSet.add(m)));

  log('--------------------------------------------');
  log(`Scanned articles: ${total}`);
  log(`Articles with references: ${withRefs}`);
  log(`Total references found: ${totalRefs}`);
  if (missingSet.size) {
    log(`Referenced Moto IDs not found in catalog: ${Array.from(missingSet).join(', ')}`);
  }

  // Top articles by number of references
  const top = [...report]
    .filter((r) => r.motoRefsCount > 0)
    .sort((a, b) => b.motoRefsCount - a.motoRefsCount)
    .slice(0, 20);

  if (top.length) {
    log('Top articles by referenced motos count:');
    for (const r of top) {
      log(`- ${r.motoRefsCount} → ${r.slug} (id=${r.id})  [${r.motoIds.join(', ')}]`);
    }
  }

  // Optional export:
  // import { writeFileSync } from 'node:fs';
  // writeFileSync('moto-refs-report.json', JSON.stringify(report, null, 2), 'utf8');
}

main().catch((e) => {
  err(e);
  process.exit(1);
});
