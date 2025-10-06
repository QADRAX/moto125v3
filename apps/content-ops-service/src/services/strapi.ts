import {
  MediaLibrary,
  StrapiAdminHttp,
  type Id,
} from "@moto125/admin-api-client";

/** Create Strapi Admin HTTP + MediaLibrary (token or credentials). */
export async function createStrapiClients(opts: {
  baseURL: string;
  token?: string;
  email?: string;
  password?: string;
}) {
  const http = new StrapiAdminHttp({
    baseURL: opts.baseURL,
    token: opts.token,
    email: opts.email,
    password: opts.password,
  });
  if (!opts.token) {
    await http.login(); // uses email+password from constructor
  }
  const media = new MediaLibrary(http);
  return { http, media };
}

/**
 * Normaliza el array de ficheros desde Strapi (sea { data: [] } o []).
 */
function normArray(raw: any): any[] {
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.results)) return raw.results;
  if (Array.isArray(raw)) return raw;
  return [];
}

/**
 * Mapea un item crudo de Strapi a nuestro shape común.
 */
function mapFile(f: any) {
  return {
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
  };
}

export async function listFilesInFolderOrRoot(args: {
  http: StrapiAdminHttp;
  media: MediaLibrary;
  folderId: Id | null;
}): Promise<
  Array<{
    id: Id;
    name: string;
    folderId: Id | null;
    url?: string;
    ext?: string;
    mime?: string;
    size?: number;
    width?: number | null;
    height?: number | null;
    createdAt?: string;
    updatedAt?: string;
  }>
> {
  const pageSize = 100;
  let page = 1;
  const out: any[] = [];

  while (true) {
    const params: Record<string, any> = {
      sort: "name:asc",
      "pagination[page]": page,
      "pagination[pageSize]": pageSize,
      "pagination[withCount]": true,
    };
    if (args.folderId === null) {
      params["filters[folder][id][$null]"] = true;
    } else {
      params["filters[folder][id][$eq]"] = args.folderId;
    }

    const raw = await args.http.get("/upload/files", { params });
    const items = normArray(raw);
    for (const it of items) out.push(mapFile(it));

    const pageCount =
      raw?.meta?.pagination?.pageCount ??
      (items.length < pageSize ? page : undefined);

    if (!pageCount || page >= pageCount) break;
    page += 1;
  }

  return out;
}
