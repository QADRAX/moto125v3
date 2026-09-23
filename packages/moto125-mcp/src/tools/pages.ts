import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getSdk } from "../client.js";
import {
  aboutUsPageUpdateInputSchema,
  configUpdateInputSchema,
  homePageUpdateInputSchema,
  paginaOfertasUpdateInputSchema,
  strapiQueryParamsSchema,
} from "../schemas.js";
import { runTool } from "../util.js";

export function registerConfigAndPageTools(server: McpServer) {
  server.registerTool(
    "config_get",
    {
      title: "Obtener configuración del sitio",
      description: "sdk.config.get — SEO, logos, hero.",
      inputSchema: { params: strapiQueryParamsSchema.optional() },
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ params }) => runTool(() => getSdk().config.get(params))
  );

  server.registerTool(
    "config_update",
    {
      title: "Actualizar configuración del sitio",
      description:
        "sdk.config.update(ConfigUpdateInput). Afecta SEO/hero globales.",
      inputSchema: { data: configUpdateInputSchema },
      annotations: { destructiveHint: true, openWorldHint: true },
    },
    async ({ data }) => runTool(() => getSdk().config.update(data))
  );

  server.registerTool(
    "pages_home_get",
    {
      title: "Obtener página principal",
      description: "sdk.pages.home.get — featuredArticles + top10speed.",
      inputSchema: { params: strapiQueryParamsSchema.optional() },
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ params }) => runTool(() => getSdk().pages.home.get(params))
  );

  server.registerTool(
    "pages_home_update",
    {
      title: "Actualizar página principal",
      description:
        "sdk.pages.home.update(HomePageUpdateInput). Cambia home pública.",
      inputSchema: { data: homePageUpdateInputSchema },
      annotations: { destructiveHint: true, openWorldHint: true },
    },
    async ({ data }) => runTool(() => getSdk().pages.home.update(data))
  );

  server.registerTool(
    "pages_ofertas_get",
    {
      title: "Obtener página de ofertas",
      description: "sdk.pages.ofertas.get.",
      inputSchema: { params: strapiQueryParamsSchema.optional() },
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ params }) => runTool(() => getSdk().pages.ofertas.get(params))
  );

  server.registerTool(
    "pages_ofertas_update",
    {
      title: "Actualizar página de ofertas",
      description:
        'sdk.pages.ofertas.update — ofertas[] con __component "list.ofertas".',
      inputSchema: { data: paginaOfertasUpdateInputSchema },
      annotations: { destructiveHint: true, openWorldHint: true },
    },
    async ({ data }) => runTool(() => getSdk().pages.ofertas.update(data))
  );

  server.registerTool(
    "pages_about_us_get",
    {
      title: "Obtener página sobre nosotros",
      description: "sdk.pages.aboutUs.get (/sobre-nosotros).",
      inputSchema: { params: strapiQueryParamsSchema.optional() },
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ params }) => runTool(() => getSdk().pages.aboutUs.get(params))
  );

  server.registerTool(
    "pages_about_us_update",
    {
      title: "Actualizar página sobre nosotros",
      description: "sdk.pages.aboutUs.update({ content }).",
      inputSchema: { data: aboutUsPageUpdateInputSchema },
      annotations: { destructiveHint: true, openWorldHint: true },
    },
    async ({ data }) => runTool(() => getSdk().pages.aboutUs.update(data))
  );
}
