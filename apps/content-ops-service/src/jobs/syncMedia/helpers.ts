import type { Id } from "@moto125/admin-api-client";
import type { MediaLibrary, StrapiAdminHttp } from "@moto125/admin-api-client";
import path from "node:path";
import type { ContainerClient } from "@azure/storage-blob";
import { downloadBlobToTmp, safeUnlink } from "../../services/azureBlob";

export type FolderFilesCache = Map<Id | null, Map<string, { size: number; mime?: string }>>;

export type TmpDownload = {
  tmpPath: string;
  fileName: string;
  folderPath: string;
  size: number;
  mime?: string;
};

export function sanitizeNameLikeStrapi(name: string): string {
  let s = String(name ?? "");
  s = s.replace(/[\\/]+/g, "");
  s = s.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "");
  s = s.replace(/[. ]+$/g, "");
  if (!s) s = "unnamed";
  return s;
}

export function splitBlobPath(blobName: string): { folderPath: string; fileName: string } {
  const unix = blobName.replace(/\\/g, "/");
  const fileName = path.posix.basename(unix);
  let folderPath = path.posix.dirname(unix);
  if (folderPath === "." || folderPath === "/") folderPath = "";
  return { folderPath, fileName };
}

export async function ensureFolder(media: MediaLibrary, folderPath: string): Promise<Id | null> {
  if (!folderPath) return null; // root
  const f = await media.ensureFolderPath(folderPath);
  return f.id;
}

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
    map.set(f.name, { size: f.size ?? 0, mime: f.mime });
  }

  cache.set(folderId, map);
  return map;
}

export async function downloadTmpFromBlob(container: ContainerClient, blobName: string): Promise<TmpDownload> {
  const tmp = await downloadBlobToTmp(container, blobName);
  const { folderPath, fileName } = splitBlobPath(blobName);
  return { tmpPath: tmp.tmpPath, size: tmp.size, mime: tmp.mime, fileName, folderPath };
}

export async function cleanupTmp(tmpPath: string) {
  await safeUnlink(tmpPath);
}

export async function uploadToStrapi(
  media: MediaLibrary,
  tmp: TmpDownload,
  folderId: Id | null
): Promise<{ storedName: string }> {
  const storedName = sanitizeNameLikeStrapi(tmp.fileName);

  await media.uploadLocalFile(tmp.tmpPath, {
    filename: storedName,
    fileInfo: {
      name: storedName,
      ...(folderId !== null ? { folder: folderId } : {}),
    },
    folderId: folderId ?? undefined,
  });

  return { storedName };
}
