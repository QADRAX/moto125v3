import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getSdk } from "../client.js";
import { withLightArticleListParams } from "../queryDefaults.js";
import {
  articleCreateInputSchema,
  articleUpdateInputSchema,
  strapiQueryParamsSchema,
} from "../schemas.js";
import { runTool } from "../util.js";

const documentId = z.string().describe("documentId de Strapi");

export function registerArticleTools(server: McpServer) {
  server.registerTool(
    "articles_list",
    {
      title: "Listar artículos",
      description:
        "sdk.articles.list. Por defecto fields ligeros + articleType (sin content). Filtros Strapi en params.filters. Ejemplos: resource moto125://docs/filtros-articulos.",
      inputSchema: { params: strapiQueryParamsSchema.optional() },
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ params }) =>
      runTool(() => getSdk().articles.list(withLightArticleListParams(params)))
  );

  server.registerTool(
    "articles_get_by_id",
    {
      title: "Obtener artículo por documentId",
      description:
        "sdk.articles.getById — artículo completo (content DZ, tags, relaciones). Usar tras listar.",
      inputSchema: {
        documentId,
        params: strapiQueryParamsSchema.optional(),
      },
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ documentId, params }) =>
      runTool(() => getSdk().articles.getById(documentId, params))
  );

  server.registerTool(
    "articles_get_by_slug",
    {
      title: "Obtener artículo por slug",
      description:
        "sdk.articles.getBySlug — colección 0/1. Detalle completo con populate por defecto del SDK.",
      inputSchema: {
        slug: z.string().describe("slug del artículo"),
        params: strapiQueryParamsSchema.optional(),
      },
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ slug, params }) =>
      runTool(() => getSdk().articles.getBySlug(slug, params))
  );

  server.registerTool(
    "articles_create",
    {
      title: "Crear artículo",
      description:
        "sdk.articles.create(ArticleCreateInput). slug obligatorio. Sin publishedAt tipado. Bloques/flujo: moto125://docs/bloques-contenido.",
      inputSchema: { data: articleCreateInputSchema },
      annotations: { openWorldHint: true },
    },
    async ({ data }) => runTool(() => getSdk().articles.create(data))
  );

  server.registerTool(
    "articles_update",
    {
      title: "Actualizar artículo",
      description:
        "sdk.articles.update(documentId, ArticleUpdateInput parcial). content[] = dynamic zone completa a sustituir. Ver moto125://docs/bloques-contenido.",
      inputSchema: {
        documentId,
        data: articleUpdateInputSchema,
      },
      annotations: { openWorldHint: true },
    },
    async ({ documentId, data }) =>
      runTool(() => getSdk().articles.update(documentId, data))
  );
}
