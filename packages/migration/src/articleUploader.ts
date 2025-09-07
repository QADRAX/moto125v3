import path from "path";
import fs from "fs";
import fsp from "fs/promises";
import { Moto125Post } from "./types";
import { createOneArticleFromMoto125Post } from "./uploadSingleArticle";

// ------- paths -------
function basePostsDir(): string {
  // relativo al cwd de tu proyecto "migration"
  return path.resolve(process.cwd(), "data", "moto125Posts");
}

// ------- carga desde FS -------
async function loadMoto125PostFromFs(
  year: number | string,
  slug: string
): Promise<Moto125Post> {
  const postDir = path.join(basePostsDir(), String(year), slug);
  const jsonPath = path.join(postDir, "data.json");
  const mdPath = path.join(postDir, "content.md");

  if (!fs.existsSync(jsonPath)) throw new Error(`No existe: ${jsonPath}`);
  if (!fs.existsSync(mdPath)) throw new Error(`No existe: ${mdPath}`);

  const [jsonStr, mdStr] = await Promise.all([
    fsp.readFile(jsonPath, "utf-8"),
    fsp.readFile(mdPath, "utf-8"),
  ]);

  const post = JSON.parse(jsonStr) as Moto125Post;
  post.mdContent = mdStr;

  // normaliza la fecha a ISO string por si vino como Date
  if (typeof post.publicationDate === "string") {
    post.publicationDate = new Date(post.publicationDate);
  }

  return post;
}

async function listSlugsForYear(year: number | string): Promise<string[]> {
  const yearDir = path.join(basePostsDir(), String(year));
  const dirents = await fsp.readdir(yearDir, { withFileTypes: true });
  const slugs: string[] = [];
  for (const d of dirents) {
    if (!d.isDirectory()) continue;
    const jsonPath = path.join(yearDir, d.name, "data.json");
    if (fs.existsSync(jsonPath)) slugs.push(d.name);
  }
  slugs.sort();
  return slugs;
}

// ------- API pública -------
export async function uploadArticle(
  year: number,
  slug: string
): Promise<number> {
  console.log(`[uploader] Cargando ${year}/${slug}`);
  const post = await loadMoto125PostFromFs(year, slug);
  console.log(`[uploader] Subiendo artículo slug="${post.slug}"`);
  const id = await createOneArticleFromMoto125Post(post);
  console.log(`[uploader] ✅ OK id=${id}`);
  return id;
}

export async function uploadYear(
  year: number
): Promise<{ ok: number; fail: number; total: number }> {
  const slugs = await listSlugsForYear(year);
  console.log(`[uploader] ${slugs.length} artículo(s) detectados en ${year}`);
  let ok = 0,
    fail = 0;

  for (const slug of slugs) {
    console.log(`\n[uploader] ▶ ${year}/${slug}`);
    try {
      await uploadArticle(year, slug);
      ok++;
    } catch (e: any) {
      console.warn(
        `[uploader] ✖ Falló ${year}/${slug}:`,
        e?.response?.status ?? "",
        e?.response?.data ?? e?.message ?? e
      );
      fail++;
    }
  }

  console.log(`\n[uploader] Fin. OK=${ok} FAIL=${fail} TOTAL=${slugs.length}`);
  return { ok, fail, total: slugs.length };
}
