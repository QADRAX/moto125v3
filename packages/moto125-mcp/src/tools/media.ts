import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getMediaLibrary } from "../client.js";
import { adminIdSchema, uploadOptionsSchema, watermarkOptionsSchema } from "../schemas.js";
import { runTool } from "../util.js";
import { applyWatermark, applyWatermarkToFile } from "../watermark.js";

async function resolveFolderId(
  mediaLib: ReturnType<typeof getMediaLibrary>,
  folderId?: number | null,
  folderPath?: string
): Promise<number | null | undefined> {
  if (typeof folderId !== "undefined") {
    return folderId;
  }
  if (folderPath && folderPath.trim()) {
    const folder = await mediaLib.ensureFolderPath(folderPath.trim());
    return folder.id;
  }
  return undefined;
}

export function registerMediaTools(server: McpServer) {

  server.registerTool(
    "media_list_child_folders",
    {
      title: "Listar carpetas hijas",
      description:
        "MediaLibrary.listChildFolders(parentId). null = raíz.",
      inputSchema: {
        parentId: adminIdSchema.nullable().describe("padre; null = raíz"),
      },
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ parentId }) =>
      runTool(() => getMediaLibrary().listChildFolders(parentId))
  );

  server.registerTool(
    "media_get_child_folder_by_name",
    {
      title: "Obtener carpeta hija por nombre",
      description: "MediaLibrary.getChildFolderByName.",
      inputSchema: {
        parentId: adminIdSchema.nullable(),
        name: z.string(),
      },
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ parentId, name }) =>
      runTool(() => getMediaLibrary().getChildFolderByName(parentId, name))
  );

  server.registerTool(
    "media_create_folder",
    {
      title: "Crear carpeta de media",
      description:
        "MediaLibrary.createFolder. Preferir media_ensure_folder_path.",
      inputSchema: {
        name: z.string(),
        parentId: adminIdSchema.nullable(),
      },
      annotations: { openWorldHint: true },
    },
    async ({ name, parentId }) =>
      runTool(() => getMediaLibrary().createFolder(name, parentId))
  );

  server.registerTool(
    "media_ensure_folder_path",
    {
      title: "Asegurar ruta de carpetas",
      description:
        'MediaLibrary.ensureFolderPath — ej. "post-cover-images", "images/stories/motos".',
      inputSchema: {
        path: z.string().describe("Ruta con /"),
      },
      annotations: { openWorldHint: true },
    },
    async ({ path }) =>
      runTool(() => getMediaLibrary().ensureFolderPath(path))
  );

  server.registerTool(
    "media_list_files_in_folder",
    {
      title: "Listar ficheros en carpeta",
      description:
        "MediaLibrary.listFilesInFolder — ids para coverImage / images.",
      inputSchema: { folderId: adminIdSchema },
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ folderId }) =>
      runTool(() => getMediaLibrary().listFilesInFolder(folderId))
  );

  server.registerTool(
    "media_upload_local_file",
    {
      title: "Subir fichero local",
      description:
        "Sube un fichero local de la máquina a la biblioteca de Strapi. Soporta folderPath (asegura/crea la ruta automáticamente), metadatos SEO (alternativeText, caption) y marca de agua con el logo oficial de moto125.cc.",
      inputSchema: {
        filePath: z.string().describe("Ruta del fichero local en la máquina"),
        opts: uploadOptionsSchema.optional(),
      },
      annotations: { openWorldHint: true },
    },
    async ({ filePath, opts }) =>
      runTool(async () => {
        const mediaLib = getMediaLibrary();
        const targetFolderId = await resolveFolderId(
          mediaLib,
          opts?.folderId,
          opts?.folderPath
        );

        const filename = opts?.filename ?? path.basename(filePath);
        const fileInfo = opts?.fileInfo;
        const fileBuffer = fs.readFileSync(filePath);

        const processedBuffer = await applyWatermark(
          fileBuffer,
          opts?.watermark
        );

        return mediaLib.uploadBuffer(processedBuffer, filename, {
          folderId: targetFolderId,
          filename,
          fileInfo: fileInfo as any,
        });
      })
  );

  server.registerTool(
    "media_upload_from_url",
    {
      title: "Subir fichero desde URL",
      description:
        "Descarga una imagen de internet vía HTTP/HTTPS y la sube a la biblioteca de Strapi. Soporta folderPath (creación automática), metadatos SEO y marca de agua con el logo de moto125.cc.",
      inputSchema: {
        url: z.string().url().describe("URL pública de la imagen a descargar y subir"),
        opts: uploadOptionsSchema.optional(),
      },
      annotations: { openWorldHint: true },
    },
    async ({ url, opts }) =>
      runTool(async () => {
        const mediaLib = getMediaLibrary();
        const targetFolderId = await resolveFolderId(
          mediaLib,
          opts?.folderId,
          opts?.folderPath
        );

        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(
            `Error al descargar la imagen de ${url}: ${res.status} ${res.statusText}`
          );
        }

        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        let filename = opts?.filename;
        if (!filename) {
          try {
            const parsed = new URL(url);
            const base = path.basename(parsed.pathname);
            filename = base && base.includes(".") ? base : "imagen.jpg";
          } catch {
            filename = "imagen.jpg";
          }
        }

        const fileInfo = opts?.fileInfo;
        const processedBuffer = await applyWatermark(
          buffer,
          opts?.watermark
        );

        return mediaLib.uploadBuffer(processedBuffer, filename, {
          folderId: targetFolderId,
          filename,
          fileInfo: fileInfo as any,
        });
      })
  );

  server.registerTool(
    "media_upload_batch",
    {
      title: "Subida de ficheros en lote (batch)",
      description:
        "Sube una lista de imágenes (ficheros locales o URLs remotas) a Strapi en una sola operación. Ideal para galerías de motos o artículos.",
      inputSchema: {
        items: z
          .array(
            z.object({
              source: z
                .string()
                .describe("Ruta local o URL HTTP/HTTPS de la imagen"),
              filename: z.string().optional(),
              alternativeText: z.string().optional(),
              caption: z.string().optional(),
            })
          )
          .describe("Lista de imágenes a subir"),
        commonOpts: uploadOptionsSchema
          .omit({ filename: true, fileInfo: true })
          .optional()
          .describe("Opciones comunes (folderId, folderPath, watermark)"),
      },
      annotations: { openWorldHint: true },
    },
    async ({ items, commonOpts }) =>
      runTool(async () => {
        const mediaLib = getMediaLibrary();
        const targetFolderId = await resolveFolderId(
          mediaLib,
          commonOpts?.folderId,
          commonOpts?.folderPath
        );

        const results = [];
        for (const item of items) {
          const isUrl = /^https?:\/\//i.test(item.source);
          let buffer: Buffer;
          let filename = item.filename;

          if (isUrl) {
            const res = await fetch(item.source);
            if (!res.ok) {
              throw new Error(
                `Error al descargar ${item.source}: ${res.status} ${res.statusText}`
              );
            }
            buffer = Buffer.from(await res.arrayBuffer());
            if (!filename) {
              try {
                const base = path.basename(new URL(item.source).pathname);
                filename = base && base.includes(".") ? base : "imagen.jpg";
              } catch {
                filename = "imagen.jpg";
              }
            }
          } else {
            buffer = fs.readFileSync(item.source);
            if (!filename) {
              filename = path.basename(item.source);
            }
          }

          const processedBuffer = await applyWatermark(
            buffer,
            commonOpts?.watermark
          );

          const uploaded = await mediaLib.uploadBuffer(processedBuffer, filename, {
            folderId: targetFolderId,
            filename,
            fileInfo: {
              alternativeText: item.alternativeText ?? null,
              caption: item.caption ?? null,
              name: filename,
            } as any,
          });
          results.push(...uploaded);
        }

        return results;
      })
  );

  server.registerTool(
    "media_apply_watermark_to_file",
    {
      title: "Añadir marca de agua a fichero local",
      description:
        "Aplica la marca de agua de moto125.cc a una imagen local en disco y guarda el resultado sin subirlo a Strapi. Permite preparar o previsualizar imágenes marcadas antes de decidir subirlas.",
      inputSchema: {
        filePath: z.string().describe("Ruta del fichero de imagen original en disco"),
        outputPath: z
          .string()
          .optional()
          .describe(
            "Ruta destino opcional (por defecto crea una copia con sufijo '-watermark')"
          ),
        opts: watermarkOptionsSchema
          .optional()
          .describe(
            "Configuración de la marca de agua (posición, opacidad, escala, margen)"
          ),
      },
      annotations: { openWorldHint: true },
    },
    async ({ filePath, outputPath, opts }) =>
      runTool(() => applyWatermarkToFile(filePath, outputPath, opts))
  );

  server.registerTool(
    "media_move_file",
    {
      title: "Mover fichero",
      description: "MediaLibrary.moveFile(fileId, newFolderId).",
      inputSchema: {
        fileId: adminIdSchema,
        newFolderId: adminIdSchema.nullable(),
      },
      annotations: { openWorldHint: true },
    },
    async ({ fileId, newFolderId }) =>
      runTool(() => getMediaLibrary().moveFile(fileId, newFolderId))
  );

  server.registerTool(
    "media_delete_file",
    {
      title: "Eliminar fichero",
      description:
        "MediaLibrary.deleteFile — no desvincula coverImage/images en content.",
      inputSchema: { fileId: adminIdSchema },
      annotations: { destructiveHint: true, openWorldHint: true },
    },
    async ({ fileId }) =>
      runTool(async () => {
        await getMediaLibrary().deleteFile(fileId);
        return { ok: true, fileId };
      })
  );
}
