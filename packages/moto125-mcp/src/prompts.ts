import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Prompts cortos: pasos + punteros a resources (sin duplicar cookbooks).
 */
export function registerPrompts(server: McpServer) {
  server.registerPrompt(
    "buscar_articulos",
    {
      title: "Buscar artículos",
      description:
        "Filtrar artículos por título, fecha o tipo con articles_list.",
      argsSchema: {
        criterio: z
          .string()
          .optional()
          .describe("Qué busca el usuario"),
      },
    },
    ({ criterio }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: [
              "Busca artículos con el MCP moto125.",
              criterio ? `Criterio: ${criterio}` : "",
              "1) Lee moto125://docs/filtros-articulos si necesitas ejemplos de filters.",
              "2) articles_list con params.filters (y pagination si hace falta).",
              "3) Si filtras por tipo y no conoces el nombre exacto: article_types_list antes.",
              "4) Para el detalle: articles_get_by_id o articles_get_by_slug.",
            ]
              .filter(Boolean)
              .join("\n"),
          },
        },
      ],
    })
  );

  server.registerPrompt(
    "crear_articulo",
    {
      title: "Crear artículo con bloques",
      description: "Crear artículo con dynamic zone content.",
      argsSchema: {
        tema: z.string().optional().describe("Tema o título"),
        tipo: z.string().optional().describe("Ej. PRUEBAS, ACTUALIDAD"),
      },
    },
    ({ tema, tipo }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: [
              "Crea un artículo moto125 solo con tools tipadas del MCP.",
              tema ? `Tema: ${tema}` : "",
              tipo ? `Tipo: ${tipo}` : "",
              "1) Lee moto125://docs/bloques-contenido (flujo + forma de content[]).",
              "2) article_types_list → documentId de articleType.",
              "3) Opcional: media_* para coverImage; companies_list/motos_list para relaciones.",
              "4) articles_create. Español. Sin publishedAt. Confirma slug/documentId.",
            ]
              .filter(Boolean)
              .join("\n"),
          },
        },
      ],
    })
  );

  server.registerPrompt(
    "editar_contenido_articulo",
    {
      title: "Editar bloques de un artículo",
      description: "Cargar y actualizar content[] de un artículo.",
      argsSchema: {
        slug_o_id: z.string().describe("slug o documentId"),
        instruccion: z.string().optional().describe("Qué cambiar"),
      },
    },
    ({ slug_o_id, instruccion }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: [
              `Edita el artículo: ${slug_o_id}`,
              instruccion ? `Instrucción: ${instruccion}` : "",
              "1) articles_get_by_slug o articles_get_by_id.",
              "2) Consulta moto125://docs/bloques-contenido (Text, Fortalezas, prestaciones).",
              "3) articles_update solo con campos a cambiar.",
            ]
              .filter(Boolean)
              .join("\n"),
          },
        },
      ],
    })
  );

  server.registerPrompt(
    "buscar_motos_o_marcas",
    {
      title: "Buscar motos o marcas",
      description: "Catálogo con motos_list / companies_list.",
      argsSchema: {
        consulta: z.string().optional(),
      },
    },
    ({ consulta }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: [
              consulta ? `Consulta: ${consulta}` : "Busca en el catálogo moto125.",
              "1) Lee moto125://docs/filtros-catalogo.",
              "2) motos_list o companies_list con filters.",
              "3) Detalle: motos_get_by_id / motos_get_by_moto125_id / companies_get_by_id.",
            ]
              .filter(Boolean)
              .join("\n"),
          },
        },
      ],
    })
  );
}
