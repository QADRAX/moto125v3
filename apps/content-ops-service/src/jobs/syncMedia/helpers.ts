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
  fileName: string;
  folderPath: string; // POSIX-like segments "a/b/c" or "" (root)
  size: number;
  mime?: string;
};

export function splitBlobPath(blobName: string): { folderPath: string; fileName: string } {
  const fileName = path.posix.basename(blobName.replace(/\\/g, "/"));
  let folderPath = path.posix.dirname(blobName.replace(/\\/g, "/"));
  if (folderPath === "." || folderPath === "/") folderPath = "";
  return { folderPath, fileName };
}

export async function ensureFolder(media: MediaLibrary, folderPath: string): Promise<Id | null> {
  if (!folderPath) return null; // root
  const f = await media.ensureFolderPath(folderPath);
  return f.id;
}

/** ⚠️ Ahora trae TODAS las páginas antes de poblar el cache. */
export async function getFolderFilesCacheEntry(
  cache: FolderFilesCache,
  folderId: Id | null,
  http: StrapiAdminHttp,
  media: MediaLibrary
): Promise<Map<string, { size: number; mime?: string }>> {
  if (cache.has(folderId)) return cache.get(folderId)!;

  const files = await listFilesInFolderOrRoot({ http, media, folderId }); // ← paginado
  const map = new Map<string, { size: number; mime?: string }>();
  for (const f of files) map.set(f.name, { size: f.size ?? 0, mime: f.mime });

  cache.set(folderId, map);
  return map;
}

export function isSameFile(existing: { size: number; mime?: string } | undefined, size: number, mime?: string) {
  if (!existing) return false;
  if (Number(existing.size) !== Number(size)) return false;
  if (existing.mime && mime && existing.mime !== mime) return false;
  return true;
}

export async function downloadTmpFromBlob(container: ContainerClient, blobName: string): Promise<TmpDownload> {
  const tmp = await downloadBlobToTmp(container, blobName);
  const { folderPath, fileName } = splitBlobPath(blobName);
  return { tmpPath: tmp.tmpPath, size: tmp.size, mime: tmp.mime, fileName, folderPath };
}

export async function cleanupTmp(tmpPath: string) {
  await safeUnlink(tmpPath);
}

/** Subida indicando carpeta por partida doble (fileInfo.folder + field 'folder') */
export async function uploadToStrapi(
  media: MediaLibrary,
  tmp: TmpDownload,
  folderId: Id | null
): Promise<void> {
  await media.uploadLocalFile(tmp.tmpPath, {
    filename: tmp.fileName,
    fileInfo: {
      name: tmp.fileName,
      ...(folderId !== null ? { folder: folderId } : {}),
    },
    folderId: folderId ?? undefined, // ← “cinturón y tirantes”
  });
}
