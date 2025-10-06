import type { Id } from "@moto125/admin-api-client";
import type { MediaLibrary, StrapiAdminHttp } from "@moto125/admin-api-client";
import path from "node:path";
import type { ContainerClient } from "@azure/storage-blob";
import { downloadBlobToTmp, safeUnlink } from "../../services/azureBlob";
import { listFilesInFolderOrRoot } from "../../services/strapi";

/** In-memory cache of Strapi files per folder for one run. */
export type FolderFilesCache = Map<Id | null, Map<string, { size: number; mime?: string }>>;

export type TmpDownload = {
  tmpPath: string;
  fileName: string;    // original file name from blob
  folderPath: string;  // "a/b/c" or "" (root)
  size: number;
  mime?: string;
};

/** Aproximación del sanitize que hace Strapi sobre "name". */
export function sanitizeNameLikeStrapi(name: string): string {
  let s = String(name ?? "");
  // elimina separadores de ruta (seguridad)
  s = s.replace(/[\\/]+/g, "");
  // elimina caracteres inválidos típicos (similar a sanitize-filename)
  s = s.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "");
  // recorta puntos/espacios al final (Windows no los admite)
  s = s.replace(/[. ]+$/g, "");
  // si queda vacío, pon algo
  if (!s) s = "unnamed";
  return s;
}

/** Normaliza un blobName a { folderPath, fileName } con separadores "/" */
export function splitBlobPath(blobName: string): { folderPath: string; fileName: string } {
  const unix = blobName.replace(/\\/g, "/");
  const fileName = path.posix.basename(unix);
  let folderPath = path.posix.dirname(unix);
  if (folderPath === "." || folderPath === "/") folderPath = "";
  return { folderPath, fileName };
}

/** Crea la estructura de carpetas en Strapi y devuelve el folderId (o null si root). */
export async function ensureFolder(media: MediaLibrary, folderPath: string): Promise<Id | null> {
  if (!folderPath) return null; // root
  const f = await media.ensureFolderPath(folderPath);
  return f.id;
}

/** Carga TODAS las páginas y rellena el cache de la carpeta. Clave = nombre (ya sanitizado por Strapi). */
export async function getFolderFilesCacheEntry(
  cache: FolderFilesCache,
  folderId: Id | null,
  http: StrapiAdminHttp,
  media: MediaLibrary
): Promise<Map<string, { size: number; mime?: string }>> {
  if (cache.has(folderId)) return cache.get(folderId)!;

  const files = await media.listFilesInFolder(folderId);
  const map = new Map<string, { size: number; mime?: string }>();
  for (const f of files) {
    // f.name ya viene sanitizado desde Strapi → úsalo como clave
    map.set(f.name, { size: f.size ?? 0, mime: f.mime });
  }

  cache.set(folderId, map);
  return map;
}

/** Descarga un blob a tmp con metadatos normalizados. */
export async function downloadTmpFromBlob(container: ContainerClient, blobName: string): Promise<TmpDownload> {
  const tmp = await downloadBlobToTmp(container, blobName);
  const { folderPath, fileName } = splitBlobPath(blobName);
  return { tmpPath: tmp.tmpPath, size: tmp.size, mime: tmp.mime, fileName, folderPath };
}

/** Limpieza segura del tmp (no lanza). */
export async function cleanupTmp(tmpPath: string) {
  await safeUnlink(tmpPath);
}

/** Subida indicando carpeta y forzando nombre SANITIZADO (fileInfo.name + filename + field 'folder'). */
export async function uploadToStrapi(
  media: MediaLibrary,
  tmp: TmpDownload,
  folderId: Id | null
): Promise<{ storedName: string }> {
  const storedName = sanitizeNameLikeStrapi(tmp.fileName);

  await media.uploadLocalFile(tmp.tmpPath, {
    filename: storedName, // también en el stream
    fileInfo: {
      name: storedName,   // nombre visible en Strapi
      ...(folderId !== null ? { folder: folderId } : {}),
    },
    folderId: folderId ?? undefined, // field top-level (por si acaso)
  });

  return { storedName };
}
