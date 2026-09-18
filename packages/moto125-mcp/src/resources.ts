import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  BLOQUES_CONTENIDO,
  FICHA_TECNICA,
  FILTROS_ARTICULOS,
  FILTROS_MARCAS,
  FILTROS_MOTOS,
  FLUJO_CREAR_ARTICULO,
  MODELO_RECURSOS,
} from "./guidance.js";

/** Resources de solo lectura: documentación del dominio para el agente. */
export function registerResources(server: McpServer) {
  server.registerResource(
    "modelo_contenido",
    "moto125://docs/modelo",
    {
      title: "Modelo de contenido moto125",
      description: "Colecciones, singles y convenciones UI/SDK",
      mimeType: "text/markdown",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/markdown",
          text: MODELO_RECURSOS,
        },
      ],
    })
  );

  server.registerResource(
    "filtros_articulos",
    "moto125://docs/filtros-articulos",
    {
      title: "Filtros Strapi para artículos",
      description: "Ejemplos de params.filters para articles_list",
      mimeType: "text/markdown",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/markdown",
          text: `# Filtros artículos\n\n${FILTROS_ARTICULOS}`,
        },
      ],
    })
  );

  server.registerResource(
    "filtros_catalogo",
    "moto125://docs/filtros-catalogo",
    {
      title: "Filtros motos y marcas",
      description: "Ejemplos para motos_list y companies_list",
      mimeType: "text/markdown",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/markdown",
          text: `# Motos\n\n${FILTROS_MOTOS}\n\n# Marcas\n\n${FILTROS_MARCAS}`,
        },
      ],
    })
  );

  server.registerResource(
    "bloques_contenido",
    "moto125://docs/bloques-contenido",
    {
      title: "Dynamic zone de artículos",
      description: "Forma exacta de content[] según ArticleContentBlockInput",
      mimeType: "text/markdown",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/markdown",
          text: `# Bloques de contenido\n\n${BLOQUES_CONTENIDO}\n\n# Flujo crear\n\n${FLUJO_CREAR_ARTICULO}`,
        },
      ],
    })
  );

  server.registerResource(
    "ficha_tecnica",
    "moto125://docs/ficha-tecnica",
    {
      title: "Ficha técnica de moto (unidades)",
      description:
        "MotoFichaTecnica: campos y unidades canónicas para el comparador",
      mimeType: "text/markdown",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/markdown",
          text: FICHA_TECNICA,
        },
      ],
    })
  );
}
