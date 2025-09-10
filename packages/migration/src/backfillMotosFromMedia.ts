import 'dotenv/config';
import {
  ApiClient,
  toQueryString,
  getMotoByMoto125Id,
  createMoto,
} from '@moto125/api-client';

const { STRAPI_API_URL, STRAPI_API_TOKEN, STRAPI_ADMIN_TOKEN } = process.env;

const ROOT_PATH = 'images/stories/motos';

function log(...args: any[])   { console.log('[backfill-motos]', ...args); }
function warn(...args: any[])  { console.warn('[backfill-motos]', ...args); }
function errorLog(...args: any[]) { console.error('[backfill-motos]', ...args); }

function guardEnv() {
  const missing: string[] = [];
  if (!STRAPI_API_URL) missing.push('STRAPI_API_URL');
  if (!STRAPI_API_TOKEN) missing.push('STRAPI_API_TOKEN');
  if (!STRAPI_ADMIN_TOKEN) missing.push('STRAPI_ADMIN_TOKEN');
  if (missing.length) throw new Error(`Missing env vars: ${missing.join(', ')}`);
  log(`Env OK (url=${new URL(STRAPI_API_URL!).origin})`);
}

// Content API (roles/permissions) → crear contenido (motos)
const contentApi = new ApiClient({
  baseUrl: STRAPI_API_URL!,
  token: STRAPI_API_TOKEN || undefined,
});
// Admin API (para listar Upload folders/files con facilidad)
const adminApi = new ApiClient({
  baseUrl: STRAPI_API_URL!,
  token: STRAPI_ADMIN_TOKEN || undefined,
});

type Folder = { id: number; name: string; parent?: number | null };
type FileItem = {
  id: number;
  name: string;
  folder?: number | null;
  mime?: string;
  ext?: string;
  size?: number;
};

/** Strapi Upload puede devolver {data: [...]}, {results: [...]}, o un array plano */
function normalizeList(res: any): any[] {
  if (!res) return [];
  const d = (res as any).data ?? (res as any).results ?? res;
  return Array.isArray(d) ? d : [];
}

/* -------------------- Helpers Upload (con @moto125/api-client) -------------------- */

async function getChildFolderByName(parentId: number | null, name: string): Promise<Folder | null> {
  const params: Record<string, any> = {
    'filters[name][$eq]': name,
    'pagination[pageSize]': 1,
  };
  if (parentId === null) params['filters[parent][id][$null]'] = true;
  else params['filters[parent][id][$eq]'] = parentId;

  const qs = toQueryString(params);
  const res = await adminApi.get<any>(`/upload/folders`, qs);
  const arr = normalizeList(res);
  const f = arr[0];
  return f ? { id: f.id, name: f.name, parent: f.parent?.id ?? null } : null;
}

/** Resuelve un path tipo "images/stories/motos" a un folder id. */
async function getFolderIdByPath(pathStr: string): Promise<number> {
  const segments = pathStr.split(/[\\/]/).filter(Boolean);
  let parentId: number | null = null;
  for (const segment of segments) {
    const f = await getChildFolderByName(parentId, segment);
    if (!f) {
      throw new Error(`Folder segment not found: "${segment}" (parent=${parentId ?? 'root'})`);
    }
    parentId = f.id;
  }
  if (parentId == null) throw new Error(`Could not resolve path "${pathStr}"`);
  return parentId;
}

/** Lista TODAS las subcarpetas directas de un folder. */
async function listChildFolders(parentId: number): Promise<Folder[]> {
  const params: Record<string, any> = {
    'filters[parent][id][$eq]': parentId,
    sort: 'name:asc',
  };
  const qs = toQueryString(params);
  const res = await adminApi.get<any>(`/upload/folders`, qs);
  const arr = normalizeList(res);
  return arr.map((f: any) => ({ id: f.id, name: f.name, parent: f.parent?.id ?? null }));
}

/** Lista TODOS los ficheros de un folder (paginando de 200 en 200). */
async function listFilesInFolder(folderId: number): Promise<FileItem[]> {
  const out: FileItem[] = [];
  let page = 1;
  while (true) {
    const params: Record<string, any> = {
      'filters[folder][id][$eq]': folderId,
      'pagination[page]': page,
      'pagination[pageSize]': 200,
      sort: 'name:asc',
    };
    const qs = toQueryString(params);
    const res = await adminApi.get<any>(`/upload/files`, qs);
    const arr = normalizeList(res);
    if (!arr.length) break;
    for (const f of arr) {
      out.push({
        id: f.id,
        name: f.name,
        folder: f.folder?.id ?? null,
        mime: f.mime,
        ext: f.ext,
        size: f.size,
      });
    }
    if (arr.length < 200) break;
    page++;
  }
  return out;
}

/* -------------------- Helpers Content API (motos) -------------------- */

/** ¿Existe ya una moto con ese moto125Id? (usa el wrapper tipado) */
async function findMotoByMoto125Id(moto125Id: string) {
  const res = await getMotoByMoto125Id(contentApi, moto125Id, {
    // pedimos lo básico; documentId viene igualmente
    pagination: { page: 1, pageSize: 1, withCount: false },
  });
  return res.data?.[0] ?? null;
}

/** Crea una moto mínima (draft by default) con moto125Id, modelName e imágenes. */
async function createMotoMinimal(moto125Id: string, imageIds: number) {
  // @moto125/api-client ya tipa el payload (MotoCreateInput)
  return createMoto(contentApi, {
    moto125Id,
    modelName: `m${moto125Id}`, // requerido por tu schema
    fullName: null,
    description: null,
    images: Array.isArray(imageIds) ? imageIds : (imageIds ? [imageIds] : []),
    active: true,
    // company, motoType, priece, fichaTecnica => omitidos
  });
}

/* ------------------------------ Main runner ------------------------------ */

async function main() {
  guardEnv();

  log(`Resolviendo carpeta base: ${ROOT_PATH}`);
  const baseFolderId = await getFolderIdByPath(ROOT_PATH);
  log(`Carpeta base id=${baseFolderId}`);

  const childFolders = await listChildFolders(baseFolderId);
  log(`Carpetas hijas encontradas: ${childFolders.length}`);

  const motoFolders = childFolders.filter((f) => /^m\d+$/i.test(f.name));
  log(`Carpetas con patrón m{ID}: ${motoFolders.length}`);

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const folder of motoFolders) {
    const m = /^m(\d+)$/i.exec(folder.name);
    if (!m) continue;
    const moto125Id = m[1];
    if (moto125Id === '0') continue;

    const prefix = `[m${moto125Id}]`;

    try {
      // 1) ¿Existe ya?
      const existing = await findMotoByMoto125Id(moto125Id);
      if (existing) {
        log(`${prefix} ya existe (docId=${existing.documentId}, id=${existing.id}). Skip.`);
        skipped++;
        continue;
      }

      // 2) Ficheros del folder → IDs de media
      const files = await listFilesInFolder(folder.id);
      const imageIds = files.map((f) => f.id);
      if (imageIds.length === 0) {
        warn(`${prefix} sin ficheros en carpeta id=${folder.id}. Se crea sin imágenes.`);
      } else {
        log(`${prefix} ficheros detectados: ${imageIds.length}`);
      }

      // 3) Crear moto mínima
      const createdRes = await createMoto(contentApi, {
        moto125Id,
        modelName: `m${moto125Id}`,
        fullName: null,
        description: null,
        images: imageIds,
        active: true,
      });

      const createdMoto = createdRes.data!;
      log(`${prefix} moto creada docId=${createdMoto.documentId} (id=${createdMoto.id})`);
      created++;
    } catch (e: any) {
      const msg = e?.response
        ? `HTTP ${e.response.status} ${e.response.statusText ?? ''} ${JSON.stringify(e.response.data)}`
        : (e?.message ?? String(e));
      errorLog(`${prefix} fallo: ${msg}`);
      errors++;
    }
  }

  log(`FIN — creadas=${created}, ya existentes=${skipped}, errores=${errors}`);
}

main().catch((e) => {
  errorLog(e);
  process.exit(1);
});
