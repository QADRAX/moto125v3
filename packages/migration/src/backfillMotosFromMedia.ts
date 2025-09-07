import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const { STRAPI_API_URL, STRAPI_API_TOKEN, STRAPI_ADMIN_TOKEN } = process.env;

const ROOT_PATH = "images/stories/motos"; // ruta en Media Library desde root

// Axios
const admin = axios.create({
  baseURL: STRAPI_API_URL,
  headers: { Authorization: `Bearer ${STRAPI_ADMIN_TOKEN}` },
  timeout: 60_000,
});
const contentApi = axios.create({
  baseURL: STRAPI_API_URL,
  headers: { Authorization: `Bearer ${STRAPI_API_TOKEN}` },
  timeout: 60_000,
});

function log(...args: any[]) {
  console.log("[backfill-motos]", ...args);
}
function warn(...args: any[]) {
  console.warn("[backfill-motos]", ...args);
}
function error(...args: any[]) {
  console.error("[backfill-motos]", ...args);
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
  if (!STRAPI_ADMIN_TOKEN) missing.push("STRAPI_ADMIN_TOKEN");
  if (missing.length) {
    throw new Error(`Missing env vars: ${missing.join(", ")}`);
  }
  log(`Env OK (url=${new URL(STRAPI_API_URL!).origin})`);
}

/* -------------------- Helpers Strapi Upload (Admin) -------------------- */

type Folder = { id: number; name: string; parent?: number | null };
type FileItem = {
  id: number;
  name: string;
  folder?: number | null;
  mime?: string;
  ext?: string;
  size?: number;
};

function normalizeList(res: any): any[] {
  const d = res?.data;
  if (!d) return [];
  // Strapi puede devolver { data: [...] } o { results: [...] } o directamente array
  if (Array.isArray(d.data)) return d.data;
  if (Array.isArray(d.results)) return d.results;
  if (Array.isArray(d)) return d;
  return [];
}

async function getChildFolderByName(
  parentId: number | null,
  name: string
): Promise<Folder | null> {
  const params: any = {
    "filters[name][$eq]": name,
    "pagination[pageSize]": 1,
  };
  if (parentId === null) params["filters[parent][id][$null]"] = true;
  else params["filters[parent][id][$eq]"] = parentId;

  const res = await admin.get(`/upload/folders`, { params });
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
    if (!f)
      throw new Error(
        `Folder segment not found: "${segment}" (parent=${parentId ?? "root"})`
      );
    parentId = f.id;
  }
  if (parentId == null) throw new Error(`Could not resolve path "${pathStr}"`);
  return parentId;
}

/** Lista TODAS las subcarpetas directas de un folder. */
async function listChildFolders(parentId: number): Promise<Folder[]> {
  const out: Folder[] = [];
  const params: any = {
    "filters[parent][id][$eq]": parentId,
    sort: "name:asc",
  };
  const res = await admin.get(`/upload/folders`, { params });
  const arr = normalizeList(res);
  for (const f of arr) {
    out.push({ id: f.id, name: f.name, parent: f.parent?.id ?? null });
  }
  return out;
}

/** Lista TODOS los ficheros de un folder (paginando). */
async function listFilesInFolder(folderId: number): Promise<FileItem[]> {
  const out: FileItem[] = [];
  let page = 1;
  while (true) {
    const params: any = {
      "filters[folder][id][$eq]": folderId,
      "pagination[page]": page,
      "pagination[pageSize]": 200,
      sort: "name:asc",
    };
    const res = await admin.get(`/upload/files`, { params });
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

/* ------------------------ Helpers Strapi Content API ------------------------ */

async function findMotoIdByMoto125Id(
  moto125Id: string
): Promise<number | null> {
  const res = await contentApi.get(`/api/motos`, {
    params: {
      "filters[moto125Id][$eq]": moto125Id,
      "pagination[pageSize]": 1,
      fields: ["id", "moto125Id"],
    },
  });
  const row = res.data?.data?.[0];
  return row?.id ?? null;
}

/** Crea una moto mínima (draft) con moto125Id, modelName y images. */
async function createMotoMinimal(
  moto125Id: string,
  imageIds: number[]
): Promise<number> {
  const payload: any = {
    moto125Id,
    modelName: `m${moto125Id}`, // requerido por schema
    fullName: null,
    description: null,
    images: imageIds,
    active: true, // tu schema por defecto ya lo pone a true; lo explicitamos
    // company, motoType, priece, fichaTecnica quedan vacíos
    // publishedAt: null => queda en Draft (omitido)
  };

  const res = await contentApi.post(`/api/motos`, { data: payload });
  const id = res.data?.data?.id ?? res.data?.id;
  if (!id)
    throw new Error(`Moto creation returned no id for moto125Id=${moto125Id}`);
  return id;
}

/* ------------------------------ Main runner ------------------------------ */

export async function backfillMotosFromMedia(): Promise<void> {
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
    const moto125Id = m[1]; // sólo los dígitos
    if(moto125Id == "0") continue;
    
    const prefix = `[m${moto125Id}]`;

    try {
      // ¿existe ya una moto con ese moto125Id?
      const existingId = await findMotoIdByMoto125Id(moto125Id);
      if (existingId) {
        log(`${prefix} ya existe moto id=${existingId}. Skip.`);
        skipped++;
        continue;
      }

      // listar ficheros del folder
      const files = await listFilesInFolder(folder.id);
      const imageIds = files.map((f) => f.id);
      if (imageIds.length === 0) {
        warn(
          `${prefix} no tiene ficheros en la carpeta id=${folder.id}. Se crea igualmente sin imágenes.`
        );
      } else {
        log(`${prefix} ficheros detectados: ${imageIds.length}`);
      }

      const newId = await createMotoMinimal(moto125Id, imageIds);
      log(`${prefix} moto creada id=${newId}`);
      created++;
    } catch (e) {
      error(`${prefix} fallo: ${describeAxiosError(e)}`);
      errors++;
    }
  }

  log(`FIN — creadas=${created}, ya existentes=${skipped}, errores=${errors}`);
}
