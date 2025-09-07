import { Post } from "./types";
import { getPostsByYear } from "./utils";
import * as fs from 'fs';

export function exportPostsByYearToJson(posts: Post[]): void {
    // Agrupar los posts por año
    const postsByYear = getPostsByYear(posts);

    // Recorrer cada año y exportar los posts a un archivo JSON individual
    for (const [year, postsArray] of Object.entries(postsByYear)) {
        // Definir la ruta del archivo para el año correspondiente
        const filePath = `./data/posts/posts_${year}.json`;

        // Convertir los posts a formato JSON
        writeJsonFile(postsArray, filePath);
    }
}

export function writeJsonFile<T>(obj: T, filePath: string) {
    const jsonContent = JSON.stringify(obj, null, 2);

    fs.writeFile(filePath, jsonContent, 'utf-8', (err) => {
        if (err) {
            console.error(`Error al escribir el archivo JSON:`, err);
            return;
        }
        console.log(`Archivo JSON creado correctamente: ${filePath}`);
    });
}


export function writePostToHtmlFile(post: Post, outputDir: string): void {
    // Crear la estructura HTML para el post
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${post.title}</title>
        <link rel="stylesheet" href="styles.css">
    </head>
    <body>
        <header>
            <h1>${post.title}</h1>
            <p>Publicado el: ${post.publicationDate.toDateString()}</p>
            <p>Categorías: ${post.category.join(', ')}</p>
            <p>Etiquetas: ${post.tags.map(tag => tag.name).join(', ')}</p>
        </header>
        <main>
            ${post.content}
        </main>
        <footer>
            <p>Fuente original: <a href="${post.link}" target="_blank" rel="noopener noreferrer">${post.link}</a></p>
        </footer>
    </body>
    </html>
    `;

    const outputPath = `${outputDir}/${post.slug}.html`;

    fs.writeFile(outputPath, htmlContent, 'utf-8', (err) => {
        if (err) {
            console.error('Error al escribir el archivo HTML:', err);
            return;
        }
        console.log(`Archivo HTML creado correctamente en: ${outputPath}`);
    });
}