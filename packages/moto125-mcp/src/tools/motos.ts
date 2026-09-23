import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getSdk } from "../client.js";
import { withLightMotoListParams } from "../queryDefaults.js";
import {
  motoCreateInputSchema,
  motoUpdateInputSchema,
  strapiQueryParamsSchema,
} from "../schemas.js";
import { runTool } from "../util.js";

const documentId = z.string().describe("documentId de Strapi");

export function registerMotoTools(server: McpServer) {
  server.registerTool(
    "motos_list",
    {
      title: "Listar motos",
      description:
        "sdk.motos.list. Listado ligero por defecto (fields incl. year, engineType, normativa + company). Precio = priece. Filtros: moto125://docs/filtros-catalogo.",
      inputSchema: { params: strapiQueryParamsSchema.optional() },
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ params }) =>
      runTool(() => getSdk().motos.list(withLightMotoListParams(params)))
  );

  server.registerTool(
    "motos_get_by_id",
    {
      title: "Obtener moto por documentId",
      description: "sdk.motos.getById — detalle con populate por defecto del SDK.",
      inputSchema: {
        documentId,
        params: strapiQueryParamsSchema.optional(),
      },
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ documentId, params }) =>
      runTool(() => getSdk().motos.getById(documentId, params))
  );

  server.registerTool(
    "motos_get_by_moto125_id",
    {
      title: "Obtener moto por moto125Id",
      description: "sdk.motos.getByMoto125Id — id externo estable.",
      inputSchema: {
        moto125Id: z.string().describe("moto125Id"),
        params: strapiQueryParamsSchema.optional(),
      },
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ moto125Id, params }) =>
      runTool(() => getSdk().motos.getByMoto125Id(moto125Id, params))
  );

  server.registerTool(
    "motos_create",
    {
      title: "Crear moto",
      description:
        "sdk.motos.create — modelName + moto125Id; year, engineType, normativa, priece, fichaTecnica (MotoFichaTecnica + unidades UI), images, company, motoType. Ver moto125://docs/ficha-tecnica.",
      inputSchema: { data: motoCreateInputSchema },
      annotations: { openWorldHint: true },
    },
    async ({ data }) => runTool(() => getSdk().motos.create(data))
  );

  server.registerTool(
    "motos_update",
    {
      title: "Actualizar moto",
      description: "sdk.motos.update(documentId, MotoUpdateInput parcial).",
      inputSchema: {
        documentId,
        data: motoUpdateInputSchema,
      },
      annotations: { openWorldHint: true },
    },
    async ({ documentId, data }) =>
      runTool(() => getSdk().motos.update(documentId, data))
  );
}
