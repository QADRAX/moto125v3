import fs from 'fs/promises';
import path from 'path';
import { Moto125Post } from './types'; // ajusta la ruta según corresponda

/**
 * Saves HTML, Markdown, and JSON files for a Moto125Post in the correct folder.
 * @param post Moto125Post to save
 * @param year Year to include in the path
 */
export async function saveMoto125PostAssets(post: Moto125Post, year: number) {
  const baseDir = path.join('data', 'moto125Posts', `${year}`, post.slug);
  await fs.mkdir(baseDir, { recursive: true });

  await fs.writeFile(path.join(baseDir, 'content.html'), post.htmlContent);
  await fs.writeFile(path.join(baseDir, 'raw.html'), post.rawHtmlContent);
  await fs.writeFile(path.join(baseDir, 'content.md'), post.mdContent);
  await fs.writeFile(path.join(baseDir, 'data.json'), JSON.stringify(post, null, 2));
}
