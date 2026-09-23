# @moto125/mcp

Servidor MCP de **moto125.cc**. Expone `@moto125/api-client` y `MediaLibrary` (`@moto125/admin-api-client`) sin inventar campos: inputs = tipos del SDK.

- Tools, prompts y resources documentados en **español**
- `params.filters` = sintaxis Strapi real (ejemplos en descriptions + resources)
- Dynamic zone `content[]` tipado (`Text`, `Fortalezas`, `prestaciones`, …)
- Content SDK envuelto con [`@moto125/sdk-disk-cache`](../sdk-disk-cache/README.md) (lecturas en disco + invalidación en writes). Media Admin **sin** caché.

## Entorno

| Variable | Uso |
|---|---|
| `STRAPI_API_URL` (o `MOTO125_API_URL`) | Base URL |
| `STRAPI_API_TOKEN` (o `MOTO125_TOKEN`) | Content API |
| `STRAPI_ADMIN_TOKEN` **o** `STRAPI_ADMIN_EMAIL` + `STRAPI_ADMIN_PASSWORD` | Media |
| `MOTO125_MCP_CACHE` | `0` desactiva caché disco (passthrough). Default: activa |
| `MOTO125_MCP_CACHE_DIR` | Directorio de entradas (default `~/.moto125/mcp-sdk-disk-cache`) |
| `MOTO125_MCP_CACHE_TTL_MS` | TTL por entrada en ms (default `300000`) |

Defaults Content SDK: `publicationState: preview`, `locale: es`.

Con varios agentes/redactores en paralelo: usa `MOTO125_MCP_CACHE=0`, `cache_clear` o `force` en el scan broken. No hay invalidación multi-host.

## Tools (resumen)

| Área | Tools |
|---|---|
| Artículos | `articles_list\|get_by_id\|get_by_slug\|create\|update` |
| Content health | `articles_list_broken_content` (HTML residual / tablas GFM); `articles_list_image_issues` (saltos MD + chrome v1); `force` salta caché |
| Caché | `cache_clear`, `cache_stats` |
| Motos | `motos_list\|get_by_id\|get_by_moto125_id\|create\|update` |
| Marcas | `companies_*` |
| Taxonomías | `article_types_*`, `moto_types_*`, `moto_classes_*` |
| Config/páginas | `config_*`, `pages_home_*`, `pages_ofertas_*`, `pages_about_us_*` |
| Media | `media_*` |

No hay publish tipado (`publishedAt` no está en `ArticleCreateInput`).

## Prompts

- `buscar_articulos`
- `crear_articulo`
- `editar_contenido_articulo`
- `buscar_motos_o_marcas`

## Docs layout (v0.2.1+)

- **Tools:** descriptions cortas (1–3 líneas) + puntero a resources
- **Resources:** cookbooks (`moto125://docs/modelo`, `filtros-articulos`, `filtros-catalogo`, `bloques-contenido`)
- **Prompts:** flujos cortos que apuntan a resources
- **Listas:** `articles_list` / `motos_list` / `companies_list` usan fields ligeros por defecto
- **Errores:** incluyen `detail` de Strapi / axios cuando existe

## Build

```bash
pnpm --filter @moto125/api-client build
pnpm --filter @moto125/admin-api-client build
pnpm --filter @moto125/sdk-disk-cache build
pnpm --filter @moto125/mcp build
```

Tests ligeros del helper de scan cacheado:

```bash
pnpm --filter @moto125/mcp test
```

Tras cambios: rebuild + toggle del MCP en Cursor.
