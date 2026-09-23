import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getDiskStore } from "../client.js";
import { runTool } from "../util.js";

/** Tools de control de la caché disco (`@moto125/sdk-disk-cache`). */
export function registerCacheTools(server: McpServer) {
  server.registerTool(
    "cache_clear",
    {
      title: "Vaciar caché disco MCP",
      description: [
        "Borra todas las entradas de la caché disco del Content SDK y scans auxiliares.",
        "Útil con varios agentes/redactores o tras cambios externos en Strapi.",
        "Ver también MOTO125_MCP_CACHE=0 y force en articles_list_broken_content / articles_list_image_issues.",
      ].join(" "),
      inputSchema: {},
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        openWorldHint: false,
      },
    },
    async () =>
      runTool(async () => {
        const store = getDiskStore();
        await store.clear();
        return { ok: true, dir: store.dir };
      })
  );

  server.registerTool(
    "cache_stats",
    {
      title: "Estadísticas caché disco MCP",
      description:
        "Devuelve dir, enabled y número aproximado de entradas en la caché disco.",
      inputSchema: {},
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async () =>
      runTool(async () => {
        const store = getDiskStore();
        return store.stats();
      })
  );
}
