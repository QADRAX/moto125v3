import FormData from 'form-data';
import fs from 'node:fs';
import path from 'node:path';
import { StrapiAdminHttp } from '../http';
import { AdminFile, AdminFolder, Id, Page, UploadOptions } from '../types/admin';

function normList<T = any>(raw: any): T[] {
  const d = raw?.data ?? raw;
  if (Array.isArray(d?.data)) return d.data as T[];
  if (Array.isArray(d?.results)) return d.results as T[];
  if (Array.isArray(d)) return d as T[];
  return [];
}

export class MediaLibrary {
  constructor(private http: StrapiAdminHttp) {}

  private folderCacheByKey = new Map<string, AdminFolder>();

  async listChildFolders(parentId: Id | null): Promise<AdminFolder[]> {
    const params: any = { sort: 'name:asc' };
    if (parentId === null) params['filters[parent][id][$null]'] = true;
    else params['filters[parent][id][$eq]'] = parentId;

    const raw = await this.http.get('/upload/folders', { params });
    const arr = normList<any>(raw);
    const out = arr.map((f) => ({
      id: f.id,
      name: f.name,
      parentId: f.parent?.id ?? null,
    })) as AdminFolder[];
    out.sort((a, b) => a.name.localeCompare(b.name, 'es'));
    return out;
  }

  async getChildFolderByName(parentId: Id | null, name: string): Promise<AdminFolder | null> {
    const cacheKey = `${parentId ?? 'root'}::${name}`;
    const cached = this.folderCacheByKey.get(cacheKey);
    if (cached) return cached;

    const params: any = { 'filters[name][$eq]': name };
    if (parentId === null) params['filters[parent][id][$null]'] = true;
    else params['filters[parent][id][$eq]'] = parentId;

    const raw = await this.http.get('/upload/folders', { params });
    const f = normList<any>(raw)[0];
    const out = f ? { id: f.id, name: f.name, parentId: f.parent?.id ?? null } : null;
    if (out) this.folderCacheByKey.set(cacheKey, out);
    return out;
  }

  /** Crea carpeta (en root si parentId es null) */
  async createFolder(name: string, parentId: Id | null): Promise<AdminFolder> {
    const body: any = { name, parent: parentId };
    const created = await this.http.post('/upload/folders', body);
    const out = { id: created.id, name: created.name, parentId: created.parent?.id ?? null };
    const cacheKey = `${parentId ?? 'root'}::${name}`;
    this.folderCacheByKey.set(cacheKey, out);
    return out;
  }

  async ensureFolderPath(pathStr: string): Promise<AdminFolder> {
    const segments = pathStr.split(/[\\/]/).filter(Boolean);
    let parentId: Id | null = null;
    let last: AdminFolder | null = null;

    for (const seg of segments) {
      const existing = await this.getChildFolderByName(parentId, seg);
      last = existing ?? (await this.createFolder(seg, parentId));
      parentId = last.id;
    }
    if (!last) throw new Error(`No se pudo resolver/crear la ruta "${pathStr}"`);
    return last;
  }

  async listFilesInFolder(folderId: Id): Promise<AdminFile[]> {
    const params: any = {
      'filters[folder][id][$eq]': folderId,
      sort: 'name:asc',
    };
    const raw = await this.http.get('/upload/files', { params });
    const results = normList<any>(raw).map((f) => ({
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
    })) as AdminFile[];

    return results;
  }

  async moveFile(fileId: Id, newFolderId: Id | null): Promise<AdminFile> {
    const updated = await this.http.put(`/upload/files/${fileId}`, { folder: newFolderId });
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

  async uploadLocalFile(filePath: string, opts: UploadOptions = {}): Promise<AdminFile[]> {
    const stat = fs.statSync(filePath);
    if (!stat.isFile()) throw new Error(`No es un fichero: ${filePath}`);

    const stream = fs.createReadStream(filePath);
    const form = new FormData();
    form.append('files', stream, { filename: opts.filename ?? path.basename(filePath) });

    if (opts.fileInfo) form.append('fileInfo', JSON.stringify(opts.fileInfo));
    if (typeof opts.folderId !== 'undefined') form.append('folder', String(opts.folderId ?? ''));

    const headers = form.getHeaders();
    const data = await this.http.post('/upload', form, { headers });
    const arr = Array.isArray(data) ? data : data?.data ?? [];
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
