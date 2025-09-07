import {
  Moto125Post,
  Post,
  PostCategory,
  RssItem,
  RssResult,
  Tag,
} from "./types";
import * as fs from "fs";
import { parseString } from "xml2js";
import { MOTO125_CATEGORIES } from "./constants";
import {
  cleanHtmlArticle,
  extractCreditosFromHtml,
  extractFichaTecnicaIdFromHtml,
  extractFortalezasDebilidadesFromHtml,
  extractPrestacionesFromHtml,
  extractYouTubeLinkFromHtml,
  removeCreditosFromHtml,
  removeFichaTecnicaTableFromHtml,
  removeFortalezasDebilidadesFromHtml,
  removePrestacionesTableFromHtml,
  removeYouTubeIframeFromHtml,
  sanitizeHtml,
} from "./htmlUtils";
import { getMoto125MainArticleImage } from "./moto125Reader";
import { readFile } from "fs/promises";
import { convertHtmlToMarkdown } from "./converHtmlToMarkdown";
import { extractMarcasModelos } from "./extractMarcasModelos";
import { getFeaturedImageRelativePathFromDb } from "./wordpressMediaRelative";
import { rewriteMarkdownUrls } from "./markdownUrlRewriter";

export async function readWPFile(filePath: string): Promise<Post[]> {
  return new Promise<Post[]>((resolve, reject) => {
    fs.readFile(
      filePath,
      "utf-8",
      (err: NodeJS.ErrnoException | null, data: string) => {
        if (err) {
          console.error("Error al leer el archivo:", err);
          reject(err);
        }

        parseString(
          data,
          { explicitArray: false },
          (err: Error | null, result: RssResult) => {
            if (err) {
              console.error("Error al parsear el XML:", err);
              reject(err);
            }

            const items: RssItem[] = result.rss.channel.item;
            resolve(items.map((i) => parseRssItemToPost(i)));
          }
        );
      }
    );
  });
}

export async function readObjectFromFile<T>(filePath: string): Promise<T> {
  try {
    const fileContent = await readFile(filePath, "utf-8");
    const data: T = JSON.parse(fileContent);
    return data;
  } catch (error) {
    console.error("Error reading the file:", error);
    throw error;
  }
}

export async function readPostsFromJsonFile(filePath: string): Promise<Post[]> {
  return new Promise<Post[]>((resolve, reject) => {
    fs.readFile(
      filePath,
      "utf-8",
      (err: NodeJS.ErrnoException | null, data: string) => {
        if (err) {
          console.error("Error al leer el archivo:", err);
          reject(err);
        }

        const posts: Post[] = JSON.parse(data);
        posts.forEach((post) => {
          post.publicationDate = new Date(post.publicationDate);
        });

        resolve(posts);
      }
    );
  });
}

function parseRssItemToPost(rssItem: RssItem): Post {
  // Normalizar las categorías del RSSItem
  const rssCategories: string[] = Array.isArray(rssItem.category)
    ? rssItem.category.map((cat) => cat._.toUpperCase())
    : rssItem.category
    ? [rssItem.category._.toUpperCase()]
    : [];

  // Filtrar las categorías del Post
  const postCategories: PostCategory[] = rssCategories.filter((category) =>
    MOTO125_CATEGORIES.includes(category as PostCategory)
  ) as PostCategory[];

  // Crear el array de tags
  const tags: Tag[] = rssCategories.map((category) => ({ name: category }));

  // Crear el objeto Post
  const post: Post = {
    id: parseInt(rssItem["wp:post_id"]),
    title: rssItem.title,
    link: rssItem.link,
    publicationDate: new Date(rssItem.pubDate),
    category: postCategories,
    tags: tags,
    slug: rssItem["wp:post_name"],
    content: rssItem["content:encoded"],
  };

  return post;
}

export async function parsePostToMoto125Post(post: Post): Promise<Moto125Post> {
  let image = "";
  try {
    image = await getFeaturedImageRelativePathFromDb(post.id);
  }catch(e) {
    console.warn(`Recuperar imagen principal para el post ${post.id} falló: ${(e as Error).message}.`);
  }
  
  let htmlContent = sanitizeHtml(post.content);
  const creditos = extractCreditosFromHtml(htmlContent);
  if (creditos) {
    htmlContent = removeCreditosFromHtml(htmlContent);
  }

  const prestaciones = extractPrestacionesFromHtml(htmlContent);
  if (prestaciones) {
    htmlContent = removePrestacionesTableFromHtml(htmlContent);
  }

  const debilidadesFortalezas = extractFortalezasDebilidadesFromHtml(htmlContent);
  if (debilidadesFortalezas) {
    htmlContent = removeFortalezasDebilidadesFromHtml(htmlContent);
  }

  const youtubeLink = extractYouTubeLinkFromHtml(htmlContent);
  if (youtubeLink) {
    htmlContent = removeYouTubeIframeFromHtml(htmlContent);
  }
  const fichaTecnicaId = extractFichaTecnicaIdFromHtml(htmlContent);
  if(fichaTecnicaId) {
    htmlContent = removeFichaTecnicaTableFromHtml(htmlContent);
  }

  let mdContent = convertHtmlToMarkdown(htmlContent);
  
  const blobBase = process.env.M125_BLOB_BASE!;
  mdContent = rewriteMarkdownUrls(mdContent, blobBase);

  //const marcasModelos = await extractMarcasModelos(mdContent, process.env.GEMINI_API_KEY ?? '');

  const moto125Post: Moto125Post = {
    id: post.id,
    title: post.title,
    image,
    publicationDate: new Date(post.publicationDate),
    category: post.category,
    slug: post.slug,
    rawHtmlContent: post.content,
    htmlContent,
    mdContent,
    prestaciones,
    debilidadesFortalezas,
    creditos,
    youtubeLink,
    fichaTecnicaId,
    tags: post.tags.map((t) => t.name),
  };

  return moto125Post;
}
