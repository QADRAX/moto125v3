import fs from "fs";
import path from "path";
import axios from "axios";
import FormData from "form-data";
import { lookup as getMimeType } from "mime-types";
import dotenv from "dotenv";
import { Moto125Post } from "./types";

dotenv.config();

const {
  STRAPI_API_URL,
  STRAPI_API_TOKEN,
  STRAPI_ADMIN_TOKEN,
  WP_UPLOADS_BACKUP_DIR,
} = process.env;

// ---- Component / field names ----
const TEXT_COMPONENT_UID = "article-content.text-content";
const TEXT_FIELD = "Text";
const FORT_DEB_COMPONENT_UID = "article-content.fortalezas-debilidades";
const TAG_VALUE_FIELD = "Value";

// ---- Axios ----
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

/* --------------------------- logging --------------------------- */
function createArticleLogger(slug: string) {
  const prefix = `[article:${slug}]`;
  const ts = () => new Date().toISOString();
  const fmt = (msg: string) => `${ts()} ${prefix} ${msg}`;
  return {
    info: (msg: string, ...args: any[]) => console.log(fmt(msg), ...args),
    warn: (msg: string, ...args: any[]) => console.warn(fmt(msg), ...args),
    error: (msg: string, ...args: any[]) => console.error(fmt(msg), ...args),
    step: async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
      console.log(fmt(`▶ ${name} — start`));
      const t0 = Date.now();
      try {
        const result = await fn();
        console.log(fmt(`✔ ${name} — done in ${Date.now() - t0}ms`));
        return result;
      } catch (e: any) {
        console.error(
          fmt(
            `✖ ${name} — failed in ${Date.now() - t0}ms: ${describeAxiosError(
              e
            )}`
          )
        );
        throw e;
      }
    },
  };
}
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024,
    sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}
function describeAxiosError(err: any): string {
  if (err?.response) {
    const { status, statusText, data } = err.response;
    const body = typeof data === "string" ? data : JSON.stringify(data);
    return `HTTP ${status} ${statusText ?? ""} ${body}`;
  }
  return err?.message ?? String(err);
}

/* ----------------------------- helpers ------------------------------ */
function guardEnv(log?: ReturnType<typeof createArticleLogger>) {
  const missing: string[] = [];
  if (!STRAPI_API_URL) missing.push("STRAPI_API_URL");
  if (!STRAPI_API_TOKEN) missing.push("STRAPI_API_TOKEN");
  if (!STRAPI_ADMIN_TOKEN) missing.push("STRAPI_ADMIN_TOKEN");
  if (!WP_UPLOADS_BACKUP_DIR) missing.push("WP_UPLOADS_BACKUP_DIR");
  if (missing.length) {
    const msg = `Missing env vars: ${missing.join(", ")}`;
    log?.error(msg);
    throw new Error(msg);
  }
  log?.info(
    `Env OK (url=${
      new URL(STRAPI_API_URL!).origin
    }, uploadsDir=${WP_UPLOADS_BACKUP_DIR})`
  );
}
function toDateOnlyISO(d: Date | string): string {
  const dt = typeof d === "string" ? new Date(d) : d;
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const day = String(dt.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
async function ensureArticleTypeIdByName(
  name: string,
  log?: ReturnType<typeof createArticleLogger>
): Promise<number> {
  return (await log?.step(`Ensure ArticleType "${name}"`, async () => {
    const list = await admin.get(
      `/content-manager/collection-types/api::article-type.article-type`,
      { params: { "filters[name][$eq]": name, pageSize: 1 } }
    );
    const found = list.data?.results?.[0];
    if (found?.id) {
      log?.info(`ArticleType exists: id=${found.id}, name="${name}"`);
      return found.id;
    }
    const created = await admin.post(
      `/content-manager/collection-types/api::article-type.article-type`,
      { data: { name } }
    );
    const id = created.data?.id ?? created.data?.data?.id;
    if (!id) throw new Error(`Create ArticleType returned no id for "${name}"`);
    log?.info(`ArticleType created: id=${id}, name="${name}"`);
    return id;
  })) as number;
}

// upload folders
async function findFolderByNameAndParent(
  name: string,
  parentId: number | null
) {
  const params: any = { "filters[name][$eq]": name, "pagination[pageSize]": 1 };
  if (parentId === null) params["filters[parent][id][$null]"] = true;
  else params["filters[parent][id][$eq]"] = parentId;
  const res = await admin.get(`/upload/folders`, { params });
  return res.data?.data?.[0] ?? res.data?.results?.[0] ?? null;
}
async function ensureMediaFolderPath(
  fullPath: string,
  log?: ReturnType<typeof createArticleLogger>
): Promise<number> {
  const segments = fullPath.split("/").filter(Boolean);
  let parentId: number | null = null;
  for (const segment of segments) {
    const existing = await findFolderByNameAndParent(segment, parentId);
    if (existing?.id) {
      log?.info(
        `Folder exists: "${segment}" (id=${existing.id}, parent=${
          parentId ?? "root"
        })`
      );
      parentId = existing.id;
      continue;
    }
    const payload: any = { name: segment };
    if (parentId !== null) payload.parent = parentId;
    const created = await admin.post(`/upload/folders`, payload);
    const id = created.data?.data?.id ?? created.data?.id;
    if (!id)
      throw new Error(
        `Failed creating folder "${segment}" under parent=${parentId ?? "root"}`
      );
    log?.info(
      `Folder created: "${segment}" (id=${id}, parent=${parentId ?? "root"})`
    );
    parentId = id;
  }
  if (parentId === null)
    throw new Error(`Failed to ensure folder path "${fullPath}"`);
  return parentId;
}
async function uploadLocalFileToStrapi(
  localPath: string,
  fileName: string,
  folderId: number,
  log?: ReturnType<typeof createArticleLogger>
): Promise<number> {
  if (!fs.existsSync(localPath))
    throw new Error(`Local file not found: ${localPath}`);
  const stat = fs.statSync(localPath);
  const contentType = getMimeType(fileName) || "application/octet-stream";
  log?.info(
    `Uploading file: path="${localPath}", name="${fileName}", type=${contentType}, size=${formatBytes(
      stat.size
    )}, folderId=${folderId}`
  );
  const form = new FormData();
  form.append("files", fs.createReadStream(localPath), {
    filename: fileName,
    contentType,
  });
  const fileInfo: Record<string, any> = { name: fileName, folder: folderId };
  form.append("fileInfo", JSON.stringify(fileInfo));
  const res = await admin.post(`/upload`, form, {
    headers: form.getHeaders(),
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });
  const uploaded = Array.isArray(res.data) ? res.data[0] : res.data?.[0];
  const id = uploaded?.id;
  const url = uploaded?.url;
  const hash = uploaded?.hash;
  if (!id) throw new Error(`Upload response missing id for ${fileName}`);
  log?.info(
    `Upload OK: id=${id}, url=${url ?? "(n/a)"}, hash=${hash ?? "(n/a)"}`
  );
  return id;
}
async function findArticleIdBySlug(slug: string): Promise<number | null> {
  const res = await contentApi.get(`/api/articles`, {
    params: { "filters[slug][$eq]": slug, "pagination[pageSize]": 1 },
  });
  const row = res.data?.data?.[0];
  return row?.id ?? null;
}
async function findFileByNameInFolder(fileName: string, folderId: number) {
  const res = await admin.get(`/upload/files`, {
    params: {
      "filters[folder][id][$eq]": folderId,
      "filters[name][$eq]": fileName,
      "pagination[pageSize]": 1,
    },
  });
  const list = res.data?.data ?? res.data?.results ?? res.data;
  const f = Array.isArray(list) ? list[0] : null;
  return f ? { id: f.id, name: f.name, size: f.size } : null;
}
async function deleteFileById(fileId: number): Promise<void> {
  await admin.delete(`/upload/files/${fileId}`);
}

/* ------------------- DZ builder (usa campo 'text') ------------------- */
function buildContentZone(
  post: Moto125Post,
  log?: ReturnType<typeof createArticleLogger>
): any[] {
  const dz: any[] = [];
  const hasText = Boolean(post.mdContent?.trim());
  if (hasText) {
    dz.push({ __component: TEXT_COMPONENT_UID, [TEXT_FIELD]: post.mdContent });
  }
  const hasFD =
    !!post.debilidadesFortalezas &&
    ((post.debilidadesFortalezas.fortalezas?.length ?? 0) > 0 ||
      (post.debilidadesFortalezas.debilidades?.length ?? 0) > 0);
  if (hasFD) {
    dz.push({
      __component: FORT_DEB_COMPONENT_UID,
      Fortalezas: (post.debilidadesFortalezas!.fortalezas ?? []).map((s) => ({
        value: s,
      })),
      Debilidades: (post.debilidadesFortalezas!.debilidades ?? []).map((s) => ({
        value: s,
      })),
    });
  }
  log?.info(
    `Dynamic zone blocks: total=${dz.length} (text=${
      hasText ? 1 : 0
    }, fort/deb=${hasFD ? 1 : 0})`
  );
  return dz;
}

/** Map tags string[] -> list.tag-list (campo "Value") */
function mapTagsComponent(
  tags: string[] | undefined,
  log?: ReturnType<typeof createArticleLogger>
): any[] {
  const res = !tags?.length ? [] : tags.map((t) => ({ [TAG_VALUE_FIELD]: t }));
  log?.info(`Tags mapped: count=${res.length}`);
  return res;
}

/* -------------------------- main: upsert article ------------------------- */
export async function createOneArticleFromMoto125Post(
  post: Moto125Post
): Promise<number> {
  const log = createArticleLogger(post.slug);
  log.info(`Starting article upsert: id=${post.id}, title="${post.title}"`);

  guardEnv(log);

  const articleTypeId = await ensureArticleTypeIdByName(
    post.category?.[0] ?? "ACTUALIDAD",
    log
  );

  // Cover (required)
  const rel = (post.image ?? "").replace(/^\/+/, "");
  if (!rel) {
    log.warn(
      "Post has empty 'image' (relative path). The schema requires coverImage; aborting."
    );
    throw new Error(
      "Missing post.image (relative path under wp-content/uploads)."
    );
  }
  const localFilePath = path.join(WP_UPLOADS_BACKUP_DIR!, rel);
  if (!fs.existsSync(localFilePath)) {
    throw new Error(`Local cover file not found: ${localFilePath}`);
  }
  const localStat = fs.statSync(localFilePath);
  const origName = path.basename(rel);
  const ext = path.extname(origName) || ".jpg";
  const coverFileName = `cover-${post.slug}${ext}`;
  log.info(
    `Cover file resolved: rel="${rel}", local="${localFilePath}", uploadName="${coverFileName}", size=${formatBytes(
      localStat.size
    )}`
  );

  // Carpeta única para portadas
  const folderId = await log.step(
    `Ensure Media folder "post-cover-images"`,
    async () => ensureMediaFolderPath(`post-cover-images`, log)
  );

  // Re-subida forzada si ya existe ese nombre
  const existingCover = await findFileByNameInFolder(coverFileName, folderId);
  if (existingCover) {
    log.info(
      `Existing cover found (id=${existingCover.id}, size=${formatBytes(
        existingCover.size
      )}). Deleting for forced re-upload...`
    );
    try {
      await deleteFileById(existingCover.id);
      log.info(`Old cover deleted id=${existingCover.id}`);
    } catch (e) {
      log.warn(
        `Could not delete old cover id=${
          existingCover.id
        }: ${describeAxiosError(e)}`
      );
    }
  }

  const coverImageId = await log.step("Upload cover image", async () =>
    uploadLocalFileToStrapi(localFilePath, coverFileName, folderId, log)
  );

  // Payload
  const payloadData: any = {
    slug: post.slug,
    title: post.title,
    publicationDate: toDateOnlyISO(post.publicationDate),
    visible: true,
    coverImage: coverImageId,
    authorPhotos: post.creditos?.authorPhotos ?? null,
    authorAction: post.creditos?.authorAccion ?? null,
    authorText: post.creditos?.authorText ?? null,
    youtubeLink: post.youtubeLink ?? null,
    articleType: articleTypeId,
    tags: mapTagsComponent(post.tags, log),
    content: buildContentZone(post, log),
    publishedAt: new Date(post.publicationDate as any).toISOString(),
  };

  log.info(
    `Payload summary: slug="${payloadData.slug}", typeId=${payloadData.articleType}, coverId=${payloadData.coverImage}, ` +
      `date=${payloadData.publicationDate}, publishedAt=${
        payloadData.publishedAt
      }, tags=${payloadData.tags?.length ?? 0}, dzBlocks=${
        payloadData.content?.length ?? 0
      }`
  );

  // Upsert por slug
  const existingArticleId = await findArticleIdBySlug(post.slug);
  if (existingArticleId) {
    log.info(`Article exists (id=${existingArticleId}). Updating...`);
    const updatedId = await log.step("Update Article (PUT)", async () => {
      const res = await contentApi.put(`/api/articles/${existingArticleId}`, {
        data: payloadData,
      });
      return res.data?.data?.id ?? existingArticleId;
    });
    log.info(
      `Article updated successfully: id=${updatedId}, slug="${post.slug}"`
    );
    return updatedId;
  }

  const articleId = await log.step("Create Article (POST)", async () => {
    const res = await contentApi.post(`/api/articles`, { data: payloadData });
    const id = res.data?.data?.id ?? res.data?.id;
    if (!id)
      throw new Error(
        `Article creation response missing id for slug ${post.slug}`
      );
    return id;
  });

  log.info(
    `Article created successfully: id=${articleId}, slug="${post.slug}"`
  );
  return articleId;
}
