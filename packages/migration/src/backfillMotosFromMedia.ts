import "dotenv/config";
import { createMoto125Api } from "@moto125/api-client";
import { StrapiAdminHttp, MediaLibrary } from "@moto125/admin-api-client";

const {
  STRAPI_API_URL,
  STRAPI_API_TOKEN,
  STRAPI_ADMIN_EMAIL,
  STRAPI_ADMIN_PASSWORD,
} = process.env;

const ROOT_PATH = "images/stories/motos";

function log(...args: any[]) {
  console.log("[backfill-motos]", ...args);
}
function warn(...args: any[]) {
  console.warn("[backfill-motos]", ...args);
}
function errorLog(...args: any[]) {
  console.error("[backfill-motos]", ...args);
}

function guardEnv() {
  const missing: string[] = [];
  if (!STRAPI_API_URL) missing.push("STRAPI_API_URL");
  if (!STRAPI_API_TOKEN) missing.push("STRAPI_API_TOKEN");
  if (!STRAPI_ADMIN_EMAIL) missing.push("STRAPI_ADMIN_EMAIL");
  if (!STRAPI_ADMIN_PASSWORD) missing.push("STRAPI_ADMIN_PASSWORD");
  if (missing.length)
    throw new Error(`Missing env vars: ${missing.join(", ")}`);
  log(`Env OK (url=${new URL(STRAPI_API_URL!).origin})`);
}

// Content API via SDK (crear/consultar motos)
const sdk = createMoto125Api({
  baseUrl: STRAPI_API_URL!,
  token: STRAPI_API_TOKEN!,
  queryDefaults: {
    publicationState: "live",
    locale: "es",
  },
});

// Admin API (Media Library con login email+password)
const adminHttp = new StrapiAdminHttp({
  baseURL: STRAPI_API_URL!,
  email: STRAPI_ADMIN_EMAIL!,
  password: STRAPI_ADMIN_PASSWORD!,
});
const media = new MediaLibrary(adminHttp);

/* -------------------- Helpers Content API (motos) -------------------- */

async function findMotoByMoto125Id(moto125Id: string) {
  const res = await sdk.motos.getByMoto125Id(moto125Id, {
    // pedimos lo mínimo y anulamos populate del cliente
    fields: ["moto125Id", "modelName", "fullName"],
    populate: [],
    pagination: { page: 1, pageSize: 1, withCount: false },
  });
  return res.data?.[0] ?? null;
}

/* ------------------------------ Main runner ------------------------------ */

async function main() {
  guardEnv();

  log(`Resolviendo carpeta base: ${ROOT_PATH}`);
  const baseFolder = await media.ensureFolderPath(ROOT_PATH);
  log(`Carpeta base id=${baseFolder.id}`);

  const childFolders = await media.listChildFolders(baseFolder.id);
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
    if (moto125Id === "0") continue;

    const prefix = `[m${moto125Id}]`;

    try {
      // 1) ¿Existe ya?
      const existing = await findMotoByMoto125Id(moto125Id);
      if (existing) {
        log(
          `${prefix} ya existe (docId=${existing.documentId}, id=${existing.id}). Skip.`
        );
        skipped++;
        continue;
      }

      // 2) Ficheros del folder → IDs de media
      const files = await media.listFilesInFolder(folder.id);
      const imageIds = files.map((f) => f.id);
      if (imageIds.length === 0) {
        warn(
          `${prefix} sin ficheros en carpeta id=${folder.id}. Se crea sin imágenes.`
        );
      } else {
        log(`${prefix} ficheros detectados: ${imageIds.length}`);
      }

      // 3) Crear moto mínima
      const createdRes = await sdk.motos.create({
        moto125Id,
        modelName: `m${moto125Id}`,
        fullName: null,
        description: null,
        images: imageIds, // números OK
        active: true,
      });

      const createdMoto = createdRes.data!;
      log(
        `${prefix} moto creada docId=${createdMoto.documentId} (id=${createdMoto.id})`
      );
      created++;
    } catch (e: any) {
      // Nuestro ApiClient lanza Error con .status y .detail
      const msg = e?.status
        ? `HTTP ${e.status} ${e.message ?? ""} ${JSON.stringify(e.detail)}`
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
