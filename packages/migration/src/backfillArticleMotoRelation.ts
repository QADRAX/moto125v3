import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const { STRAPI_API_URL, STRAPI_API_TOKEN } = process.env;

const contentApi = axios.create({
  baseURL: STRAPI_API_URL,
  headers: { Authorization: `Bearer ${STRAPI_API_TOKEN}` },
  timeout: 60_000,
});

function log(...args: any[]) {
  console.log("[backfill-article-motos]", ...args);
}
function warn(...args: any[]) {
  console.warn("[backfill-article-motos]", ...args);
}
function error(...args: any[]) {
  console.error("[backfill-article-motos]", ...args);
}

function describeAxiosError(err: any): string {
  if (err?.response) {
    const { status, statusText, data } = err.response;
    const body = typeof data === "string" ? data : JSON.stringify(data);
    return `HTTP ${status} ${statusText ?? ""} ${body}`;
  }
  return err?.message ?? String(err);
}

function guardEnv() {
  const missing: string[] = [];
  if (!STRAPI_API_URL) missing.push("STRAPI_API_URL");
  if (!STRAPI_API_TOKEN) missing.push("STRAPI_API_TOKEN");
  if (missing.length)
    throw new Error(`Missing env vars: ${missing.join(", ")}`);
  log(`Env OK (url=${new URL(STRAPI_API_URL!).origin})`);
}

/* ----------------------------- Tipos mínimos ----------------------------- */
type StrapiList<T> = { data: Array<{ id: number; attributes: T }>; meta?: any };
type StrapiEntity<T> = { data: { id: number; attributes: T } };

type MotoAttrs = {
  moto125Id: string;
};

type ArticleAttrs = {
  slug: string;
  content: any[]; // dynamic zone
  relatedMotos?: { data: Array<{ id: number }> };
};

type MotoMap = Map<string, number>; // moto125Id -> motoId

/* ----------------------------- Utilidades ----------------------------- */

// Recorre deep cualquier valor y devuelve todas las cadenas encontradas
function collectStringsDeep(input: any): string[] {
  const out: string[] = [];
  const visit = (v: any) => {
    if (v == null) return;
    const t = typeof v;
    if (t === "string") {
      out.push(v);
      return;
    }
    if (Array.isArray(v)) {
      v.forEach(visit);
      return;
    }
    if (t === "object") {
      for (const key of Object.keys(v)) visit(v[key]);
    }
  };
  visit(input);
  return out;
}

// Extrae todos los moto125Id encontrados en una cadena (o conjunto de cadenas)
function extractMotoIdsFromStrings(chunks: string[]): string[] {
  const set = new Set<string>();
  const re = /\/images\/stories\/motos\/m(\d+)\//gi; // captura el número tras 'm'
  for (const s of chunks) {
    if (!s || typeof s !== "string") continue;
    let m: RegExpExecArray | null;
    while ((m = re.exec(s)) !== null) {
      set.add(m[1]); // sólo los dígitos
    }
  }
  return [...set];
}

// Igualdad de conjuntos numéricos
function equalIdSets(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const A = new Set(a);
  for (const x of b) if (!A.has(x)) return false;
  return true;
}

/* ----------------------------- Carga masiva ----------------------------- */

// Carga TODAS las motos (id + moto125Id) y construye el mapa moto125Id -> id
async function buildMotoMap(): Promise<MotoMap> {
  const map: MotoMap = new Map();
  let page = 1;
  const pageSize = 200;

  while (true) {
    const res = await contentApi.get<StrapiList<MotoAttrs>>(`/api/motos`, {
      params: {
        "pagination[page]": page,
        "pagination[pageSize]": pageSize,
        "fields[0]": "moto125Id",
      },
    });

    const rows = res.data?.data ?? [];
    for (const row of rows) {
      const id = row.id;
      const moto125Id = String(row.attributes?.moto125Id ?? "").trim();
      if (moto125Id) map.set(moto125Id, id);
    }

    if (rows.length < pageSize) break;
    page++;
  }

  log(`Motos cargadas: ${map.size}`);
  return map;
}

// Carga artículos paginando, con content y relatedMotos
async function* iterateArticles(batchSize = 100) {
  let page = 1;
  while (true) {
    const res = await contentApi.get<StrapiList<ArticleAttrs>>(
      `/api/articles`,
      {
        params: {
          "pagination[page]": page,
          "pagination[pageSize]": batchSize,
          "fields[0]": "slug",
          "populate[content]": "*,images", // intenta popular bloques comunes
          "populate[relatedMotos]": "true", // necesitamos ids existentes
        },
      }
    );

    const rows = res.data?.data ?? [];
    if (!rows.length) return;

    for (const row of rows) yield row;

    if (rows.length < batchSize) return;
    page++;
  }
}

/* ----------------------------- Update helper ----------------------------- */

async function updateArticleRelatedMotos(
  articleId: number,
  motoIds: number[]
): Promise<void> {
  await contentApi.put<StrapiEntity<ArticleAttrs>>(
    `/api/articles/${articleId}`,
    {
      data: { relatedMotos: motoIds },
    }
  );
}

/* ----------------------------- Runner principal ----------------------------- */

export async function backfillArticleMotoRelations(): Promise<void> {
  guardEnv();

  const motoMap = await buildMotoMap();
  let processed = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for await (const row of iterateArticles(100)) {
    const articleId = row.id;
    const slug = row.attributes?.slug ?? `id-${articleId}`;
    const prefix = `[${slug}]`;

    try {
      // 1) reunir todas las cadenas de la dynamic zone
      const content = row.attributes?.content ?? [];
      const strings = collectStringsDeep(content);

      // 2) extraer mIDs
      const moto125Ids = extractMotoIdsFromStrings(strings);
      if (moto125Ids.length === 0) {
        // Nada que vincular
        skipped++;
        continue;
      }

      // 3) pasar a ids de moto existentes en Strapi
      const foundMotoIds = moto125Ids
        .map((mid) => motoMap.get(mid))
        .filter((v): v is number => typeof v === "number");

      if (foundMotoIds.length === 0) {
        warn(
          `${prefix} encontró carpetas m{ID} en contenido, pero ninguna existe en Motos:`,
          moto125Ids.join(",")
        );
        skipped++;
        continue;
      }

      // 4) merge con relaciones actuales
      const existing = (row.attributes?.relatedMotos?.data ?? []).map(
        (d) => d.id
      );
      const mergedSet = Array.from(
        new Set([...existing, ...foundMotoIds])
      ).sort((a, b) => a - b);

      if (equalIdSets(existing, mergedSet)) {
        // Sin cambios
        skipped++;
        continue;
      }

      await updateArticleRelatedMotos(articleId, mergedSet);
      log(
        `${prefix} actualizado relatedMotos: ${
          existing.join(",") || "(vacío)"
        } -> ${mergedSet.join(",")}`
      );
      updated++;
    } catch (e) {
      error(`${prefix} fallo: ${describeAxiosError(e)}`);
      errors++;
    } finally {
      processed++;
      if (processed % 50 === 0) {
        log(
          `Progreso: procesados=${processed}, actualizados=${updated}, skip=${skipped}, errores=${errors}`
        );
      }
    }
  }

  log(
    `FIN — procesados=${processed}, actualizados=${updated}, skip=${skipped}, errores=${errors}`
  );
}
