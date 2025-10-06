import FormData from "form-data";
import fs from "node:fs";
import path from "node:path";
import { StrapiAdminHttp } from "../http";
import {
  AdminFile,
  AdminFolder,
  Id,
  Page,
  UploadOptions,
} from "../types/admin";

function normList<T = any>(raw: any): T[] {
  const d = raw?.data ?? raw;
  if (Array.isArray(d?.data)) return d.data as T[];
  if (Array.isArray(d?.results)) return d.results as T[];
  if (Array.isArray(d)) return d as T[];
  return [];
}

function unwrap<T = any>(raw: any): T {
  return raw && raw.data ? (raw.data as T) : (raw as T);
}

export class MediaLibrary {
  constructor(private http: StrapiAdminHttp) {}

  private folderCacheByKey = new Map<string, AdminFolder>();

  async listChildFolders(parentId: Id | null): Promise<AdminFolder[]> {
    const params: any = { sort: "name:asc" };
    if (parentId === null) params["filters[parent][id][$null]"] = true;
    else params["filters[parent][id][$eq]"] = parentId;

    const raw = await this.http.get("/upload/folders", { params });
    const arr = normList<any>(raw);
    const out = arr.map((f) => ({
      id: f.id,
      name: f.name,
      parentId: f.parent?.id ?? null,
    })) as AdminFolder[];
    out.sort((a, b) => a.name.localeCompare(b.name, "es"));
    return out;
  }

  async getChildFolderByName(
    parentId: Id | null,
    name: string
  ): Promise<AdminFolder | null> {
    const cacheKey = `${parentId ?? "root"}::${name}`;
    const cached = this.folderCacheByKey.get(cacheKey);
    if (cached) return cached;

    const params: any = { "filters[name][$eq]": name };
    if (parentId === null) params["filters[parent][id][$null]"] = true;
    else params["filters[parent][id][$eq]"] = parentId;

    const raw = await this.http.get("/upload/folders", { params });
    const f = normList<any>(raw)[0];
    const out = f
      ? { id: f.id, name: f.name, parentId: f.parent?.id ?? null }
      : null;
    if (out) this.folderCacheByKey.set(cacheKey, out);
    return out;
  }

  /** Crea carpeta (en root si parentId es null) */
  async createFolder(name: string, parentId: Id | null): Promise<AdminFolder> {
    const body: any = { name, parent: parentId };
    const createdRaw = await this.http.post("/upload/folders", body);
    const created = unwrap<any>(createdRaw);

    const out: AdminFolder = {
      id: created.id,
      name: created.name,
      parentId: created.parent?.id ?? null,
    };

    const cacheKey = `${parentId ?? "root"}::${name}`;
    this.folderCacheByKey.set(cacheKey, out);
    return out;
  }

  async ensureFolderPath(pathStr: string): Promise<AdminFolder> {
    const clean = String(pathStr ?? "").trim();
    if (!clean) throw new Error("ensureFolderPath: path vacío");
    const segments = clean.split(/[\\/]+/).filter(Boolean);

    let parentId: Id | null = null;
    let last: AdminFolder | null = null;

    for (const seg of segments) {
      const existing = await this.getChildFolderByName(parentId, seg);
      last = existing ?? (await this.createFolder(seg, parentId));
      parentId = last.id;
      if (typeof parentId !== "number") {
        throw new Error(
          `createFolder devolvió id inválido en segmento "${seg}" (id=${String(parentId)})`
        );
      }
    }
    if (!last)
      throw new Error(`No se pudo resolver/crear la ruta "${pathStr}"`);
    return last;
  }

  async listFilesInFolder(
    folderId: Id | null,
    opts?: { pageSize?: number; folderPath?: string } // folderPath como "/1/3" si lo conoces
  ): Promise<AdminFile[]> {
    const out: AdminFile[] = [];
    const pageSize = opts?.pageSize ?? 100;
    let page = 1;
    const seen = new Set<number>(); // evita bucles si el server ignora la paginación
    while (true) {
      const params: Record<string, any> = {
        sort: "name:asc",
        page,
        pageSize,
      };

      if (folderId === null) {
        // root
        params["filters[folder][id][$null]"] = true;
      } else {
        // carpeta concreta al estilo del admin UI
        params["folder"] = folderId;
        if (opts?.folderPath) {
          params["filters[$and][0][folderPath][$eq]"] = opts.folderPath; // ej: "/1/3" (opcional)
        }
      }

      const raw = await this.http.get("/upload/files", { params });
      const items = normList<any>(raw);

      const fresh = items.filter((f: any) => !seen.has(f.id));
      for (const f of fresh) {
        out.push({
          id: f.id,
          name: f.name,
          alternativeText: f.alternativeText ?? null,
          caption: f.caption ?? null,
          folderId: f.folder?.id ?? null,
          url: f.url,
          ext: f.ext,
          mime: f.mime,
          size: f.size,
          width: f.width ?? null,
          height: f.height ?? null,
          createdAt: f.createdAt,
          updatedAt: f.updatedAt,
        } as AdminFile);
        seen.add(f.id);
      }

      // corte: página corta o sin nuevos elementos
      if (items.length < pageSize || fresh.length === 0) break;
      page += 1;
    }

    return out;
  }

  async moveFile(fileId: Id, newFolderId: Id | null): Promise<AdminFile> {
    const updated = await this.http.put(`/upload/files/${fileId}`, {
      folder: newFolderId,
    });
    return {
      id: updated.id,
      name: updated.name,
      folderId: updated.folder?.id ?? null,
      url: updated.url,
      ext: updated.ext,
      mime: updated.mime,
      size: updated.size,
      width: updated.width ?? null,
      height: updated.height ?? null,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  async deleteFile(fileId: Id): Promise<void> {
    await this.http.del(`/upload/files/${fileId}`);
  }

  async uploadLocalFile(
    filePath: string,
    opts: UploadOptions = {}
  ): Promise<AdminFile[]> {
    const stat = fs.statSync(filePath);
    if (!stat.isFile()) throw new Error(`No es un fichero: ${filePath}`);

    const stream = fs.createReadStream(filePath);
    const form = new FormData();
    form.append("files", stream, {
      filename: opts.filename ?? path.basename(filePath),
    });

    if (opts.fileInfo) form.append("fileInfo", JSON.stringify(opts.fileInfo));

    if (typeof opts.folderId !== "undefined") {
      form.append("folder", String(opts.folderId ?? ""));
    }

    const headers = form.getHeaders();
    const data = await this.http.post("/upload", form, { headers });
    const arr = Array.isArray(data) ? data : (data?.data ?? []);
    return arr.map((f: any) => ({
      id: f.id,
      name: f.name,
      folderId: f.folder?.id ?? null,
      url: f.url,
      ext: f.ext,
      mime: f.mime,
      size: f.size,
      width: f.width ?? null,
      height: f.height ?? null,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
    })) as AdminFile[];
  }
}
