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

/** List files inside a folder, or in root if folderId is null. */
export async function listFilesInFolderOrRoot(args: {
  http: StrapiAdminHttp;
  media: MediaLibrary;
  folderId: Id | null;
}) {
  if (args.folderId === null) {
    const params: any = {
      "filters[folder][id][$null]": true,
      sort: "name:asc",
    };
    const raw = await args.http.get("/upload/files", { params });
    const norm = Array.isArray(raw?.data)
      ? raw.data
      : Array.isArray(raw)
        ? raw
        : [];
    return norm.map((f: any) => ({
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
    }));
  }
  return args.media.listFilesInFolder(args.folderId);
}
