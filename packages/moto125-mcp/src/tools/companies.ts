import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getSdk } from "../client.js";
import { withLightCompanyListParams } from "../queryDefaults.js";
import {
  companyCreateInputSchema,
  companyUpdateInputSchema,
  strapiQueryParamsSchema,
} from "../schemas.js";
import { runTool } from "../util.js";

const documentId = z.string().describe("documentId de Strapi");

export function registerCompanyTools(server: McpServer) {
  server.registerTool(
    "companies_list",
    {
      title: "Listar marcas",
      description:
        "sdk.companies.list (UI: /marcas). Listado ligero por defecto. Filtros: moto125://docs/filtros-catalogo.",
      inputSchema: { params: strapiQueryParamsSchema.optional() },
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ params }) =>
      runTool(() =>
        getSdk().companies.list(withLightCompanyListParams(params))
      )
  );

  server.registerTool(
    "companies_get_by_id",
    {
      title: "Obtener marca por documentId",
      description: "sdk.companies.getById.",
      inputSchema: {
        documentId,
        params: strapiQueryParamsSchema.optional(),
      },
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ documentId, params }) =>
      runTool(() => getSdk().companies.getById(documentId, params))
  );

  server.registerTool(
    "companies_create",
    {
      title: "Crear marca",
      description:
        "sdk.companies.create — name obligatorio; phone, url, active, description, image.",
      inputSchema: { data: companyCreateInputSchema },
      annotations: { openWorldHint: true },
    },
    async ({ data }) => runTool(() => getSdk().companies.create(data))
  );

  server.registerTool(
    "companies_update",
    {
      title: "Actualizar marca",
      description: "sdk.companies.update(documentId, CompanyUpdateInput parcial).",
      inputSchema: {
        documentId,
        data: companyUpdateInputSchema,
      },
      annotations: { openWorldHint: true },
    },
    async ({ documentId, data }) =>
      runTool(() => getSdk().companies.update(documentId, data))
  );
}
