import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getSdk } from "../client.js";
import {
  articleTypeCreateInputSchema,
  articleTypeUpdateInputSchema,
  motoClassCreateInputSchema,
  motoClassUpdateInputSchema,
  motoTypeCreateInputSchema,
  motoTypeUpdateInputSchema,
  strapiQueryParamsSchema,
} from "../schemas.js";
import { runTool } from "../util.js";

const documentId = z.string().describe("documentId de Strapi");

export function registerTaxonomyTools(server: McpServer) {
  server.registerTool(
    "article_types_list",
    {
      title: "Listar tipos de artículo",
      description:
        "sdk.taxonomies.articleTypes.list. Nombres típicos: PRUEBAS, ACTUALIDAD, REPORTAJES… Usar documentId en articleType / filters.",
      inputSchema: { params: strapiQueryParamsSchema.optional() },
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ params }) =>
      runTool(() => getSdk().taxonomies.articleTypes.list(params))
  );

  server.registerTool(
    "article_types_create",
    {
      title: "Crear tipo de artículo",
      description: "sdk.taxonomies.articleTypes.create({ name }).",
      inputSchema: { data: articleTypeCreateInputSchema },
      annotations: { openWorldHint: true },
    },
    async ({ data }) =>
      runTool(() => getSdk().taxonomies.articleTypes.create(data))
  );

  server.registerTool(
    "article_types_update",
    {
      title: "Actualizar tipo de artículo",
      description: "sdk.taxonomies.articleTypes.update.",
      inputSchema: {
        documentId,
        data: articleTypeUpdateInputSchema,
      },
      annotations: { openWorldHint: true },
    },
    async ({ documentId, data }) =>
      runTool(() =>
        getSdk().taxonomies.articleTypes.update(documentId, data)
      )
  );

  server.registerTool(
    "moto_types_list",
    {
      title: "Listar tipos de moto",
      description:
        "sdk.taxonomies.motoTypes.list (populate motoClass, image).",
      inputSchema: { params: strapiQueryParamsSchema.optional() },
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ params }) =>
      runTool(() => getSdk().taxonomies.motoTypes.list(params))
  );

  server.registerTool(
    "moto_types_create",
    {
      title: "Crear tipo de moto",
      description:
        "sdk.taxonomies.motoTypes.create — name, fullName?, image?, motoClass?.",
      inputSchema: { data: motoTypeCreateInputSchema },
      annotations: { openWorldHint: true },
    },
    async ({ data }) =>
      runTool(() => getSdk().taxonomies.motoTypes.create(data))
  );

  server.registerTool(
    "moto_types_update",
    {
      title: "Actualizar tipo de moto",
      description: "sdk.taxonomies.motoTypes.update.",
      inputSchema: {
        documentId,
        data: motoTypeUpdateInputSchema,
      },
      annotations: { openWorldHint: true },
    },
    async ({ documentId, data }) =>
      runTool(() => getSdk().taxonomies.motoTypes.update(documentId, data))
  );

  server.registerTool(
    "moto_classes_list",
    {
      title: "Listar clases de moto",
      description: "sdk.taxonomies.motoClasses.list (rutas /motos/[class]).",
      inputSchema: { params: strapiQueryParamsSchema.optional() },
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ params }) =>
      runTool(() => getSdk().taxonomies.motoClasses.list(params))
  );

  server.registerTool(
    "moto_classes_create",
    {
      title: "Crear clase de moto",
      description: "sdk.taxonomies.motoClasses.create({ name }).",
      inputSchema: { data: motoClassCreateInputSchema },
      annotations: { openWorldHint: true },
    },
    async ({ data }) =>
      runTool(() => getSdk().taxonomies.motoClasses.create(data))
  );

  server.registerTool(
    "moto_classes_update",
    {
      title: "Actualizar clase de moto",
      description: "sdk.taxonomies.motoClasses.update.",
      inputSchema: {
        documentId,
        data: motoClassUpdateInputSchema,
      },
      annotations: { openWorldHint: true },
    },
    async ({ documentId, data }) =>
      runTool(() =>
        getSdk().taxonomies.motoClasses.update(documentId, data)
      )
  );
}
